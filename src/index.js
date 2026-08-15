// GitHub Actions とローカル実行の共通エントリーポイント。
// RSSから最新記事を収集し、未掲載の記事だけをGeminiで要約して、
// GitHub Pagesへデプロイする public/index.html を生成する。

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { collectRss } from "./collectors/rss.js";
import { summarizeItems } from "./services/summarizer.js";
import { buildDigestPage } from "./templates/digest-page.js";
import {
  filterNewItems,
  loadSiteItems,
  mergeSiteItems,
  saveSiteItems,
  sortItemsNewestFirst,
} from "./utils/site-store.js";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const SOURCES_PATH = path.join(ROOT_DIR, "config", "sources.json");
const SETTINGS_PATH = path.join(ROOT_DIR, "config", "settings.json");
const SITE_ITEMS_PATH = path.join(ROOT_DIR, "data", "site-items.json");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const INDEX_PATH = path.join(PUBLIC_DIR, "index.html");
const PROMPT_PATH = path.join(ROOT_DIR, "prompts", "article-summary.md");
const STORED_ITEMS_LIMIT = 500;

function readConfigJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    logger.error(
      `${label} が正しいJSON形式ではありません（${err.message}）。カンマや引用符の閉じ忘れがないか確認してください`
    );
    process.exit(2);
  }
}

function positiveInteger(value, fallback, label) {
  if (Number.isInteger(value) && value > 0) return value;
  logger.warn(`${label} が不正な値です（${value}）。既定値${fallback}で続行します`);
  return fallback;
}

function writePage(items, generatedAt) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(INDEX_PATH, buildDigestPage(items, generatedAt), "utf-8");
  fs.writeFileSync(path.join(PUBLIC_DIR, ".nojekyll"), "", "utf-8");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const generatedAt = new Date();
  const sources = readConfigJson(SOURCES_PATH, "config/sources.json");
  const settings = readConfigJson(SETTINGS_PATH, "config/settings.json");
  const maxItems = positiveInteger(settings?.maxItems, 5, "config/settings.json のmaxItems");
  const maxSiteItems = positiveInteger(
    settings?.maxSiteItems,
    60,
    "config/settings.json のmaxSiteItems"
  );

  logger.info(dryRun ? "ドライランモードで実行します" : "通常モードで実行します");

  if (!dryRun && !process.env.GEMINI_API_KEY) {
    logger.error("環境変数が不足しています: GEMINI_API_KEY");
    process.exit(2);
  }
  if (dryRun) logger.info("ドライランのためGemini APIは呼び出しません");

  if (settings?.includeYouTube) logger.warn("YouTubeの収集は未実装です");
  if (settings?.includeNote) {
    logger.warn("専用noteコレクターは未実装です。noteのURLはrss設定へ追加してください");
  }
  if (settings?.includeNews) logger.warn("ニュースサイトの収集は未実装です");

  logger.info("1/4 RSSから記事を収集します");
  const collected =
    settings?.includeRss === false ? [] : await collectRss(sources, settings, logger);

  if (dryRun && collected.length < 3) {
    logger.error(`RSSの取得件数が足りません（${collected.length}件・3件以上が必要）`);
    process.exit(3);
  }
  if (!dryRun && collected.length === 0) {
    logger.error("RSSの取得件数が0件でした");
    process.exit(3);
  }
  logger.info(`収集完了: ${collected.length}件`);

  const sortedCollected = sortItemsNewestFirst(collected);

  if (dryRun) {
    const previewItems = sortedCollected.slice(0, maxItems);
    logger.info(`2/4 ドライラン対象を${previewItems.length}件に絞りました`);
    const summarized = await summarizeItems(previewItems, {
      dryRun: true,
      env: process.env,
      promptPath: PROMPT_PATH,
      log: logger,
    });
    logger.info(`3/4 確認用要約を${summarized.length}件作成しました`);
    writePage(summarized.slice(0, maxSiteItems), generatedAt);
    logger.info("4/4 GitHub Pagesの確認用HTMLを生成しました");
    console.log(`取得件数: ${collected.length}`);
    console.log(`掲載件数: ${summarized.length}`);
    console.log(`プレビューの保存先: ${INDEX_PATH}`);
    return;
  }

  logger.info("2/4 掲載済みの記事を確認します");
  const stored = loadSiteItems(SITE_ITEMS_PATH, logger);
  const newItems = sortItemsNewestFirst(filterNewItems(sortedCollected, stored)).slice(0, maxItems);
  logger.info(`新しく掲載する記事: ${newItems.length}件`);

  let summarizedItems = [];
  if (newItems.length > 0) {
    logger.info("3/4 新着記事をGeminiで要約します");
    try {
      const results = await summarizeItems(newItems, {
        dryRun: false,
        env: process.env,
        promptPath: PROMPT_PATH,
        log: logger,
      });
      summarizedItems = results.filter((item) => !item.summaryFailed);
      const failedCount = results.length - summarizedItems.length;
      if (failedCount > 0) {
        logger.warn(`${failedCount}件の要約に失敗したため、次回の実行で再試行します`);
      }
    } catch (err) {
      logger.error(`要約処理に失敗しました: ${err.message}`);
      process.exit(4);
    }
  } else {
    logger.info("3/4 未掲載の新着記事がないため、Gemini APIは呼び出しません");
  }

  const updatedStore = mergeSiteItems(summarizedItems, stored, STORED_ITEMS_LIMIT, generatedAt);
  if (summarizedItems.length > 0) saveSiteItems(SITE_ITEMS_PATH, updatedStore);

  const pageItems = sortItemsNewestFirst(updatedStore.items).slice(0, maxSiteItems);
  writePage(pageItems, generatedAt);
  logger.info(`4/4 GitHub Pages用HTMLを生成しました（掲載${pageItems.length}件）`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(`予期しないエラーが発生しました: ${err.message}`);
    process.exit(1);
  });
