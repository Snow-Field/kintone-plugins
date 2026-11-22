# ロードマップ

個人開発のため、納期と本番環境は無い。検証用の kintone 環境だけを使う。

## フェーズ

実施順は 0 → 1 → 3 → 2。

| フェーズ | 内容                                                                         | 状態                   |
| -------- | ---------------------------------------------------------------------------- | ---------------------- |
| 0        | 開発環境の再整備                                                             | 進行中                 |
| 1        | 共通パッケージ（`packages/`）の改修と、各プラグインのアーキテクチャの統一    | 未着手                 |
| 3        | API トークンを秘匿するプラグインの新規開発                                   | 未着手（詳細は未確定） |
| 2        | 各プラグイン（age-calculator / field-controller / auto-numbering）の開発再開 | 未着手                 |

## フェーズ0: 開発環境の再整備

- [x] `develop` ブランチの作成
- [x] Node のバージョン固定（`mise.toml`）
- [x] lint エラーの解消
- [x] README・CLAUDE.md・docs の整備
- [x] `manifest.json` の `homepage_url` を現在の GitHub アカウントに合わせる
- [x] テスト（Vitest）の導入
- [x] CI（GitHub Actions）の導入
- [ ] 各プラグインの `.env` と `private.ppk` の作り直し（利用者が `pnpm run init` を実行する）
- [x] GitHub での `main`・`develop` のブランチ保護

## フェーズ1: アーキテクチャの統一

React の共通コンポーネント（`packages/ui`）と共通ロジック（`packages/kintone-utils`）を使い回して開発効率を上げることが、このリポジトリの目的の一つ。そのために各プラグインの構成を揃える。

目標の構成は [architecture.md](./architecture.md)。

1. [x] 3プラグインと `template/` の構成の差分を洗い出す
2. [x] 目標の構成を `architecture.md` にまとめ、合意する
3. [x] kintone の型を、公式の型とイベントの外枠に置き換える（`kintone-utils/src/types/kintone/` を廃止）
4. [x] `template/` を lint・型チェック・CI の対象にし、壊れている箇所を直す
5. [x] 設定画面の骨組みを共有パッケージ（`plugin-shell`）に移し、`template/` を最初の利用者にする
6. [ ] 依存関係を最新にする（下記）。新しい部品を最初から最新の版で書くため、手順7 より前に行う
7. [ ] フィールドを選ぶ部品を共有パッケージに移す（`ui` の `FormAutocomplete`、`plugin-shell` の `FieldSelect`）。既存の6か所は手順8 で置き換える
8. [ ] 既存のプラグインを1本ずつ移行する（1プラグイン1PR）。小さい順に age-calculator → field-controller → auto-numbering

手順6 以降で設定画面の動作を kintone の実機で確かめるので、各プラグインの `.env` と `private.ppk` が必要。

### 手順6: 依存関係の最新化

目的ごとに PR を分け、互いに影響する順に上げる。判断の理由は [decisions/tooling.md](./decisions/tooling.md)。実機での確認は、すべての PR を入れた後に1回まとめて行う。

1. [ ] 開発ツールの土台: pnpm 12・turbo
2. [x] 検査と整形: ESLint・Prettier・`packages/eslint-config` を Biome に置き換える
3. [x] TypeScript 7（Rsbuild の型チェックのプラグインも、TypeScript 7 に対応した 1.6 系に上げた）
4. [x] ビルド: Rsbuild 2 とそのプラグイン
5. [x] 小さい更新: React・react-hook-form・Zod・react-error-boundary・型定義など
6. [x] MUI 9
7. [x] jotai 3
8. [x] `@hookform/resolvers` 7
9. [x] kintone 関連: `@kintone/rest-api-client` 7・`dts-gen` 10
9-1. [x] 保守が終了した `@kintone/plugin-packer`・`plugin-uploader` を、後継の `@kintone/cli`（cli-kintone）に置き換える
10. [x] スクリプト用: `@clack/prompts`・nanoid（dotenv・node-rsa は cli-kintone への置き換えで不要になった）
11. [x] 3プラグインの設定画面と実行画面を、kintone の実機で確認する（2026-11-22。結果は下記）

#### 手順6-11 の確認項目

各プラグインで `pnpm build` のあと `pnpm upload`（または `pnpm dev`）でアップロードし、次を確かめる。

| 対象 | 確認すること | 関係する更新 |
| --- | --- | --- |
| アップロード | `pnpm upload` で kintone に反映される。既存のプラグインが更新され、別のプラグインとして増えない | cli-kintone |
| 設定画面の表示 | タブ・入力欄・フィールドの選択肢・並べ替え・ダイアログの見た目と配置が崩れていない | MUI 9 |
| 設定画面の読み込み | 保存済みの設定が表示される。フィールドの一覧が読み込まれる | jotai 3・rest-api-client 7 |
| 設定画面の操作 | 保存・リセット・インポート・エクスポートで画面が更新される。入力の検証エラーが表示される | jotai 3・`@hookform/resolvers` 7 |
| 実行画面 | age-calculator の年齢計算、field-controller の表示・編集の制御、auto-numbering の採番（レコードの取得と更新）が動く | rest-api-client 7・Rsbuild 2 |
| 対話式のコマンド | `pnpm run init` と `pnpm gen` の入力が動く | `@clack/prompts` 1 |

