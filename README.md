# note新着記事をGitHub Pagesへ自動公開

登録したRSSから新着記事を集め、Geminiで日本語要約を作り、GitHub Pagesへ毎朝公開します。メールとResendは使用しません。

```text
GitHub Actions（毎朝5:07ごろ）
        ↓
登録したRSSから新着記事を取得
        ↓
未掲載の記事だけGeminiで要約
        ↓
静的HTMLを生成してGitHub Pagesへ公開
```

## 必要なもの

| 項目 | 用途 |
|---|---|
| GitHubアカウント | ActionsとPagesの実行 |
| Gemini APIキー | 記事の日本語要約 |

Resendアカウント、メールアドレス、`RESEND_API_KEY`、`EMAIL_FROM`、`EMAIL_TO`は不要です。

## 最初の設定

1. GitHubのリポジトリで **Settings → Pages** を開く
2. **Build and deployment → Source** を **GitHub Actions** にする
3. **Settings → Secrets and variables → Actions** で `GEMINI_API_KEY` を登録する
4. **Actions → publish-note-pages → Run workflow** を実行する
5. 実行完了後、**Settings → Pages** に表示されるURLを開く

詳しい手順は [docs/setup-guide.md](docs/setup-guide.md) を参照してください。

## カスタマイズ

- RSS: `config/sources.json`
- 1回に新規要約する上限: `config/settings.json` の `maxItems`
- ページに表示する上限: `config/settings.json` の `maxSiteItems`
- 実行時刻: `.github/workflows/daily-digest.yml`

noteクリエイターのRSSは通常 `https://note.com/ユーザー名/rss` です。現在登録済みのRSSはそのまま引き継いでいます。

## 掲載済み記事の管理

`data/site-items.json` に記事URLと要約を最大500件保存します。掲載済みURLは次回以降に再要約しないため、Gemini APIの無駄な呼び出しを抑えられます。生成した `public/` はコミットせず、Actionsの成果物としてPagesへ直接デプロイします。

## ローカル確認

```bash
npm install
npm test
npm run dry-run
```

`npm run dry-run` は実際のRSSへアクセスしますが、Gemini APIは呼びません。生成結果は `public/index.html` で確認できます。

## ドキュメント

- [セットアップガイド](docs/setup-guide.md)
- [GitHub Actionsの仕組み](docs/github-actions-overview.md)
- [トラブルシューティング](docs/troubleshooting.md)

## ライセンス

セミナー配布用のサンプルを、GitHub Pages出力向けに調整したものです。
