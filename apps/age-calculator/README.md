# 🎂 kintone 年齢計算プラグイン

[![kintone-plugin](https://img.shields.io/badge/kintone-plugin-blue.svg)](https://kintone.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

誕生日や日付フィールドを基準に、**「現在の年齢」**をリアルタイムで自動計算して指定フィールドに同期する、高機能な kintone プラグインです。

---

## ✨ 主な機能

- **💾 保存時自動更新**: レコード保存時に最新の年齢へ自動更新する設定が可能です。
- **📱 マルチデバイス対応**: PC版だけでなく、スマートフォン・モバイル版にも完全対応しています。
- **⚙️ 柔軟な設定**: 複数の日付フィールドと計算結果フィールドのペアを自由に設定できます。
- **🛡️ 安全なバリデーション**: Zod による強力なバリデーションで、設定漏れやミスを未然に防ぎます。

---

## 🚀 テクノロジースタック

最新のモダンなライブラリを採用し、堅牢でメンテナンス性の高いコードベースを実現しています。

| カテゴリ | 技術 |
| :--- | :--- |
| **Build** | [Rsbuild (Rspack)](https://lib.rsbuild.dev/) |
| **UI Framework** | [Material UI (MUI)](https://mui.com/) |
| **Form Library** | [React Hook Form](https://react-hook-form.com/) |
| **Schema Validation** | [Zod](https://zod.dev/) |
| **State Management** | [Jotai](https://jotai.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |

---

##  ディレクトリ構成

```text
src/
├── config/          # 設定画面：MUI を使用したリッチな UI
│   ├── components/  # セクションごとのコンポーネント
│   ├── hooks/       # ビジネスロジック・カスタムフック
│   └── states/      # Jotai による状態管理
├── desktop/         # PC版：レコード一覧・編集・詳細画面のロジック
├── mobile/          # モバイル版：スマホ用 UI / UX の最適化
├── shared/          # 共有：Zod スキーマや共通の定数・関数
└── types/           # 型定義：一貫性のある開発のための型定義
```

---

## 📄 ライセンス

MIT License. (c) 2024 HaruCraftz.

---

> [!TIP]
> **ヒント**: 設定画面では、日付フィールド以外のフィールドを選択できないようフィルタリング機能が備わっています。詳細な開発・セットアップ手順については、ルートディレクトリの README を参照してください。

---
Created with ❤️ for kintone users.
