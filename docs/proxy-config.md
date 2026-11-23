# API トークンなどの秘匿（プロキシ設定）

フェーズ2 の要件。auto-numbering の API トークンを秘匿し、あわせて秘匿のためだけの汎用プラグイン `api-proxy` を作る。

> **状態: 要件は確定、未実装。** 判断の理由は [decisions/proxy-config.md](./decisions/proxy-config.md)。`api-proxy` の設計は、`pnpm gen` でフォルダを作った後に `apps/api-proxy/docs/design.md` へ移す。

## 前提となる kintone の仕様

| 項目 | 内容 |
| --- | --- |
| 通常のプラグイン設定（`setConfig`） | 実行画面で `getConfig` から読めるため、アプリを使う全員がブラウザで値を見られる。秘密を入れない |
| プロキシ設定の保存（`setProxyConfig(url, method, headers, data, callback)`） | PC のプラグイン設定画面でだけ使える。同じ URL とメソッドの組は上書きされる。`data` の値にオブジェクトは使えない。`callback` を省くとプラグイン一覧の画面に移るため、必ず渡す |
| プロキシ設定の読み込み（`getProxyConfig(url, method)`） | 設定画面でだけ使える。URL とメソッドを指定して1件ずつ読む。保存済みの組を一覧で取る API は無い。ヘッダーの値は文字列で返る |
| プロキシ設定の削除 | API が無い。空のヘッダーと本文（`{}`）で上書きして無効にする |
| 実行（`kintone.plugin.app.proxy(pluginId, url, method, headers, data)`） | PC・モバイルの一覧・詳細・追加・編集などの画面で使える。kintone のサーバーが、保存した値を付けて送る |
| 保存した値が付く条件 | アプリ・プラグイン ID・メソッドが同じで、URL が保存した URL に前方一致（大文字小文字を区別）する。複数が当てはまれば、長く一致したものが使われる。値の重なりは保存した値が優先される。GET・DELETE では保存した本文がクエリ文字列として付く |
| 実行の制限 | メソッドは GET・POST・PUT・DELETE だけ。応答の本文は文字列（10MB まで）で、バイナリは受け取れない。利用者のセッションと Cookie は付かない |
| 同じドメインの kintone REST API | 公式は `kintone.api` を案内している。IP アドレス制限のある環境では kintone の IP を許可する必要があり、推奨されない |
| API トークン | `X-Cybozu-API-Token` にカンマ区切りで9個まで指定できる。トークンでの操作は「Administrator による操作」として記録される |

