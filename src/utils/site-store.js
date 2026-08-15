import fs from "node:fs";
import path from "node:path";

export function normalizeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || ["gclid", "fbclid", "ref", "ref_src"].includes(lower)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString().replace(/\?$/, "");
  } catch {
    return String(url);
  }
}

export function loadSiteItems(filePath, log) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!parsed || !Array.isArray(parsed.items)) throw new Error("items配列がありません");
    return parsed;
  } catch (err) {
    log?.warn(`掲載済み記事データを読み込めないため空として扱います: ${err.message}`);
    return { items: [] };
  }
}

export function filterNewItems(items, stored) {
  const seen = new Set((stored?.items ?? []).map((item) => normalizeUrl(item.url)));
  const result = [];
  for (const item of items ?? []) {
    const key = normalizeUrl(item.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function sortItemsNewestFirst(items) {
  return [...(items ?? [])].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt || a.publishedToSiteAt || "") || 0;
    const bTime = Date.parse(b.publishedAt || b.publishedToSiteAt || "") || 0;
    return bTime - aTime;
  });
}

export function mergeSiteItems(newItems, stored, limit = 500, now = new Date()) {
  const compactNewItems = (newItems ?? []).map((item) => ({
    title: item.title,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    summary: item.summary,
    publishedToSiteAt: now.toISOString(),
  }));
  const seen = new Set();
  const merged = [];

  for (const item of [...compactNewItems, ...(stored?.items ?? [])]) {
    const key = normalizeUrl(item.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return { items: sortItemsNewestFirst(merged).slice(0, limit) };
}

export function saveSiteItems(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}
