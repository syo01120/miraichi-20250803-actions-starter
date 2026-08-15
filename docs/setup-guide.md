# セットアップガイド

この手順で、登録したRSSの新着記事と日本語要約を毎朝GitHub Pagesへ公開できます。

## Step 1. Actionsを有効にする

フォークしたリポジトリでは、最初に **Actions** タブを開き、無効になっている場合は **I understand my workflows, go ahead and enable them** を押します。

## Step 2. Gemini APIキーを登録する

1. [Google AI Studio](https://aistudio.google.com/) でAPIキーを作成する
2. GitHubのリポジトリで **Settings → Secrets and variables → Actions** を開く
3. **New repository secret** を押す
4. Nameを `GEMINI_API_KEY`、Secretを取得したキーにして保存する

モデルを変更するときだけ、任意で `AI_MODEL` もRepository secretとして登録します。

APIキーはコードやコミットに書かないでください。以前メール送信に使っていたResend関連のSecretsは、この構成では参照しないため削除して構いません。

## Step 3. GitHub Pagesを有効にする

1. **Settings → Pages** を開く
2. **Build and deployment** の **Source** で **GitHub Actions** を選ぶ

GitHub Pagesの公開URLは通常 `https://ユーザー名.github.io/リポジトリ名/` です。正確なURLは初回デプロイ後のPages画面またはActionsのデプロイ結果に表示されます。

## Step 4. 初回デプロイを実行する

1. **Actions** タブを開く
2. 左側の **publish-note-pages** を選ぶ
3. **Run workflow → Run workflow** を押す
4. `build` と `deploy` が緑のチェックになるまで待つ
5. 表示されたPages URLを開く

初回は最大15件を要約するため、Gemini APIの呼び出し間隔を含めて数分かかります。

## Step 5. RSSを変更する

`config/sources.json` の `rss` 配列を編集します。

```json
{
  "rss": [
    { "name": "表示名", "url": "https://note.com/username/rss" }
  ]
}
```

## Step 6. 件数や時刻を変更する

`config/settings.json` には次の2項目があります。

- `maxItems`: 1回の実行で新しく要約する最大件数
- `maxSiteItems`: Pagesに表示する最大件数

定期実行は `.github/workflows/daily-digest.yml` のcronで設定します。現在は `7 20 * * *`、つまり日本時間の毎朝5:07です。GitHub Actionsの混雑により、実際の開始は遅れることがあります。
