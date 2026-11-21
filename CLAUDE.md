# kintone-plugins

全案件共通のルールは `~/.claude/CLAUDE.md` に従う。ここには本案件固有の事項のみを書く。

## 作業開始時に読むもの

1. [docs/roadmap.md](./docs/roadmap.md) — フェーズの順番・進捗・未確定事項
2. [docs/architecture.md](./docs/architecture.md) — プラグイン共通の構成と共有パッケージの責務。新しいコードはこれに従う
3. 対象プラグインの `docs/design.md`・`docs/tasks.md` — 仕様と残タスク（age-calculator には docs が無く `README.md` のみ）
4. [docs/decisions/](./docs/decisions/) — 判断の理由。現況と食い違う場合は現況のドキュメントが正

## 対象システム

| 項目         | 内容                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| 種別         | kintone アプリ用プラグイン（`apps/*`）と共有パッケージ（`packages/*`）の pnpm モノレポ。個人開発 |
| 環境（検証） | 各プラグインの `.env` の `KINTONE_BASE_URL`（`pnpm run init` で作成。git 管理外）                |
| 環境（本番） | 無し                                                                                             |
| 期日         | 無し                                                                                             |

## ファイル構成

| パス                                           | 注意                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `template/`                                    | `pnpm gen` の複製元（パッケージ名 `plugin-starter`）。lint・型チェック・テストの対象だが、`dev`・`build` の対象からは外している |
| `packages/ui`・`kintone-utils`・`plugin-shell` | ビルドせず TS ソースのまま各プラグインから参照される（`main: src/index.ts`）                                                    |
| `apps/*/private.ppk`                           | プラグイン ID の元になる秘密鍵（git 管理外）。作り直すと別プラグイン扱いになる                                                  |

- **変更してはいけないファイル**: `apps/*/dist/`・`apps/*/artifacts/`（生成物）、`apps/*/private.ppk`、`apps/*/.env`

## 技術スタック

React 19 / TypeScript 5.9 / Rsbuild / MUI 7 / Jotai / React Hook Form / Zod 4、Turborepo + pnpm 10.28.2（`packageManager` で固定）。Node 26（`mise.toml` で固定）。

## 開発コマンド

- テスト: `pnpm test`（Vitest。`src/**/*.test.ts` が対象。1パッケージだけ: `pnpm --filter auto-numbering test`）
- lint: `pnpm lint`
- 型チェック: `pnpm turbo run typecheck`（ルートに script は無い）
- バンドル: `pnpm -r --filter './apps/*' --filter './template' bundle`（kintone へのアップロードを含まない）
- build: `pnpm build`（未実行。`private.ppk` が無いと package 段で失敗する）

## 実装ルール

| #   | ルール                                                       | 実装上の意味                                                                                                                                                                                            |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 依存のバージョンは `pnpm-workspace.yaml` の `catalog` に書く | 各 `package.json` は `catalog:` を指定する。全プラグインで版を揃えるため                                                                                                                                |
| 2   | 複数プラグインで使うものは `packages/` に置く                | 設定画面の骨組みは `plugin-shell` を使い、プラグインに書かない。移行前のプラグインの `src/config/hooks`・`states` には骨組みのコピーが残っている（[docs/roadmap.md](./docs/roadmap.md) の手順7 で削除） |

## 検証方法

- 確認手順: 未確定（検証用 kintone 環境での確認手順・確認ケースは未決定）
- 最低限: 上記の lint・型チェック・バンドルが通ること

「確認済み」と書いてよいのは実際に確認した項目だけ。未実施の項目は未実施と書く。

## 制約・禁止事項

- `pnpm dev`・`deploy`・`upload` は kintone へアップロードする。利用者の承認なしに実行しない（ルートの `pnpm dev` は全プラグインをアップロードする）
- `.env` と `private.ppk` は利用者が `pnpm run init` で作る（`pnpm init` は pnpm 組み込みのコマンドが動くので使わない）。Claude は `init:key` を実行しない
- `.env` には kintone のパスワードが平文で入る。読まない・出力しない

## Gitルール

詳細と理由は [docs/decisions/git.md](./docs/decisions/git.md)。

- Git Flow: 作業ブランチは `develop` から切り、PR で `develop` に戻す。新機能のブランチは `feature/`
- commit の scope は対象プラグイン（`age` / `field` / `num`）。例: `feat(age): 〇〇`
