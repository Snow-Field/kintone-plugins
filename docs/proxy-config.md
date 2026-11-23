# API トークンなどの秘匿（プロキシ設定）

フェーズ2 の要件。auto-numbering の API トークンを秘匿し、あわせて秘匿のためだけの汎用プラグイン `api-proxy` を作る。

> **状態: 共有部分（kintone-utils の `secrets`）と auto-numbering は実装済み、api-proxy は未着手。** 判断の理由は [decisions/proxy-config.md](./decisions/proxy-config.md)。`api-proxy` の設計は、`pnpm gen` でフォルダを作った後に `apps/api-proxy/docs/design.md` へ移す。

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
| 反映のタイミング（2026-11-23 に実機で確認） | 保存した値が `proxy` に付くのは、アプリの設定画面で「アプリを更新」を押した後。押す前は何も付かず、`401 CB_AU01` になる |
| 同じドメインへの `proxy`（2026-11-23 に実機で確認） | 保存した API トークンで、レコードの取得（GET `records.json`）と更新（PUT `record.json`）ができる |
| `proxy` の戻り値（2026-11-23 に実機で確認） | 4xx でも reject されず、`[本文, ステータス, ヘッダー]` で解決する。ステータスは呼び出し側で判定する |

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
| 設定画面の読み込み | 目次を読み、`getProxyConfig` で秘密を読んで、入力欄に伏せ字で表示する。表示の切り替えは、api-proxy を作るときに `ui` の部品として足す（auto-numbering は伏せ字だけ） |
| 保存 | 1. 新しい組を `setProxyConfig` で保存する　2. 前回保存した組のうち今回無いものを `{}` で上書きする　3. 秘密を除いた設定を `setConfig` で保存する。途中で失敗したら `setConfig` は保存せず、保存の失敗として表示する（保存し直せばそろう） |
| エクスポート | 秘密を除いて書き出す |
| インポート | 読み込んだあと、保存済みの秘密のうち URL とメソッドが合うものを埋める |
| リセット | フォームを既定値に戻すだけ。保存したときに、消えた組を `{}` で上書きする |

実装は `kintone-utils` の `definePluginConfig` に渡す `secrets`（`toEntries`・`strip`・`fill`）。前回保存した組のキーは、`setConfig` の予約キー `__proxyKeys` に入れる（プロキシ設定は一覧で読めないため）。plugin-shell は、読み込み・インポート・保存・エクスポートでこれを使う。

## auto-numbering

先に作り、同じドメインへの `proxy` が検証用の kintone で動くことを確かめる。

| 項目 | 要件 |
| --- | --- |
| トークンの保存 | `X-Cybozu-API-Token` をプロキシ設定に保存する（前後の空白は除く）。保存先は採番で使う API だけ（GET `records.json`・GET `record.json`・PUT `record.json`）。`/k/v1/` 全体にすると、利用者が開発者ツールから呼ぶほかの API にもトークンが付くため。URL は `kintone.api.url` で作る（ゲストスペースでは `/k/guest/{スペースID}/v1/`）。`setConfig` にはトークンを空で入れ、`common.useApiToken` を入れる |
| 読み込みとインポート | `useApiToken` に関係なく、保存済みのトークンで欄を埋める（トークンの無いファイルをインポートして保存しても、保存済みのトークンを消さないため） |
| 実行 | `useApiToken` なら `kintone.plugin.app.proxy` で、そうでなければ `kintone.api`（セッション）で呼ぶ。理由は auto-numbering の design.md の ADR-005 |
| ゲストスペース | 対応する（URL は `kintone.api.url` が作る）。実機では未確認 |
| 旧版の設定 | 版を2に上げる。v1 の `apiToken` はフォームの欄に引き継ぎ、設定画面で保存したときにプロキシ設定へ移す。それまでは、実行画面はセッションで呼び、平文のトークンも `setConfig` に残る |

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

2026-11-23 に auto-numbering で確認済み：

- 同じドメインへの `proxy` で、レコードの取得と更新ができる。保存したトークンで採番できる
- 保存した値が開発者ツールの通信とプラグイン設定（`getConfig`）に現れない
- 設定画面を開き直すと、保存済みのトークンが入っている
- エクスポートしたファイルにトークンが無く、それをインポートしてもトークンが消えない

未確認：

- ゲストスペースのアプリ（手元に環境が無い）
- 消した組が `{}` の上書きで無効になる（トークンを消して保存したあと、トークンで呼べなくなる）
