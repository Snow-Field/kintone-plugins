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

進め方（予定）:

1. 3プラグインと `template/` の構成の差分を洗い出す（例: 設定スキーマが age-calculator では `schema.ts` の1ファイル、auto-numbering と `template/` では `staticSchema` / `dynamicSchema` / `persistence` に分かれている）
2. 目標の構成を `docs/architecture.md` にまとめる
3. `template/` を目標の構成に合わせ、基準の実装にする
4. 既存のプラグインを1本ずつ移行する（1プラグイン1PR）

## 未確定事項

| 事項                             | 決める時期         |
| -------------------------------- | ------------------ |
| API トークン秘匿プラグインの要件 | フェーズ3 の着手前 |