出典: cybozu developer network の [setProxyConfig](https://cybozu.dev/ja/kintone/docs/js-api/plugins/set-config-for-proxy/)・[kintone.plugin.app.proxy](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)・[getProxyConfig](https://cybozu.dev/ja/kintone/docs/js-api/plugins/get-config-for-proxy/)・[認証](https://cybozu.dev/ja/kintone/docs/rest-api/overview/authentication/)。

### 秘匿できる範囲

秘匿できるのは値だけで、使えることは隠せない。利用者が開発者ツールから `kintone.plugin.app.proxy` を呼べば、そのトークンの権限でリクエストを送れる。API トークンの権限は必要な操作だけに絞る（設定画面にも、その旨を書く）。

## 保存の構成（両プラグイン共通）

秘密は `setProxyConfig` に、秘密でない目次は `setConfig` に分けて保存する。

| 保存先 | 入れるもの |
| --- | --- |
| `setConfig` | 目次。タブの種類・アプリ ID・ゲストスペース ID・URL・メソッド・メモ・トークンを設定したかどうか。秘密は入れない |
| `setProxyConfig` | トークン・ヘッダー・本文 |

| 操作 | 振る舞い |
| --- | --- |
| 設定画面の読み込み | 目次を読み、行ごとに `getProxyConfig` で秘密を読んで、入力欄に伏せ字で表示する（切り替えで見られる） |
| 保存 | 1. 新しい組を `setProxyConfig` で保存する　2. 前回の目次にあって今回無い組を `{}` で上書きする　3. 目次を `setConfig` で保存する。途中で失敗したら、どこまで保存したかを表示する |
| エクスポート | 目次だけを書き出す。秘密は含めない |
| インポート | 目次を読み込む。秘密は空になるため入れ直す（auto-numbering のトークンは今の値のまま） |
| リセット | フォームを既定値に戻すだけ。保存したときに、消えた組を `{}` で上書きする |

この保存・読み込み・無効化の処理は2つのプラグインで使うので、共有パッケージに置く。kintone の API の部分は `kintone-utils` に、フォームへの組み込みは `plugin-shell` に置く。`plugin-shell` は、秘密の項目をフォームでは扱い、`setConfig` とエクスポートには入れない形にする（API の形は実装時に決める）。

## auto-numbering

先に作り、同じドメインへの `proxy` が検証用の kintone で動くことを確かめる。

| 項目 | 要件 |
| --- | --- |
| トークンの保存 | `common.apiToken` をやめ、`X-Cybozu-API-Token` をプロキシ設定に保存する。GET と PUT を、自アプリの REST API の URL（`kintone.api.url` で作る。ゲストスペースでは `/k/guest/{スペースID}/v1/`）に対して保存する |
| 実行 | トークンを設定していれば `kintone.plugin.app.proxy(kintone.$PLUGIN_ID, ...)` で REST API を呼ぶ。設定していなければ、今と同じくセッションで呼ぶ |
| API の呼び出し | `proxy` は `@kintone/rest-api-client` に載らないため、取得と更新を薄いラッパーに替える（JSON の解析とステータスの判定を含む）。design.md の ADR-004 を見直す |
| ゲストスペース | 対応する。今の `RestAPIClient` は `guestSpaceId` を渡していないため、ゲストスペースのアプリで動かないと思われる（未確認） |
| 旧版の設定 | 版を上げて `apiToken` を消す。保存済みのトークンは移さず、入れ直す（本番環境が無いため） |

## api-proxy（汎用プラグイン）

JS カスタマイズや他のプラグインから `kintone.plugin.app.proxy` を呼ぶときの、秘密の置き場所。プラグイン自身は実行画面の処理を持たない。呼び出す側は、プラグイン ID を書いて `proxy` を呼ぶ（README に例を書く）。値が付くのはこのプラグインを入れたアプリから呼んだときだけなので、アプリ X からアプリ Y を操作するなら、X のプラグイン設定に Y のトークンを登録する。

### kintone REST API タブ

| 項目 | 要件 |
| --- | --- |
| 行 | 対象アプリ ID・ゲストスペース ID（任意）・API トークン・メモ |
| 保存 | 行を REST API の URL ごと（`/k/v1/`、または `/k/guest/{スペースID}/v1/`）にまとめ、トークンをカンマでつないで、GET・POST・PUT・DELETE の4つに保存する。メソッドは選ばせない（できることはトークンの権限で絞る） |
| 検証 | 同じ URL にまとまるトークンは9個まで。同じアプリ ID の重複は禁止 |

### 外部 API タブ

| 項目 | 要件 |
| --- | --- |
| 行 | URL・メソッド・ヘッダー（JSON）・本文（JSON）・メモ |
| 検証 | 同じ URL とメソッドの組は禁止。JSON はオブジェクトであること。本文の値にオブジェクトは禁止。`{自ドメイン}/k/` で始まる URL は禁止（前方一致では長く一致した設定が使われるため、kintone タブのトークンを上書きしてしまう） |
| 注意書き | URL とメモは目次に入り、利用者から見えるので、秘密を書かない |

## 実機で確かめること

- 同じドメインへの `proxy` で、レコードの取得と更新ができる（ゲストスペースのアプリを含む）
- 保存した値が開発者ツールの通信とプラグイン設定（`getConfig`）に現れない
- 消した組が `{}` の上書きで無効になる
