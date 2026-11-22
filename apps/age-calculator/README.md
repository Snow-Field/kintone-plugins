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

## 🚀 技術スタック

最新のモダンなライブラリを採用し、堅牢でメンテナンス性の高いコードベースを実現しています。

| カテゴリ | 技術 |
| :--- | :--- |
| **Build** | [Rsbuild (Rspack)](https://lib.rsbuild.dev/) |
| **UI Framework** | [Material UI (MUI)](https://mui.com/) |
| **Form Library** | [React Hook Form](https://react-hook-form.com/) |
| **Schema Validation** | [Zod](https://zod.dev/) |
| **State Management** | [Jotai](https://jotai.org/)（共有パッケージの plugin-shell が使う） |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |

---

##  ディレクトリ構成

```text
src/
├── config/          # 設定画面（骨組みは plugin-shell。ここにはタブとフォームの部品だけを置く）
│   └── components/  # フィールドの設定・詳細設定のフォーム
├── desktop/         # PC 版：イベントの登録だけ
├── mobile/          # モバイル版：イベントの登録だけ
└── shared/
    ├── config/      # 設定の定義（スキーマ・動的な検証・既定値と旧版からの移行）
    ├── handlers/    # イベントの処理（PC・モバイル共通）
    └── lib/         # 年齢の計算と、書き込む値の判断（kintone に依存しない）
```

構成の決まりはリポジトリの [docs/architecture.md](../../docs/architecture.md) に従う。

---

## 📄 ライセンス

MIT License. (c) 2026 Snow-Field.

---

> [!TIP]
> **ヒント**: 設定画面では、日付フィールド以外のフィールドを選択できないようフィルタリング機能が備わっています。詳細な開発・セットアップ手順については、ルートディレクトリの README を参照してください。

---
Created with ❤️ for kintone users.
