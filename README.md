# 🛠️ kintone Plugins Monorepo

[![pnpm](https://img.shields.io/badge/package--manager-pnpm-orange.svg)](https://pnpm.io/)
[![turbo](https://img.shields.io/badge/build--system-Turborepo-red.svg)](https://turbo.build/)
[![maintained-by-Snow-Field](https://img.shields.io/badge/maintained--by-Snow--Field-blue.svg)](https://github.com/Snow-Field)

kintone プラグイン開発の効率化と品質向上を目的とした、モダンなモノレポ・プロジェクトです。
共通の UI コンポーネントやビジネスロジックを複数のプラグイン間で共有し、迅速な開発体験を実現します。

---

## 🚀 プロジェクトの目的

- **再利用性の最大化**: MUI ベースの洗練された UI コンポーネントを全プラグインで共有。
- **堅牢な型定義**: TypeScript による一貫した型定義により、開発時のミスを削減。
- **高速なビルド**: Turborepo と Rsbuild による、圧倒的に高速なビルド・開発体験の提供。

---

## 📦 パッケージ一覧

### 🔌 プラグイン (Apps)
- **[🎂 age-calculator](./apps/age-calculator)**: 誕生日フィールドから年齢を自動計算するプラグイン。
- **[🎛️ field-controller](./apps/field-controller)**: フィールドの編集・表示を制御するプラグイン。
- **[🔢 auto-numbering](./apps/auto-numbering)**: レコードに自動で採番するプラグイン。

### 📚 共有パッケージ (Packages)
- **[@kintone-plugin/ui](./packages/ui)**: MUI ベースのプラグイン共通 UI コンポーネント集。
- **[@kintone-plugin/kintone-utils](./packages/kintone-utils)**: kintone API クライアント、共通カスタムフック、ロガー等の共有ロジック。
- **[@kintone-plugin/tsconfig](./packages/tsconfig)**: プロジェクト全体で共有する TypeScript 設定。
- **[@kintone-plugin/plugin-shell](./packages/plugin-shell)**: プラグイン設定画面の骨組み（保存・リセット・インポート・エクスポートなど）。

---

## 🛠️ 開発者ガイド

### 1. 初回セットアップ
このプロジェクトは **pnpm** Workspaces を使用しています。Node のバージョンは `mise.toml` で固定しています。

```bash
# Node のインストール（mise.toml のバージョン）
mise install

# 依存関係のインストール
pnpm install --frozen-lockfile

# プラグインごとに kintone 接続用の .env と秘密鍵 private.ppk を作成
cd apps/<プラグイン名>
pnpm run init
```

※ `pnpm init` は pnpm 組み込みのコマンド（package.json の新規作成）が動くため、必ず `pnpm run init` と入力してください。
※ `private.ppk` はプラグイン ID の元になります。作り直すと kintone 上では別のプラグインとして扱われます。

### 2. 新規プラグインの作成
対話型ツールを使用して、テンプレートから新しいプラグインを数秒で立ち上げることができます。

```bash
pnpm gen
```
※ 実行後、指示に従ってディレクトリ名と、プラグイン名・説明（日本語と英語）を入力してください。プラグイン名と説明は `public/manifest.json` に書き込まれます。

### 3. 主要な開発コマンド

| コマンド | 内容 |
| :--- | :--- |
| `pnpm build` | 全パッケージをビルドします（Turborepo によるキャッシュ対応）。 |
| `pnpm dev --filter <name>` | 指定したプラグインをビルドし、`.env` の kintone 環境へアップロードします。 |
| `pnpm lint` | 全パッケージの検査と整形の確認を Biome で行います。 |
| `pnpm turbo run typecheck` | 全パッケージの型チェックを実行します。 |
| `pnpm test` | 全パッケージのテスト（Vitest）を実行します。 |
| `pnpm fix` | Biome で整形と、自動で直せる指摘の修正を行います。 |
| `pnpm clean` | すべての `dist` やビルドキャッシュを削除してクリーンアップします。 |

---

## ✨ 技術スタック

| カテゴリ | 採用技術 |
| :--- | :--- |
| **Monorepo** | Turborepo, pnpm Workspaces |
| **Frontend** | React 19, TypeScript 7 |
| **Build Tool** | Rsbuild (Rspack) |
| **Lint / Format** | Biome |
| **UI Library** | Material UI (MUI) v9, Emotion |
| **State/Form** | Jotai, React Hook Form, Zod |
| **API Client** | @kintone/rest-api-client |

---

## 📂 ディレクトリ構造

```text
.
├── apps/               # 個々の kintone プラグイン本体
├── packages/           # 共有パッケージ（UI, Utils, Configs）
├── docs/               # ロードマップと判断の記録
├── scripts/            # プロジェクト管理用ユーティリティ（生成ツール等）
├── template/           # pnpm gen で複製するプラグインのテンプレート
├── turbo.json          # Turborepo のパイプライン設定
├── pnpm-workspace.yaml # モノレポ構成の設定
└── package.json        # ルートの依存関係と共通スクリプト
```

---
Developed with ❤️ for the kintone ecosystem.
