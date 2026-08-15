import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  filterNewItems,
  loadSiteItems,
  mergeSiteItems,
  normalizeUrl,
  saveSiteItems,
  sortItemsNewestFirst,
} from "../src/utils/site-store.js";

test("normalizeUrlはトラッキング情報・ハッシュ・末尾スラッシュを除去する", () => {
  assert.equal(
    normalizeUrl("https://Example.com/a/?utm_source=x#top"),
    "https://example.com/a"
  );
});

test("filterNewItemsは掲載済みURLと入力内の重複を除外する", () => {
  const stored = { items: [{ url: "https://example.com/a", title: "A" }] };
  const items = [
    { url: "https://example.com/a?utm_source=x", title: "A2" },
    { url: "https://example.com/b", title: "B" },
    { url: "https://example.com/b#fragment", title: "B2" },
  ];
  assert.deepEqual(filterNewItems(items, stored).map((item) => item.title), ["B"]);
});

test("mergeSiteItemsは表示に必要な項目だけを保存して公開日順に並べる", () => {
  const stored = {
    items: [
      {
        title: "old",
        url: "https://example.com/old",
        source: "sample",
        publishedAt: "2026-08-01",
        summary: "old summary",
        publishedToSiteAt: "2026-08-01T00:00:00.000Z",
      },
    ],
  };
  const merged = mergeSiteItems(
    [
      {
        title: "new",
        url: "https://example.com/new",
        source: "sample",
        publishedAt: "2026-08-03",
        summary: "new summary",
        content: "保存しない本文",
      },
    ],
    stored,
    10,
    new Date("2026-08-03T00:00:00.000Z")
  );
  assert.deepEqual(merged.items.map((item) => item.title), ["new", "old"]);
  assert.equal("content" in merged.items[0], false);
  assert.equal(merged.items[0].publishedToSiteAt, "2026-08-03T00:00:00.000Z");
});

test("保存した掲載データを読み戻せる", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-store-test-"));
  const file = path.join(dir, "site-items.json");
  const data = { items: [{ url: "https://example.com/a" }] };
  saveSiteItems(file, data);
  assert.deepEqual(loadSiteItems(file), data);
});

test("sortItemsNewestFirstは公開日の新しい順に並べる", () => {
  const sorted = sortItemsNewestFirst([
    { title: "old", publishedAt: "2026-08-01" },
    { title: "new", publishedAt: "2026-08-03" },
  ]);
  assert.deepEqual(sorted.map((item) => item.title), ["new", "old"]);
});
