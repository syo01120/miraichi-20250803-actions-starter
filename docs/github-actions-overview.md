# GitHub ActionsとGitHub Pagesの仕組み

`publish-note-pages` ワークフローは、手動実行または毎日20:07 UTC（日本時間の翌朝5:07）に動きます。

## buildジョブ

1. リポジトリをチェックアウトする
2. Node.js 20と依存関係を準備する
3. `GEMINI_API_KEY` が設定されていることを確認する
4. RSSを取得し、未掲載の記事だけをGeminiで要約する
5. `public/index.html` を生成する
6. 掲載済み記事を `data/site-items.json` へコミットバックする
7. `public/` をPages用artifactとしてアップロードする

## deployジョブ

buildが成功した後、artifactを `github-pages` environmentへデプロイします。公開に必要な権限はワークフロー内の `pages: write` と `id-token: write` に限定しています。

## 重複防止

記事URLを正規化して `data/site-items.json` と比較します。既に掲載した記事はページには残りますが、Geminiで再要約しません。新着がない日も保存済みの記事からページを再生成できます。

## 時刻について

GitHub ActionsのcronはUTCです。

```yaml
- cron: "7 20 * * *" # 20:07 UTC = 翌日5:07 JST
```

スケジュール実行は分単位の正確なタイマーではなく、GitHub側の混雑によって遅れることがあります。必要ならActionsタブからいつでも手動実行できます。
