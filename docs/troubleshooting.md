# トラブルシューティング

まず **Actions → publish-note-pages → 失敗した実行** を開き、赤いステップのログを確認します。

## `GEMINI_API_KEY が設定されていません`

**Settings → Secrets and variables → Actions** に、名前が完全一致する `GEMINI_API_KEY` を登録します。値をログやソースコードへ貼り付けないでください。

## RSSの取得件数が0件

- `config/sources.json` が正しいJSONか確認する
- RSS URLをブラウザで開けるか確認する
- noteの場合は `https://note.com/ユーザー名/rss` の形式か確認する
- 一部のRSSだけ失敗している場合は、ログに表示された情報源を修正または削除する

## 要約に失敗する

- Gemini APIキーが有効か確認する
- APIの利用上限を確認する
- `AI_MODEL` を指定している場合は、現在利用可能なモデル名か確認する

一部だけ失敗した場合、その記事は掲載済みにしないため次回に再試行されます。

## `configure-pages` または `deploy-pages` が失敗する

1. **Settings → Pages** を開く
2. **Build and deployment → Source** が **GitHub Actions** か確認する
3. **Settings → Actions → General → Workflow permissions** でActionsの実行が組織ポリシーにより制限されていないか確認する
4. フォークの場合はActions自体が有効か確認する

## 実行成功なのにページが見つからない

初回デプロイ後、**Settings → Pages** に公開URLが表示されます。プロジェクトPagesは通常、ルートURLではなく `/リポジトリ名/` 以下です。

## 新着が反映されない

- Actionsの最終実行時刻を確認する
- ログの「新しく掲載する記事」が0件なら、そのURLは既に `data/site-items.json` にあります
- 同じ記事を再処理したい場合は、該当URLのレコードだけを `data/site-items.json` から削除して手動実行する

## ローカルで確認する

```bash
npm test
npm run dry-run
```

`npm run dry-run` 後に `public/index.html` をブラウザで開きます。ドライランではGemini APIを使わず、確認用の仮要約を表示します。
