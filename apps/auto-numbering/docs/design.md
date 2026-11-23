# 自動採番プラグイン 設計書

> **バージョン**: 1.4
> **最終更新**: 2026-11-23
> **タスク管理**: [tasks.md](./tasks.md)
> **変更履歴**:
> - v1.4: API トークンをプロキシ設定に移す（設定の版 2）。REST API の呼び出しを `kintone.api` と `kintone.plugin.app.proxy` に替える
> - v1.3: 共有パッケージ（plugin-shell）への移行に合わせ、構成と設定画面の部品の章を書き直し
> - v1.2: Phase 1-2 完了に伴う実装状況の更新、Phase 3 の詳細化
> - v1.1: プラグイン用に全面リファクタリング（kintone Proxy → RestAPIClient、型定義の整理）

---

## 目次

- [1. 概要](#1-概要)
  - [1.1 目的](#11-目的)
  - [1.2 提供機能](#12-提供機能)
  - [1.3 技術スタック](#13-技術スタック)
- [2. データモデル](#2-データモデル)
  - [2.1 設定スキーマ（階層図）](#21-設定スキーマ階層図)
  - [2.2 列挙値・定数定義](#22-列挙値定数定義)
  - [2.3 バリデーション戦略](#23-バリデーション戦略)
- [3. アーキテクチャ](#3-アーキテクチャ)
  - [3.1 ディレクトリ構成](#31-ディレクトリ構成)
  - [3.2 処理の分担](#32-処理の分担)
- [4. モジュール設計（設定画面の部品）](#4-モジュール設計設定画面の部品)
- [6. フロー設計](#6-フロー設計)
  - [6.1 kintone イベント定義](#61-kintone-イベント定義)
  - [6.2 設定保存フロー](#62-設定保存フロー)
  - [6.3 実行フロー（Desktop / Mobile）](#63-実行フローdesktop--mobile)
- [7. エラーハンドリングと制約事項](#7-エラーハンドリングと制約事項)
  - [7.1 エラーハンドリング方針](#71-エラーハンドリング方針)
  - [7.2 kintone プラットフォーム制約](#72-kintone-プラットフォーム制約)
- [8. 設計判断記録（ADR）](#8-設計判断記録adr)
- [付録](#付録)

---

## 1. 概要

### 1.1 目的

kintone アプリでユニークキーを自動採番するプラグイン。
管理者がプラグイン設定画面から自動採番ルールを定義して、レコード保存時に設定したルールをもとに自動採番を実行する。

### 1.2 提供機能

<!-- 主要な機能を表形式で一覧化する -->

| 機能 | 概要 | 対象イベント |
|------|------|-------------|
| **採番処理** | 最新の番号で採番する | 追加・編集・一覧編集保存成功時（PC / モバイル） |
| **非活性制御** | 採番フィールドを編集不可にする | 追加・編集・一覧編集画面表示時（PC / モバイル） |

### 1.3 技術スタック

| レイヤー | 技術 |
|----------|------|
| UI フレームワーク | React 19 + MUI 9 |
| 状態管理 | Jotai |
| フォーム管理 | React Hook Form + Zod Resolver |
| バリデーション | Zod 4（静的 + 動的） |
| ビルドツール | Rsbuild |
| kintone API | `kintone.api`・`kintone.plugin.app.proxy`（フィールドの型だけ `@kintone/rest-api-client` から使う） |
| モノレポ共通 | `@kintone-plugin/ui`, `@kintone-plugin/kintone-utils` |

---

## 2. データモデル

### 2.1 設定スキーマ（階層図）

```
PluginConfigSchemaV2
├── version: literal(2)
├── numberingSettings: NumberingSetting[]  # 採番設定（複数設定可能、最大5件）
│   ├── id: string                         # 一意識別子（nanoid）
│   ├── label?: string                     # 表示名（オプション、未入力時は「設定 N」と表示）
│   ├── enabled: boolean                   # 有効/無効フラグ
│   ├── resultFieldCode: string            # 採番結果を書き込むフィールドコード
│   ├── formatParts: FormatPart[]          # 採番フォーマットのパーツ配列
│   │   ├── { type: 'text',  value: string }
│   │   ├── { type: 'field', fieldCode: string }
│   │   └── { type: 'date',  source: DATE_SOURCE, format: DATE_FORMATS }
│   ├── connector: CONNECTORS              # パーツ間の区切り文字
│   └── serialConfig: SerialConfig         # 連番設定
│       ├── initialValue: number           # 連番の初期値
│       ├── digit: number                  # ゼロ埋め桁数
│       ├── position: 'prefix' | 'suffix'  # 連番の位置
│       ├── resetTiming: ResetTiming       # リセットタイミング
│       │   ├── 'none'
│       │   ├── 'yearly'
│       │   ├── 'monthly'
│       │   └── 'daily'
│       └── serialFieldCode?: string       # resetTiming が 'none' の場合のみ必要
└── common
    ├── apiToken: string                   # API トークン。フォームの中だけで使い、setConfig には空で保存する
    └── useApiToken: boolean               # トークンをプロキシ設定に保存したか（実行画面の呼び出し方を決める）
```

### 2.2 列挙値・定数定義

#### 定数（`shared/config/constants.ts`）

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `FETCH_LIMIT_FOR_RESET` | `500` | リセットあり時の検索上限件数 |
| `DEFAULT_RETRY_COUNT` | `10` | 重複時の最大リトライ回数 |

#### 列挙値（`shared/config/constants.ts`）

| 列挙値 | 値 | 用途 |
|--------|-----|------|
| **DATE_SOURCE** | | 日付ソースの指定 |
| `NOW` | `'now'` | 現在日時を使用 |
| `CREATED_AT` | `'createdAt'` | レコード作成日時を使用 |
| **DATE_FORMATS** | | 日付フォーマット |
| `YYYYMMDD` | `'YYYYMMDD'` | 例: 20260430 |
| `YYMMDD` | `'YYMMDD'` | 例: 260430 |
| `YYYYMM` | `'YYYYMM'` | 例: 202604 |
| `YYMM` | `'YYMM'` | 例: 2604 |
| `YYYY` | `'YYYY'` | 例: 2026 |
| `YY` | `'YY'` | 例: 26 |
| **CONNECTORS** | | パーツ間の区切り文字 |
| `HYPHEN` | `'-'` | ハイフン区切り |
| **RESET_TIMING** | | 連番リセットタイミング |
| `NONE` | `'none'` | リセットなし（全期間で連番） |
| `YEARLY` | `'yearly'` | 年次リセット |
| `MONTHLY` | `'monthly'` | 月次リセット |
| `DAILY` | `'daily'` | 日次リセット |
| **SerialConfig.position** | | 連番の配置位置 |
| `prefix` | `'prefix'` | 先頭（例: 00001-XX-26） |
| `suffix` | `'suffix'` | 末尾（例: XX-26-00001） |

**実装例**:
```typescript
export const DATE_SOURCE = {
  NOW: 'now' as const,
  CREATED_AT: 'createdAt' as const,
} as const;

export const RESET_TIMING = {
  NONE: 'none' as const,
  YEARLY: 'yearly' as const,
  MONTHLY: 'monthly' as const,
  DAILY: 'daily' as const,
} as const;
```

### 2.3 バリデーション戦略

```
┌─────────────────┐     ┌──────────────────┐
│  staticSchema   │     │  dynamicSchema   │
│  （構造検証）     │     │  （意味検証）      │
│                 │     │                  │
│  ・型の正当性     │ ──→ │  ・フィールド存在   │
│  ・必須項目      │      │  ・値の整合性     │
│  ・列挙値範囲     │     │  ・ビジネスルール  │
└─────────────────┘     └──────────────────┘
                              ↑
                       kintone API から
                       フィールド情報を取得
```

- **静的バリデーション**（`staticSchema.ts`）: Zod スキーマによる構造的な型チェック
- **動的バリデーション**（`dynamicSchema.ts`）: `superRefine` によるアプリ固有のフィールド情報を用いた意味的検証

---

## 3. アーキテクチャ

構成はリポジトリ共通の [docs/architecture.md](../../../docs/architecture.md) に従う。設定画面の骨組み（Provider・保存・リセット・インポート・エクスポート）は共有パッケージの `plugin-shell` が持ち、このプラグインはタブとフォームの部品だけを持つ。

### 3.1 ディレクトリ構成

```
src/
├── config/
│   ├── index.tsx                  # plugin-shell に設定の定義とタブを渡して起動する
│   ├── tabs.tsx                   # 採番設定・共通設定のタブ
│   ├── components/
│   │   ├── GeneralSettings.tsx    # 共通設定タブ（API トークン）
│   │   └── numbering/             # 採番設定の一覧・カード・書式パーツ・連番設定・プレビュー
│   └── hooks/useNumberingPreview.ts # プレビューの採番値を作る
├── desktop/index.ts               # PC 版のイベントの登録だけ
├── mobile/index.ts                # モバイル版のイベントの登録だけ
└── shared/
    ├── config/                    # スキーマ・動的な検証・既定値と旧版からの移行・定数（constants.ts）
    ├── handlers/
    │   ├── record.ts              # 表示時の入力の制限と、保存成功時の採番の呼び出し
    │   └── numbering.ts           # 1つの採番設定の採番の流れ（executeNumbering）
    ├── api/                       # REST API（レコードの取得・更新・重複の確認・次の連番の取得）
    ├── lib/                       # kintone に依存しない処理（日付・ゼロ埋め・書式・連番の計算・検索条件のエスケープ）
    └── types/                     # 採番の処理で使う型
```

### 3.2 処理の分担

| 場所 | 役割 |
| --- | --- |
| `shared/config/persistence.ts` | `definePluginConfig` で設定の定義を作る。新しい採番設定の既定値（`createDefaultNumberingSetting`）と、API トークンの秘匿（`apiTokenSecrets`）も持つ |
| `shared/handlers/record.ts` | 有効な採番設定だけを対象に、表示時は採番結果のフィールドを編集不可にし（作成画面では値を消す）、保存成功時は順番に採番する |
| `shared/handlers/numbering.ts` | 書式の解決 → 次の連番の取得 → 重複の確認と再試行 → レコードの更新 |
| `shared/api/` | REST API の呼び出し（`request.ts` の `requestApi`）。トークンを保存していれば `kintone.plugin.app.proxy`、していなければ `kintone.api` で呼ぶ。URL は `kintone.api.url` で作る（ゲストスペースに対応する）。検索条件に入れる値は `lib/query.ts` の `quoteQueryValue` でエスケープする |
| `shared/lib/` | 書式（`format.ts`）・日付（`date.ts`）・ゼロ埋め（`string.ts`）・保存済みの値からの連番の抽出（`serial.ts`） |

---

## 4. モジュール設計（設定画面の部品）

入力欄はすべて共有パッケージの部品を使う（プラグインの中で `Controller` と MUI を直接組み合わせない）。

| 項目 | 部品 | データパス |
| --- | --- | --- |
| 設定名 | `FormTextField` | `numberingSettings[i].label` |
| 有効/無効 | `FormSwitch` | `numberingSettings[i].enabled` |
| 採番結果フィールド | `FieldSelect`（文字列（1行）） | `numberingSettings[i].resultFieldCode` |
| パーツの種類 | `FormSelect` | `numberingSettings[i].formatParts[j].type` |
| テキストのパーツ | `FormTextField` | `numberingSettings[i].formatParts[j].value` |
| フィールドのパーツ | `FieldSelect` | `numberingSettings[i].formatParts[j].fieldCode` |
| 日付のパーツ | `FormSelect`（書式・日付の元） | `numberingSettings[i].formatParts[j].format`・`.source` |
| 連番の位置・リセットのタイミング | `FormSelect` | `numberingSettings[i].serialConfig.position`・`.resetTiming` |
| 初期値・桁数 | `FormNumberField` | `numberingSettings[i].serialConfig.initialValue`・`.digit` |
| 連番管理フィールド | `FieldSelect`（数値） | `numberingSettings[i].serialConfig.serialFieldCode` |
| API トークン | `FormTextField`（パスワード） | `common.apiToken`（プロキシ設定に保存する） |

**動的な振る舞い**:
- リセットのタイミングは、書式のパーツに含まれる日付の細かさに合うものだけを出す（年 → 年次、年月 → 月次まで、年月日 → 日次まで）
- リセットのタイミングを「なし」以外にしたら、連番管理フィールドを空にする（リセットするときは使わないため）
- 連番管理フィールドの欄は、リセットのタイミングが「なし」のときだけ出す
- 採番設定の並べ替えは、カード単位のため独自の作り（dnd-kit）、書式のパーツは上下のボタンで並べ替える。共有の `DynamicSortableList` は使わない

---

## 6. フロー設計

### 6.1 kintone イベント定義

| トリガー | PC | モバイル |
|----------|:--:|:--------:|
| 追加・編集画面 表示時（採番フィールド非活性化） | `app.record.create.show` / `app.record.edit.show` | `mobile.app.record.create.show` / `mobile.app.record.edit.show` |
| 追加保存成功時（採番実行） | `app.record.create.submit.success` | `mobile.app.record.create.submit.success` |
| 編集保存成功時（採番実行） | `app.record.edit.submit.success` | `mobile.app.record.edit.submit.success` |

### 6.2 設定保存フロー

```
ユーザー操作（設定画面）
  ↓
React Hook Form: フォーム値を収集
  ↓
Zod 静的バリデーション (staticSchema)
  ↓
Zod 動的バリデーション (dynamicSchema + kintone フィールド情報)
  ↓
API トークンがあれば、kintone.plugin.app.setProxyConfig() で採番に使う API の3件を保存（無くなったら {} で上書き）
  ↓
kintone.plugin.setConfig() で JSON 保存。トークンは空にし、useApiToken を入れる（plugin-shell と kintone-utils が行う）
```

保存したトークンが実行画面で使われるのは、「アプリを更新」の後。仕組みは [docs/proxy-config.md](../../../docs/proxy-config.md)。

### 6.3 実行フロー（Desktop / Mobile）

#### 保存成功時フロー（submit.success イベント）

```
kintone イベント発火（submit.success）
  ↓
restoreConfig(): kintone から設定 JSON を復元 + Zod 検証
  ↓
numberRecord(): 有効な採番設定ごとに順番に executeNumbering()
  ↓
採番済みチェック: record[resultFieldCode].value が存在すればスキップ
  ↓
fetchRecord(): リビジョン取得（requestApi）
  ↓
resolveFormatParts(): text / field / date パーツを実値に解決
  ↓
buildFormatString(): connector で結合しフォーマット文字列を生成
  ↓
resolveNextSerial(): リセットポリシーに応じて次の連番を取得
  │  resetTiming: 'none'   → serialFieldCode の最大値 + 1
  └  resetTiming: yearly/monthly/daily → formatString で like 検索 → 最大連番 + 1
  ↓
【リトライループ（最大 DEFAULT_RETRY_COUNT 回）】
  padZero() → buildNumberingValue() → checkDuplicate()
  重複あり → currentSerial++ して再試行
  重複なし → updateRecord() でレコード更新（requestApi）
  ↓
return event
```

#### 画面表示時フロー（show イベント）

```
kintone イベント発火（create.show / edit.show）
  ↓
restoreConfig(): 設定を復元
  ↓
lockResultFields(): 有効な numberingSettings をループ
  ↓
resultField.disabled = true  # 採番フィールドを編集不可に
  ↓
create.show の場合: resultField.value = ''  # 値をクリア
  ↓
return event
```

---

## 7. エラーハンドリングと制約事項

### 7.1 エラーハンドリング方針

<!-- プラグインのエラーハンドリング方針を記述する -->

| エラーシナリオ | 発生箇所 | フォールバック戦略 |
|--------------|---------|------------------|
| 設定復元時のスキーマ不一致 | `restoreConfig()` | デフォルト設定へフォールバック |
| マイグレーション失敗 | `migrateConfig()` | デフォルト設定へフォールバック + コンソール警告 |
| kintone フィールド情報の取得失敗 | 動的バリデーション | エラー通知を表示し、保存を中断 |
| 動的バリデーションエラー | `createConfigSchema()` | フォームにフィールド単位のエラーを表示 |
| フィールド値の取得失敗（type: 'field' パーツ） | `resolveFormatParts()` | エラーをスロー → `executeNumbering()` の catch でアラート表示 |
| REST API のエラー | `requestApi()`（proxy は 4xx・5xx でも失敗にならないので、200 以外を失敗にする） | エラーをスロー → `executeNumbering()` の catch でアラート表示 |
| 最大リトライ回数超過 | `executeNumbering()` のリトライループ | エラーをスロー → catch でアラート表示 |
| 不正な連番値（NaN） | `resolveNextSerial()` / `extractSerialWithResets()` | NaN レコードをスキップ、または明示的エラーをスロー |

### 7.2 kintone プラットフォーム制約

<!-- kintone プラットフォーム固有の制約事項を記述する -->

| 制約 | 内容 | 対策 |
|------|------|------|
| 設定データ容量 | `kintone.plugin.setConfig()` は合計 200KB まで | 不要データの排除、スキーマ設計時にサイズを考慮 |
| API リクエスト制限 | kintone REST API のレートリミット | 必要最小限のリクエストに抑制 |
| 採番の競合 | 複数ユーザーが同時保存した場合に同一連番が払い出される可能性がある | 重複チェック + リトライ（`DEFAULT_RETRY_COUNT` 回）で対処。完全な排他制御は kintone プラットフォームの制約上不可 |
| API トークンの秘匿 | プロキシ設定の値はブラウザに届かないが、利用者は開発者ツールから proxy を呼び、トークンの権限で REST API を使える | 設定画面で、トークンの権限をレコードの閲覧と編集だけにするよう案内する |
| トークンでの更新 | API トークンでの更新は「Administrator による操作」として記録される | 仕様として受け入れる |
| リセットあり時の検索件数上限 | `like` クエリで取得するレコードは最大 `FETCH_LIMIT_FOR_RESET`（500）件 | 同一期間内の採番数が 500 件を超える場合は最大連番を見逃す可能性がある（設計上の既知制約） |

---

## 8. 設計判断記録（ADR）

### ADR-001: 採番タイミングを submit.success イベントに限定する

**決定内容**:
採番処理は `app.record.create.submit.success` / `app.record.edit.submit.success`（モバイル含む）でのみ実行する。

**背景・理由**:
`submit` イベント（保存前）で採番すると、バリデーションエラーや通信エラーで保存が中断された場合に連番が欠番になる。`submit.success` であれば保存確定後に採番するため欠番リスクを最小化できる。

**検討した代替案**:
- `submit` イベントで採番 → 保存失敗時に欠番が発生するため不採用

---

### ADR-002: 重複チェック + リトライによる競合対策

**決定内容**:
採番後に `checkDuplicate()` で重複確認し、重複があれば連番をインクリメントして再試行する（最大 `DEFAULT_RETRY_COUNT` 回）。

**背景・理由**:
kintone には採番専用のアトミック API がないため、楽観的ロック的なアプローチで競合を吸収する。

**検討した代替案**:
- 採番専用フィールド（数値型）を使った排他制御 → kintone の制約上、真の排他制御は実現困難なため不採用

---

### ADR-005: REST API を kintone.api と kintone.plugin.app.proxy で呼ぶ（ADR-004 を覆す）

**決定内容**:
API トークンをプロキシ設定に保存し、トークンがあれば `kintone.plugin.app.proxy`、無ければ `kintone.api` で呼ぶ。両方を `shared/api/request.ts` の `requestApi` にまとめ、200 以外の応答とエラーのオブジェクトを `Error` にそろえる。

**背景・理由**:
- `RestAPIClient` にトークンを渡すには、トークンを `setConfig`（実行画面から誰でも読める）に置く必要があった
- `proxy` は `RestAPIClient` に載らない。トークンの有無で呼び出し方を分けずに済むよう、セッションの呼び出しも `kintone.api` にそろえた
- `kintone.api.url(path, true)` がゲストスペースの URL を作るので、`guestSpaceId` を別に求めなくてよい
- 実行画面のバンドルが 268KB から 100KB になった

**検討した代替案**:
- セッションの呼び出しだけ `RestAPIClient` に残す → ゲストスペース ID を自分で求める必要があり、エラーの形も2通りになるため不採用

旧 ADR-004（覆した判断）: `kintone.proxy` から `@kintone/rest-api-client` へ移した。理由は型とエラー処理の統一。

---

### ADR-003: リセットあり時の連番抽出に like 検索を使用する

**決定内容**:
`timing: yearly/monthly/daily` の場合、`resultFieldCode like "formatString"` クエリで対象期間のレコードを取得し、連番部分を文字列分割で抽出する。

**背景・理由**:
採番値は単一フィールドに格納されるため、期間フィルタリングには採番値のプレフィックス/サフィックスパターンを利用するしかない。

**検討した代替案**:
- 連番を別フィールドに保持 → `timing: 'none'` では `serialFieldCode` を使う設計で対応済み。リセットあり時は採番値フィールドのみで完結させる方針を採用

---

## 付録

### 付録A: 採番値の組み立てパターン例

`connector: '-'`、`formatParts: [{ type: 'field', fieldCode: '部門' }, { type: 'date', source: 'createdAt', format: 'YY' }]`、`serialConfig.digit: 5` の場合:

| position | 採番値の例 |
|----------|-----------|
| `suffix` | `営業部-26-00001` |
| `prefix` | `00001-営業部-26` |

---

### 付録B: リセットポリシー別の連番取得クエリ

| timing | クエリ例 | 取得対象 |
|--------|---------|---------|
| `none` | `serialFieldCode != "" order by serialFieldCode desc limit 1` | 全期間の最大連番レコード 1 件 |
| `yearly` / `monthly` / `daily` | `resultFieldCode like "営業部-26" order by $id desc limit 500` | formatString に一致する最新 500 件 |
