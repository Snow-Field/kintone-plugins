# API プロキシ設定プラグイン 設計書

> **最終更新**: 2026-11-23
> **要件**: [docs/proxy-config.md](../../../docs/proxy-config.md) の「api-proxy」（目的・守れるもの・使える範囲・画面の要件）。判断の理由は [docs/decisions/proxy-config.md](../../../docs/decisions/proxy-config.md)
> **タスク管理**: [tasks.md](./tasks.md)

## 概要

JS カスタマイズや他のプラグインが `kintone.plugin.app.proxy` で使う秘密（API トークンなど）を、プロキシ設定に保存するだけのプラグイン。実行画面の処理は持たない（manifest に desktop と mobile が無い）。

## 設定の形（版 1）

```
PluginConfigSchemaV1
├── version: literal(1)
└── targets: Target[]                 # 接続先（0件でもよい）
    ├── id: string                    # 行の識別子（nanoid）
    ├── url: string                   # 前方一致の URL
    ├── methods: ('GET'|'POST'|'PUT'|'DELETE')[]
    ├── headers: { id, key, value }[]           # value はフォームの中だけ。setConfig には空で保存
    ├── data: { id, key, value, type }[]        # type: 'string' | 'number' | 'boolean'。value は同上
    └── memo: string
```

- 静的なスキーマ（`staticSchema.ts`）は形だけを定める。保存した設定は値を空にしてあるので、値が必須という検証は動的なスキーマ（`dynamicSchema.ts`）に書く
- 秘密の扱いは kintone-utils の `secrets`（`persistence.ts` の `targetSecrets`）。選んだメソッドごとに1件のプロキシ設定にし、どのメソッドにも同じ値を保存する。読み込みでは最初のメソッドの組を読み、キーで値を戻す

## 構成

| 場所 | 役割 |
| --- | --- |
| `src/shared/lib/targets.ts` | 接続先とプロキシ設定の変換（`toProxyEntries`・`stripTargets`・`fillTargets`）、入力の検証（`validateTargets`）、前方一致の重なり（`overlappingTargets`）、呼び出しの例（`callExample`）。kintone に依存しないのでテストを書く |
| `src/shared/config/` | 設定の形・検証・既定値。`PLUGIN_ID`（使い方タブに出す）もここで読む |
| `src/config/components/TargetsSettings.tsx` | 接続先タブ（注意書き・前方一致の重なりの知らせ・接続先の追加と削除） |
| `src/config/components/TargetCard.tsx` | 接続先1件（URL・kintone の URL を入れるボタン・メソッド・ヘッダー・本文・メモ） |
| `src/config/components/HeaderEditor.tsx`・`DataEditor.tsx` | キーと値の行。値は `ui` の `FormSecretField`（伏せ字と表示の切り替え）。本文はメソッドに合わせて送られ方を説明する |
| `src/config/components/UsageGuide.tsx` | 使い方タブ（プラグイン ID と、接続先ごとの呼び出しの例。コピーできる） |

## 決めたこと

| 事項 | 内容と理由 |
| --- | --- |
| 接続先の並べ替え | しない。順番に意味が無いため（同じ URL とメソッドの組は重ねられず、前方一致が重なったときの優先は kintone が長さで決める） |
| 本文の値の数値・真偽 | `setProxyConfig` の `data` に数値・真偽のまま渡す（kintone-utils の `ProxyDataValue`）。数値は、数値に変えて文字に戻したときに入力と同じになるものだけを受け付ける（大きな整数などが別の値で保存されないため）。`getProxyConfig` が数値・真偽をどの型で返すかは未確認なので、読み込みでは文字にしてから戻す |
| ヘッダー名 | 大文字小文字を区別しない（HTTP の仕様）。重複の検証と、保存済みの値を戻すときの照合で区別しない。キーは HTTP のトークンの文字だけ、値は改行などの制御文字を拒否する（混ざると保存か呼び出しが失敗するため） |
| 保存の途中失敗 | 保存しうる組が決まっていないので `knownKeys` は渡さない。前回保存した組（予約キー）だけを消す対象にする |
