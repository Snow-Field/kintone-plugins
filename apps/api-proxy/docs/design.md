# API プロキシ設定プラグイン 設計書

> **最終更新**: 2026-11-23
> **要件**: [docs/proxy-config.md](../../../docs/proxy-config.md) の「api-proxy」（目的・守れるもの・使える範囲・画面の要件）。判断の理由は [docs/decisions/proxy-config.md](../../../docs/decisions/proxy-config.md)
> **タスク管理**: [tasks.md](./tasks.md)

## 概要

JS カスタマイズや他のプラグインが `kintone.plugin.app.proxy` で使う秘密（API トークンなど）を、プロキシ設定に保存するだけのプラグイン。実行画面の処理は持たない（manifest に desktop と mobile が無い）。

## 設定の形（版 2）

```
PluginConfigSchemaV2
├── version: literal(2)
└── targets: Target[]                 # 接続先（0件でもよい）
    ├── id: string                    # 行の識別子（nanoid）
    ├── url: string                   # 前方一致の URL
    ├── methods: ('GET'|'POST'|'PUT'|'DELETE')[]
    ├── headers: { id, key, value }[]           # value はフォームの中だけ。setConfig には空で保存
    ├── data: { id, key, value, type }[]        # type: 'string' | 'number' | 'boolean'。value は同上
    ├── memo: string                  # 画面では「説明」と呼ぶ
    └── enabled: boolean              # v2 で追加。v1 はすべて有効として読み込む
```

- 静的なスキーマ（`staticSchema.ts`）は形だけを定める。保存した設定は値を空にしてあるので、値が必須という検証は動的なスキーマ（`dynamicSchema.ts`）に書く
- 秘密の扱いは kintone-utils の `secrets`（`persistence.ts` の `targetSecrets`）。選んだメソッドごとに1件のプロキシ設定にし、どのメソッドにも同じ値を保存する。読み込みでは最初のメソッドの組を読み、キーで値を戻す

## 構成

| 場所 | 役割 |
| --- | --- |
| `src/shared/lib/targets.ts` | 接続先とプロキシ設定の変換（`toProxyEntries`・`stripTargets`・`fillTargets`）、入力の検証（`validateTargets`）、前方一致の重なり（`overlappingTargets`）。kintone に依存しないのでテストを書く |
| `src/shared/config/` | 設定の形・検証・既定値。`PLUGIN_ID`（使い方タブに出す）もここで読む |
| `src/config/components/TargetsSettings.tsx` | 接続先タブ（接続先の表・前方一致の重なりの知らせ・接続先の追加と削除） |
| `src/config/components/TargetRow.tsx` | 接続先1件の一覧の行（読み取り専用。並べ替えの取っ手・編集・この下に追加・削除） |
| `src/config/components/TargetDialog.tsx` | 接続先の編集ダイアログ。一覧とは別のフォーム（下書き）で編集し、「保存」で検証してから一覧に戻す |
| `src/shared/lib/targetDraft.ts`・`keyValueJson.ts` | 下書きと接続先の変換・検証の割り当て（`targetDraft.ts`）、ヘッダーとデータと JSON の変換（`keyValueJson.ts`）。テストを書く |
| `src/config/components/InfoTip.tsx` | 見出しの横の ⓘ（カーソルを乗せると説明を出す）。ほかのプラグインでも使うようになったら `ui` に移す |
| `src/config/components/UsageGuide.tsx` | 使い方タブ（権限についての注意・プラグイン ID・固定の呼び出しの例。コピーできる） |

## 決めたこと

| 事項 | 内容と理由 |
| --- | --- |
| 画面での呼び名 | 設定の `memo` は、画面では「説明」と呼ぶ（接続先の名前の代わりに一覧の先頭に出す） |
| 接続先の並べ替え | できる（取っ手のドラッグ。キーボードでも可）。順番は動作に影響しない（同じ URL とメソッドの組は重ねられず、前方一致が重なったときの優先は kintone が長さで決める）ので、管理者が見やすく並べるためだけに使う |
| データの数値・真偽 | `setProxyConfig` の `data` に数値・真偽のまま渡す（kintone-utils の `ProxyDataValue`）。JSON の大きな整数（安全な整数の範囲を超えるもの）は、読んだ時点で値が変わるので拒否し、文字で書いてもらう。`getProxyConfig` が数値・真偽をどの型で返すかは未確認なので、読み込みでは文字にしてから戻す |
| ヘッダー名 | 大文字小文字を区別しない（HTTP の仕様）。重複の検証と、保存済みの値を戻すときの照合で区別しない。キーは HTTP のトークンの文字だけ、値は改行などの制御文字を拒否する（混ざると保存か呼び出しが失敗するため） |
| 保存の途中失敗 | 保存しうる組が決まっていないので `knownKeys` は渡さない。前回保存した組（予約キー）だけを消す対象にする |
