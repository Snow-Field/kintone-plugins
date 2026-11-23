# 共有パッケージ

## 現行の方針

- 設定画面の骨組みは新しいパッケージ `@kintone-plugin/plugin-shell` に置く。依存の向きは `ui` ← `kintone-utils` ← `plugin-shell` ← 各プラグイン
- `template/` は workspace に入れ、lint・型チェック・CI の対象にする
- kintone の型は公式（`@kintone/dts-gen`・`@kintone/rest-api-client`）を正とし、`kintone-utils` が自前で持つのはレコード画面のイベントの外枠だけにする
- 共有パッケージは `"sideEffects": false` を付け、入口は1つのままにする

詳細は [architecture.md](../architecture.md)。

## 判断履歴

### 2026-11-23 共有パッケージに sideEffects: false を付け、入口は分けない

- 背景: 実行画面のバンドルが約280〜290KB あった。実行画面が kintone-utils から使うのは `onRecordEvents`・`PluginLogger`・`definePluginConfig`・`getKintoneApp` と型だけだが、REST API クライアント・通知・フォームのフックまで入っていた。原因は `package.json` に `sideEffects` が無く、バンドラーが使っていない export を副作用の可能性があるとして残していたこと
- 検討した選択肢: (A) 共有パッケージに `"sideEffects": false` を付ける (B) kintone-utils の入口を実行画面用と設定画面用に分ける
- 決定: (A)。1行の変更で、import の書き方も公開する API も変わらない。desktop.js は age-calculator が 277KB → 83KB、field-controller が 281KB → 87KB になった。auto-numbering は実行画面で REST API クライアントを使うため 291KB → 268KB。`ui`・`plugin-shell` は実行画面から使われていないが、約束をそろえるため同じく付けた
- 却下した理由: (B) は小さくなる量が (A) と同じで、3プラグインと template の import をすべて書き換える必要がある
- 注意: 読み込むだけで動く処理を共有パッケージに置くと、バンドルから消える。置くときは `sideEffects` にそのファイルを書く

### 2026-11-22 MUI の部品は、何かを足すものだけを共通部品にする

- 背景: 今後、MUI から共通部品を足していく前提で、どこまでを共通化するかを決める必要があった。既存の入力部品は、エラーの表示や props の受け方が部品ごとにそろっていなかった
- 検討した選択肢: (1) MUI の部品を片端から共通部品として包む (2) すべて各プラグインで MUI を直接使う (3) 既存のライブラリ `react-hook-form-mui` を使う (4) React Hook Form とのつなぎ・kintone に依存する部品・組み合わせた部品だけを共通化し、見た目はテーマでそろえる
- 決定: (4)。詳細は [architecture.md](../architecture.md) の「共通 UI 部品の方針」
- 却下した理由: (1) は MUI の機能が狭まり、MUI の版を上げるときの手間が増える。(2) はフィールド選択の6か所の重複のように、同じ処理と型の回避が増える。(3) は日付入力の部品（`@mui/x-date-pickers`）も必要になり、必要な部品の数が少ないため、自分で薄く作るほうが依存が少なく、約束事も自分で決められる

### 2026-11-22 プラグイン設定の定義は kintone-utils に置き、読み込みの失敗は設定画面で知らせる

- 背景: plugin-shell を作るにあたり、設定の定義（スキーマ・既定値・移行）の置き場所と、保存済みの設定を読み込めなかったときの扱いを決める必要があった。それまでは `restorePluginConfig` が既定値を返し、失敗はコンソールにしか出ていなかった
- 決定: 定義は kintone-utils の `definePluginConfig` で作る。実行画面からも使うため、React・MUI を含む plugin-shell に置くと実行画面のバンドルに設定画面の部品が入る。読み込みの失敗は、設定画面では警告を出して既定値を表示し、変更しなくても保存できるようにする。実行画面では既定値で動き、原因をコンソールに出す
- 却下した理由: 定義を plugin-shell に置く案は上記のバンドルの理由。実行画面でも利用者に知らせる案（alert など）は、アプリを使う全員に毎回出てしまい、設定する人以外には対処できないため

### 2026-11-21 kintone の型の網羅的な自前定義をやめ、イベントの外枠だけを持つ

- 背景: `kintone-utils/src/types/kintone/` に JavaScript API の型を独自に網羅していた（約1,750行）。kintone の仕様変更に追従し続けることはできない。一方、プラグインが使っていたのは `KintoneRecord` とレコード画面のイベント型18種だけだった
- 検討した選択肢: (1) 現状維持 (2) 全廃して公式の型だけにする (3) 公式の型を正とし、イベントの外枠だけ自前で持つ
- 決定: (3)。公式の `@kintone/dts-gen`（最新の 10.0.0 でも）はイベントハンドラの引数が `any` で、全廃するとプラグインの実行処理で型の検査が効かなくなる。イベントの外枠は kintone の仕様でほとんど変わらず、数十行で済むため、追従の負担は小さい
- 却下した理由: (1) は追従の負担が大きい。(2) は実行処理の型の安全性を失う

### 2026-11-21 設定画面の骨組みを新しいパッケージ plugin-shell に置く

- 背景: 設定画面の骨組み（約13ファイル）が `template/` と3プラグインにコピーされ、版ずれが起きていた
- 検討した選択肢: (A) 新しいパッケージ `plugin-shell` (B) `ui` に入れて `kintone-utils` に依存させる
- 決定: (A)。`ui` を kintone に依存しない見た目だけの部品に保てる
- 却下した理由: (B) は `ui` が kintone に依存し、責務の境界が崩れる

### 2026-11-21 template を workspace に入れて検査の対象にする

- 背景: `template/` が workspace の外にあり、型の誤り（`mobile/index.ts` の import 漏れ）が検出されていなかった
- 検討した選択肢: (A) workspace に入れ、`pnpm gen` で `node_modules` を複製しないようにする (B) CI で template からプラグインを生成して検査する
- 決定: (A)。手元の `pnpm lint` でも検出できる
- 却下した理由: (B) は CI でしか検出できず、手元での確認が遅れる
