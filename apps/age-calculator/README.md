# kintone Plugin Simple Template

MUI (Material UI)、Jotai、React Hook Form、Zod を使用した kintone プラグイン開発用の洗練されたテンプレートです。
Rsbuild（Rspack ベース）を採用し、高速なビルドと開発体験を提供します。

## セットアップ

1.  **リポジトリのクローン**
2.  **依存関係のインストール**
    ```bash
    npm install
    ```
3.  **初期設定（.env と 非公開鍵の生成）**
    ```bash
    npm run init
    ```
    ※ CLIの指示に従い、kintone の接続情報（Base URL、ユーザー名、パスワード）を入力してください。これにより `.env` ファイルと `private.ppk` が生成されます。

## 環境変数の設定

`.env` ファイルには以下の変数を設定します（`npm run init` で自動生成可能）。

| 変数名 | 説明 | 例 |
| :--- | :--- | :--- |
| `KINTONE_BASE_URL` | kintone のベース URL | `https://example.cybozu.com` |
| `KINTONE_USERNAME` | ログインユーザー名 | `admin` |
| `KINTONE_PASSWORD` | ログインパスワード | `password123` |

## 開発の流れ

プラグインの要件に応じて、主に以下のディレクトリ・ファイルを編集します。

### 1. 設定データの定義 (`src/shared/config`)
プラグインが保持する設定データの構造やバリデーションルールを定義します。
- `schema.ts`: Zod を使用した設定データのスキーマ定義。
- `index.ts`: 設定データの初期値や保存・復元ロジック。

### 2. プラグイン実行スクリプトの実装 (`src/desktop`, `src/mobile`)
実際のアプリ画面で動作するロジックを実装します。
- `src/desktop/index.ts`: PC版の動作ロジック。
- `src/mobile/index.ts`: モバイル版の動作ロジック。

### 3. プラグイン設定画面の構築 (`src/config`)
設定画面の UI とロジックを実装します。
- `components/`: 各設定項目（テキストフィールド、ラジオボタン等）のコンポーネント。
- `hooks/`: 設定画面専用のカスタムフック（重複チェックなど）。
- `states/`: Jotai を使用したグローバルな状態管理。

## ディレクトリ構成

```text
.
├── dist/                # ビルド済みプラグイン（plugin.zip）出力先
├── public/              # plugin.zip 用の manifest.json やアイコン等
├── scripts/             # セットアップやアップロード用のユーティリティ
├── src/
│   ├── config/          # プラグイン設定画面のソースコード
│   │   ├── components/  # 設定画面の UI 部品
│   │   ├── hooks/       # 設定画面用ロジック
│   │   ├── states/      # 状態管理（Jotai Atoms）
│   │   └── style/       # スタイル定義
│   ├── desktop/         # PC版実行用コード
│   ├── mobile/          # モバイル版実行用コード
│   ├── shared/          # 全体で共有する型定義・設定・ロジック
│   │   └── config/      # 設定データのスキーマと I/O
│   └── types/           # 共通型定義
├── package.json
└── rsbuild.config.ts    # ビルド設定（Rsbuild）
```

## スクリプト一覧

| コマンド | 内容 |
| :--- | :--- |
| `npm run init` | `.env` の作成と非公開鍵（`private.ppk`）の生成を一度に行います。 |
| `npm run build` | TS/TSX のコンパイルとプラグインのパッケージング（`plugin.zip` の作成）を行います。 |
| `npm run upload` | ビルドしたプラグインを指定した kintone 環境にアップロードします。 |
| `npm run watch` | ファイルの変更を監視し、自動的にビルドとアップロードを行います。 |
| `npm run lint` | ESLint と Prettier によるコードチェックを実行します。 |
| `npm run fix` | コードの自動整形を実行します。 |

## 技術スタック

- **Build**: Rsbuild (Rspack)
- **UI**: MUI (Material UI)
- **Form**: React Hook Form
- **Validation**: Zod
- **State**: Jotai
- **Language**: TypeScript
- **Utility**: nanoid, notistack, fs-extra
