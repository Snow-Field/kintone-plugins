# API プロキシ設定プラグイン（api-proxy）

API トークンなどの秘密を、アプリの利用者から見えないプロキシ設定に保存するプラグインです。JS カスタマイズや他のプラグインから `kintone.plugin.app.proxy` を呼ぶと、kintone のサーバーが保存した値をリクエストに付けます。

要件と、守れるもの・守れないものは [docs/proxy-config.md](../../docs/proxy-config.md) の「api-proxy」を参照してください。

## 注意

- 値は見えませんが、アプリを開ける利用者は誰でも、登録した URL とメソッドの範囲で、その値の権限を使えます（開発者ツールから proxy を呼べるため）
- kintone の API トークンは利用者本人の権限とは別に働きます。トークンの権限は必要なものだけにし、アプリ管理の権限は付けないでください
- 絞りたいときは、URL をパスまで具体的に書き（例: `https://{サブドメイン}.cybozu.com/k/v1/records.json`）、メソッドを減らします

## 使い方

1. アプリにプラグインを追加し、設定画面の「接続先」に URL・メソッド・ヘッダー・データを登録して保存する
2. アプリの設定画面で「アプリを更新」を押す（押すまで値は付きません）
3. 設定画面の「使い方」タブで、プラグイン ID と呼び出しの例をコピーする
4. レコードの画面（一覧・詳細・追加・編集など）で動く JS カスタマイズから呼ぶ

```js
const PLUGIN_ID = '（使い方タブのプラグイン ID）';

// kintone の REST API（接続先: https://{サブドメイン}.cybozu.com/k/v1/、ヘッダー: X-Cybozu-API-Token）
kintone.events.on('app.record.index.show', async (event) => {
  const url = kintone.api.url('/k/v1/records.json', true) + '?app=' + kintone.app.getId();
  const [body, status] = await kintone.plugin.app.proxy(PLUGIN_ID, url, 'GET', {}, {});
  // proxy は 4xx・5xx でも失敗にならないので、ステータスを確かめる
  if (status < 200 || status >= 300) throw new Error(body);
  const { records } = JSON.parse(body);
  console.log(records);
  return event;
});
```

- 呼び出し側の `headers` には秘密を書きません（保存した値が付きます）
- POST・PUT でデータを保存したときは、本文をオブジェクトで渡します（文字列で渡すと、保存した値が足されません）
- `proxy` はプラグインを追加したアプリの画面でだけ値が付きます。アプリ X からアプリ Y を操作するなら、X のプラグイン設定に Y のトークンを登録します

## 開発

[リポジトリの CLAUDE.md](../../CLAUDE.md) の開発コマンドを参照してください。
