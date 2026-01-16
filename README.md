# 🛠️ kintone Plugins Monorepo

[![pnpm](https://img.shields.io/badge/package--manager-pnpm-orange.svg)](https://pnpm.io/)
[![turbo](https://img.shields.io/badge/build--system-Turborepo-red.svg)](https://turbo.build/)
[![maintained-by-HaruCraftz](https://img.shields.io/badge/maintained--by-HaruCraftz-blue.svg)](https://github.com/HaruCraftz)

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

### 📚 共有パッケージ (Packages)
- **[@kintone-plugin/ui](./packages/ui)**: MUI ベースのプラグイン共通 UI コンポーネント集。
- **[@kintone-plugin/kintone-utils](./packages/kintone-utils)**: kintone API クライアント、共通カスタムフック、ロガー等の共有ロジック。
- **[@kintone-plugin/tsconfig](./packages/tsconfig)**: プロジェクト全体で共有する TypeScript 設定。
- **[@kintone-plugin/eslint-config](./packages/eslint-config)**: 静的解析とフォーマット（ESLint / Prettier）の一括設定。

---

## 🛠️ 開発者ガイド

### 1. 初回セットアップ
このプロジェクトは **pnpm** Workspaces を使用しています。

```bash
# 依存関係のインストール
pnpm install
```

### 2. 新規プラグインの作成
対話型ツールを使用して、テンプレートから新しいプラグインを数秒で立ち上げることができます。

```bash
pnpm gen
```
※ 実行後、指示に従ってディレクトリ名を入力してください。

### 3. 主要な開発コマンド

| コマンド | 内容 |
| :--- | :--- |
| `pnpm build` | 全パッケージをビルドします（Turborepo によるキャッシュ対応）。 |
| `pnpm dev --filter <name>` | 指定したプラグインの開発サーバーを起動します。 |
| `pnpm lint` | 全パッケージのコード品質をチェックします。 |
| `pnpm fix` | コードの自動整形と Lint エラーの修正を実行します。 |
| `pnpm clean` | すべての `dist` やビルドキャッシュを削除してクリーンアップします。 |

---

## ✨ 技術スタック

| カテゴリ | 採用技術 |
| :--- | :--- |
| **Monorepo** | Turborepo, pnpm Workspaces |
| **Frontend** | React 19, TypeScript 5.9 |
| **Build Tool** | Rsbuild (Rspack) |
| **UI Library** | Material UI (MUI) v7, Emotion |
| **State/Form** | Jotai, React Hook Form, Zod |
| **API Client** | @kintone/rest-api-client |

---

## 📂 ディレクトリ構造

```text
.
├── apps/               # 個々の kintone プラグイン本体
├── packages/           # 共有パッケージ（UI, Utils, Configs）
├── scripts/            # プロジェクト管理用ユーティリティ（生成ツール等）
├── turbo.json          # Turborepo のパイプライン設定
├── pnpm-workspace.yaml # モノレポ構成の設定
└── package.json        # ルートの依存関係と共通スクリプト
```

---
Developed with ❤️ for the kintone ecosystem.
