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
9. [ ] kintone 関連: `@kintone/rest-api-client` 7・`dts-gen` 10・packer・uploader
10. [ ] スクリプト用: `@clack/prompts`・dotenv・node-rsa・nanoid など
11. [ ] 3プラグインの設定画面と実行画面を、kintone の実機で確認する

手順6 以降は設定画面の動作を kintone の実機で確かめるので、着手前に各プラグインの `.env` と `private.ppk` が必要。

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
| 実行画面のバンドルが約270KB ある。kintone-utils を1つの入口から読むため、実行画面で使わない REST API クライアントや通知の部品まで入っている。入口を分けるかを決める | 手順7 の後                                  |
| [architecture.md](./architecture.md) の未確定事項                                                                                                                   | plugin-shell の実装時・各プラグインの移行時 |
| Biome の実験段階（nursery）のルールを採用するか。今は採用しない                                                                                                     | 必要になったとき                            |
| Markdown のドキュメントを Biome の整形の対象にするか。今は対象にしない                                                                                              | 必要になったとき                            |
