import { escapeHtml } from "../utils/format.js";

const JST = "Asia/Tokyo";

function formatGeneratedAt(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatArticleDate(value) {
  if (!value) return "公開日不明";
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function safeArticleUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "#";
  } catch {
    return "#";
  }
}

function articleCard(item) {
  const summary = escapeHtml(item.summary || "要約はありません").replace(/\n/g, "<br>");
  const publishedAt = escapeHtml(item.publishedAt || "");
  const articleUrl = escapeHtml(safeArticleUrl(item.url));
  return `
        <article class="card">
          <div class="meta">
            <span class="source">${escapeHtml(item.source || "その他")}</span>
            <time datetime="${publishedAt}">${escapeHtml(formatArticleDate(item.publishedAt))}</time>
          </div>
          <h2><a href="${articleUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h2>
          <p class="summary">${summary}</p>
          <a class="read-more" href="${articleUrl}" target="_blank" rel="noopener noreferrer">記事を読む <span aria-hidden="true">↗</span></a>
        </article>`;
}

export function buildDigestPage(items, generatedAt = new Date()) {
  const safeItems = Array.isArray(items) ? items : [];
  const cards = safeItems.length
    ? safeItems.map(articleCard).join("")
    : `<div class="empty"><p>掲載できる新着記事はまだありません。</p></div>`;
  const updated = formatGeneratedAt(generatedAt);

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="noteを中心とした新着記事を毎朝まとめてお届けします。">
  <meta name="color-scheme" content="light">
  <title>新着記事ダイジェスト</title>
  <style>
    :root { --ink:#17211b; --muted:#607067; --line:#dbe5de; --paper:#f5f8f5; --card:#fff; --accent:#20a36a; --accent-dark:#126e48; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--paper); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif; line-height:1.75; }
    a { color:inherit; }
    .hero { padding:64px 20px 46px; background:linear-gradient(145deg,#123d2b 0%,#1a6545 58%,#20a36a 100%); color:#fff; }
    .hero-inner, main, footer { width:min(1040px, calc(100% - 40px)); margin:0 auto; }
    .eyebrow { margin:0 0 10px; color:#bff7d9; font-size:.78rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
    h1 { margin:0; font-size:clamp(2rem,6vw,4rem); line-height:1.15; letter-spacing:-.035em; }
    .lead { max-width:620px; margin:18px 0 0; color:#e3f5ea; font-size:1rem; }
    .status { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:24px; color:#d3ecdd; font-size:.86rem; }
    main { padding:42px 0 64px; }
    .section-head { display:flex; align-items:end; justify-content:space-between; gap:20px; margin-bottom:20px; }
    .section-head h2 { margin:0; font-size:1.15rem; }
    .count { color:var(--muted); font-size:.86rem; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
    .card { display:flex; flex-direction:column; min-height:280px; padding:24px; border:1px solid var(--line); border-radius:18px; background:var(--card); box-shadow:0 8px 28px rgba(18,62,43,.06); }
    .meta { display:flex; align-items:center; justify-content:space-between; gap:12px; color:var(--muted); font-size:.78rem; }
    .source { overflow:hidden; padding:4px 9px; border-radius:999px; color:var(--accent-dark); background:#e6f6ed; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
    .card h2 { margin:17px 0 12px; font-size:1.2rem; line-height:1.55; }
    .card h2 a { text-decoration:none; }
    .card h2 a:hover, .card h2 a:focus-visible { color:var(--accent-dark); text-decoration:underline; text-underline-offset:4px; }
    .summary { margin:0 0 22px; color:#3f4d45; font-size:.93rem; }
    .read-more { margin-top:auto; color:var(--accent-dark); font-size:.88rem; font-weight:800; text-decoration:none; }
    .read-more:hover, .read-more:focus-visible { text-decoration:underline; text-underline-offset:4px; }
    .empty { padding:56px 24px; border:1px dashed var(--line); border-radius:18px; color:var(--muted); background:#fff; text-align:center; }
    footer { padding:0 0 42px; color:var(--muted); font-size:.78rem; text-align:center; }
    @media (max-width:720px) { .hero { padding-top:48px; } .hero-inner, main, footer { width:min(100% - 28px,1040px); } .grid { grid-template-columns:1fr; } .card { min-height:auto; } }
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <p class="eyebrow">Daily reading list</p>
      <h1>新着記事<br>ダイジェスト</h1>
      <p class="lead">登録したRSSから新着記事を集め、生成AIによる日本語要約と一緒に掲載しています。</p>
      <div class="status"><span>毎朝 5:07ごろ更新</span><span>最終生成: ${escapeHtml(updated)} JST</span></div>
    </div>
  </header>
  <main>
    <div class="section-head"><h2>最新の記事</h2><span class="count">${safeItems.length}件を掲載</span></div>
    <div class="grid">${cards}
    </div>
  </main>
  <footer>GitHub Actions × GitHub Pages</footer>
</body>
</html>`;
}
