# kintone Plugins

業務効率化と運用負荷の軽減を目的とした、kintone向けプラグインの開発を行っています。

## プラグイン一覧
- **[apps/age-calculator](./apps/age-calculator)**: 年齢計算プラグイン。生年月日フィールドから年齢を自動計算します。

## 共有パッケージ
- **[@kintone-plugin/ui](./packages/ui)**: MUIベースのプラグイン共通UIコンポーネント集。
- **[@kintone-plugin/kintone-utils](./packages/kintone-utils)**: kintone API、共通フック（離脱防止、重複チェック等）、ロガー等の共有ロジック。
- **[@kintone-plugin/tsconfig](./packages/tsconfig)**: プロジェクト全体のTypeScript設定。
- **[@kintone-plugin/eslint-config](./packages/eslint-config)**: プロジェクト全体のESLint/Prettier設定。

## 開発者向け情報

このリポジトリは、kintoneプラグイン開発における「共通UIの再利用」と「堅牢な型定義の共有」を目的に設計されています。
React 19, MUI v7, Rsbuild, Jotai, React Hook Form, Zod をベースにしたモダンな開発スタックを採用しています。
Turborepo と pnpm workspaces を活用し、複数のプラグイン間でUIコンポーネントやロジックを共有できます。

### セットアップ
```bash
# 1. 依存関係のインストール
pnpm install

# 2. プラグイン固有の設定（各アプリディレクトリで実行）
cd apps/age-calculator
pnpm run init # .env と private.ppk の生成
```

### 新規プラグインの作成
テンプレートから新しいプラグインを生成するには、以下のコマンドを実行します。

```bash
pnpm gen
```
実行後、対話形式でディレクトリ名を入力すると、`apps/` 直下に最小構成のプラグインが生成されます。
その後、生成されたプラグインフォルダへ移動し `pnpm run init` を実行してください。


### 開発フロー
ルートディレクトリから一括でコマンドを実行できます。

```bash
# 全パッケージのビルド
pnpm build

# 特定のプラグインの開発サーバー起動
pnpm dev --filter age-calculator

# 全パッケージの型チェック
pnpm type-check

# 全パッケージの型エラーとフォーマットの修正
pnpm fix
```

### ディレクトリ構成
```text
.
├── apps/               # プラグイン本体
│   └── age-calculator/ # 年齢計算プラグイン
├── packages/           # 共有パッケージ
│   ├── ui/             # 共通UIコンポーネント
│   ├── kintone-utils/  # 共有ロジック・ユーティリティ
│   ├── tsconfig/       # TS共通設定
│   └── eslint-config/  # ESLint共通設定
├── turbo.json          # Turborepo設定
├── pnpm-workspace.yaml # pnpmワークスペース設定
└── package.json        # ルート設定・共通スクリプト
```

### 技術スタック
- **Core**: React 19, TypeScript 5.9
- **Build**: Rsbuild (Rspack), Turborepo
- **UI**: Material UI (MUI) v7, Emotion
- **State**: Jotai
- **Form**: React Hook Form, Zod
- **API**: @kintone/rest-api-client
- **Package Manager**: pnpm
