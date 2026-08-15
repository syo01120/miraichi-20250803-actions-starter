import test from "node:test";
import assert from "node:assert/strict";
import { buildDigestPage } from "../src/templates/digest-page.js";

const sampleItems = [
  {
    title: "クラウド & <セキュリティ> の最新動向",
    url: "https://example.com/articles/2?x=1&y=2",
    source: "サンプルnote",
    publishedAt: "2026-08-03",
    summary: "1行目\n2行目\n3行目",
  },
];

test("記事タイトル・情報源・件数を表示する", () => {
  const html = buildDigestPage(sampleItems, new Date("2026-08-02T20:45:00Z"));
  assert.ok(html.includes("サンプルnote"));
  assert.ok(html.includes("1件を掲載"));
  assert.ok(html.includes("2026年8月3日"));
});

test("HTML特殊文字をエスケープし、要約の改行を維持する", () => {
  const html = buildDigestPage(sampleItems, new Date("2026-08-02T20:45:00Z"));
  assert.ok(!html.includes("<セキュリティ>"));
  assert.ok(html.includes("&lt;セキュリティ&gt;"));
  assert.ok(html.includes("x=1&amp;y=2"));
  assert.ok(html.includes("1行目<br>2行目<br>3行目"));
});

test("記事が0件でも空状態のページを生成できる", () => {
  const html = buildDigestPage([], new Date("2026-08-02T20:45:00Z"));
  assert.ok(html.includes("掲載できる新着記事はまだありません"));
  assert.ok(html.includes("0件を掲載"));
});

test("HTTP以外の記事URLはリンクとして出力しない", () => {
  const html = buildDigestPage(
    [{ ...sampleItems[0], url: "javascript:alert(1)" }],
    new Date("2026-08-02T20:45:00Z")
  );
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes('href="#"'));
});