手順6 以降は設定画面の動作を kintone の実機で確かめるので、着手前に各プラグインの `.env` と `private.ppk` が必要。

#### 手順6-11 の確認結果（2026-11-22）

上の表のすべての項目で問題は無かった。

- アップロード: 同じ zip を続けて2回アップロードすると、2回目は同じプラグイン ID の `reinstall` になった
- 設定画面・実行画面: 3プラグインとも、利用者が kintone の画面で確認した
- 対話式のコマンド: `pnpm run init` は、上書きの確認で No を選ぶと「Operation cancelled.」で終わる。`pnpm gen` は入力の問いが表示される。どちらも Claude Code の `!` ではキー入力を送れないので、ターミナルで確かめた
- 設定画面の設計（見た目・操作の流れ）は、後のフェーズで見直す（下の未確定事項）

### 調査で分かった現状（2026-11-21）

- 設定画面の骨組み（`App.tsx`・`index.tsx`・`states/`・`hooks/` の6ファイルなど）が、`template/` と3プラグインに同じ中身でコピーされている。`template/` は検査の対象外のため、プラグイン側の修正（書式・型の注釈）が反映されていない
- `packages/ui` の入力部品（`FormSingleAutocomplete`・`FormTextField`・`FormSwitch`）と `DynamicSortableList` は age-calculator だけが使い、field-controller と auto-numbering は同じものを個別に作っている。フィールドを選ぶ部品は3プラグインで6か所以上個別に書かれ、同じ型の回避（`as unknown as`）を繰り返している
- `desktop/index.ts` と `mobile/index.ts` は、イベント名以外ほぼ同じ処理を二重に持っている
- ロジックの置き場所が `shared/lib/`（age-calculator・field-controller）と `shared/feature/<機能>/`（auto-numbering）に分かれている
- auto-numbering は API トークンをプラグイン設定に平文で保存している。プラグイン設定はアプリを使う全員がブラウザから読めるため、トークンが漏れる。フェーズ3 のトークン秘匿プラグイン（プロキシ設定を使う）で解消する

## 未確定事項

| 事項                                                                                                                                                                | 決める時期                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| API トークン秘匿プラグインの要件                                                                                                                                    | フェーズ3 の着手前                          |
| 実行画面のバンドルが約276KB ある（rest-api-client 7 で増えた）。kintone-utils を1つの入口から読むため、実行画面で使わない REST API クライアントや通知の部品まで入っている。入口を分けるかを決める | 手順8 の後 |
| 設定画面の設計（見た目・操作の流れ）の見直し。手順6-11 の確認で不具合は無かったが、作りは見直したい                                                                  | 後のフェーズ（時期は未定）                  |
| [architecture.md](./architecture.md) の未確定事項                                                                                                                   | plugin-shell の実装時・各プラグインの移行時 |
| Biome の実験段階（nursery）のルールを採用するか。今は採用しない                                                                                                     | 必要になったとき                            |
| Markdown のドキュメントを Biome の整形の対象にするか。今は対象にしない                                                                                              | 必要になったとき                            |

## 既知の問題（未対応）

`/code-review` などで見つかり、まだ直していないもの。対応したら行を消す。

| 問題 | 場所 | 対応する時期 |
| --- | --- | --- |
| 保存に30秒以上かかると、実際には保存できていても「保存に失敗しました」と表示する（遅れて届いた完了の通知を無視する） | `kintone-utils/src/lib/pluginConfig.ts` の `waitForSave` | 手順8 の前 |
| 保存の後の画面の更新が失敗しても、成功したときの処理（`onSuccess`）が呼ばれ、読み込み失敗の警告が消える | `kintone-utils/src/hooks/useSubmitConfig.ts` | 手順8 の前 |
| 誕生日が空のまま保存すると、年齢のフィールドに `NaN`（単位付きなら `NaN歳`）を書き込む | age-calculator の `desktop`・`mobile` | 手順8（age-calculator） |
| Biome の警告15件（`any` 10件、使っていない変数・引数5件）。うち auto-numbering の `displayLabel` と field-controller の `label` は、計算しているのに表示していない（表示し忘れの可能性） | 各プラグイン・`kintone-utils` | 手順8 |
| `createSchema` の型 `z.ZodType<T, any, any>` の `any`。外すと各プラグインの動的スキーマの型も変える必要がある | `kintone-utils/src/hooks/usePluginForm.ts` | 手順8 |
| template の `manifest.json` はプラグイン名と説明が空で、そのままでは zip を作れない。`pnpm gen` で名前を聞いて書き込むかを決める | `template/public/manifest.json`・`scripts/create-plugin.js` | 手順8 の後 |
| `genkey.js`・`upload.js`・`dotenv.js` が、template と3プラグインの4か所に同じ内容でコピーされている | 各プラグインの `scripts/` | 手順8 の後 |
| スクリプトはコマンドを直接起動するため、Windows では動かない（macOS で開発する前提） | 各プラグインの `scripts/` | 必要になったとき |
