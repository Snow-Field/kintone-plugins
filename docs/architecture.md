# アーキテクチャ

各プラグインが共通に従う構成と、共有パッケージの責務を定める。プラグイン固有のコードだけを書けば済む状態を目指す。

> **状態: 合意済み。** 3プラグインとも、この構成に移した（フェーズ1 の手順8）。判断の理由は [decisions/packages.md](./decisions/packages.md)。

## 共有パッケージの責務

依存の向きは `ui` ← `kintone-utils` ← `plugin-shell` ← 各プラグイン。逆向きの依存は作らない。

共有パッケージは `package.json` に `"sideEffects": false` を書き、読み込むだけで動く処理（CSS の import、グローバルへの登録など）を置かない。使っていない export をバンドルから外し、実行画面のバンドルに設定画面のコードを入れないため。入口は1つ（`src/index.ts`）のままにする。そうした処理がどうしても必要になったら、そのファイルを `sideEffects` に配列で書く。

| パッケージ                                  | 責務                                                                                                                                                     | 置かないもの                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `@kintone-plugin/ui`                        | 見た目だけの部品（ボタン・レイアウト・ローディング・テーマ）。kintone に依存しない                                                                       | kintone API の呼び出し、プラグイン設定の知識                          |
| `@kintone-plugin/kintone-utils`             | kintone の API・プラグイン設定の定義と保存・復元（`definePluginConfig`。API トークンなどの秘密は `secrets` でプロキシ設定に分けて保存する。[proxy-config.md](./proxy-config.md)）・ロガー・レコード画面のイベントの型。画面を持たない                             | React の画面部品、kintone の型の網羅的な定義（下記）                  |
| `@kintone-plugin/plugin-shell`              | 設定画面の骨組み（Provider・エラー境界・ヘッダー・保存/リセット/インポート/エクスポート）。kintone のフィールドを選ぶ部品（`FieldSelect`） | プラグイン固有の設定項目。実行画面（`desktop`・`mobile`）から使うもの |
| `@kintone-plugin/tsconfig` | TypeScript の共通の設定。検査と整形の設定はルートの `biome.json` | — |
| `@kintone-plugin/plugin-scripts` | 各プラグインの `init:env`・`init:key`・`upload` から呼ぶコマンド（`.env` と秘密鍵の作成、kintone へのアップロード）。実行したフォルダ（プラグインのフォルダ）を基準に動く。画面のコードからは読み込まない | 画面のコード、zip の作成（`cli-kintone plugin pack` を `package.json` に直接書く） |

プラグイン固有のコードで2つ以上のプラグインに同じものが現れたら、上の表に従って共有パッケージへ移す。

### 共通 UI 部品の方針

MUI の部品を片端から包まない。共通部品にするのは、何かを足すものだけにする。

| 種類                                                           | 置き場所                            | 例                                                                                          |
| -------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| MUI の入力部品を React Hook Form につないだもの                | `ui`（`Form*`）                     | `FormTextField`・`FormSwitch`・`FormAutocomplete`、今後の `FormSelect`・`FormCheckbox` など |
| 見た目だけの部品（レイアウト・ボタン・読み込み中・ダイアログ） | `ui`                                | `FormSection`・`SaveButton`                                                                 |
| kintone に依存する部品                                         | `plugin-shell`                      | `FieldSelect`（`FormAutocomplete` の上に作る）                                              |
| 1つのプラグインでしか使わない部品                              | 各プラグインの `config/components/` | 採番の書式パーツなど                                                                        |

- `Form*` の入力部品は、最初に必要になった時点で `ui` に足す。プラグインの中で `Controller` と MUI の部品を直接組み合わせない
- それ以外の部品は、2つ目のプラグインで必要になった時点で `ui` に移す
- MUI をそのまま包むだけの部品は作らない（`Box`・`Stack`・`Typography` などはプラグインから直接使う）
- 見た目の統一は、部品を包むのではなく、`ui` のテーマ（`theme.ts` の `defaultProps`・`styleOverrides`）で行う

`Form*` の約束事:

| 項目         | 決まり                                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 名前         | `Form` + MUI の部品名                                                                                                                                                |
| props        | `name` と `label` を受け取り、残りは MUI の props をそのまま渡す。React Hook Form が管理する `value`・`onChange`・`error`・`helperText` は型で受け取れないようにする |
| エラーの表示 | 検証エラーを必ず `helperText` に表示する                                                                                                                             |
| 項目名の型   | 既定は `string`。`<FormTextField<PluginConfig> name=... />` と書けば存在しない項目名を型エラーにできる                                                               |
| 見た目       | 色や余白はテーマから取り、コードに直接書かない。MUI の `slotProps` を使い、`any` で回避しない                                                                        |
| テスト       | Testing Library で、値の反映とエラーの表示を確かめる                                                                                                                 |

選択肢から選ぶ部品（`FormAutocomplete`・`FieldSelect`）は、選択肢の `value`（`FieldSelect` はフィールドコード）を保存する。1つ選ぶときは `string`（未選択は `''`）、`multiple` のときは `string[]`。選んだ後にほかの項目をリセットするなどの処理は、`onValueChange` に書く。選択肢に無い値（削除されたフィールドなど）が保存されていると、未選択として表示する。`multiple` のときは、利用者が次に値を変えた時点で、その値は保存値から外れる（見えない値を残さないため）。その誤りを利用者に知らせるときは、動的な検証（`dynamicSchema.ts`）で行う。

### kintone の型

公式の型を正とし、自前で持つのは公式に無い部分だけにする。

| 用途                   | 使う型                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kintone.*` の API     | `@kintone/dts-gen` の `kintone.d.ts`（各パッケージの tsconfig の `files` で読み込む）                                                                      |
| フィールドの値         | `@kintone/rest-api-client` の `KintoneRecordField`                                                                                                         |
| レコード画面のイベント | `kintone-utils` が持つイベントの外枠（`type`・`appId`・`recordId`・`record`）と、型付きでイベントを登録する関数。公式の型ではハンドラの引数が `any` のため |

イベントの外枠に足すのは、プラグインが実際に使うイベントとプロパティだけにする。

## プラグインの構成

```text
apps/<プラグイン名>/
├── public/                 # manifest.json・config.html・アイコン
└── src/
    ├── config/             # 設定画面
    │   ├── index.tsx       # plugin-shell に定義とタブを渡して起動するだけ
    │   ├── tabs.tsx        # タブの一覧
    │   ├── components/     # プラグイン固有のフォーム部品
    │   └── hooks/          # プラグイン固有のフォーム操作（行の追加・削除など）
    ├── desktop/index.ts    # PC 版のイベント登録だけ
    ├── mobile/index.ts     # モバイル版のイベント登録だけ
    └── shared/
        ├── config/         # プラグイン設定の定義
        │   ├── staticSchema.ts   # 版ごとの Zod スキーマと型
        │   ├── dynamicSchema.ts  # アプリのフィールドに依存する検証
        │   └── persistence.ts    # 既定値・旧版からの移行・plugin-shell に渡す定義
        ├── handlers/       # イベントの処理本体（PC・モバイル共通）
        ├── lib/            # kintone に依存しない処理。テストを書く
        └── api/            # kintone REST API の呼び出し
```

### ルール

| #   | ルール                                                                                                                                   | 理由                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | `desktop`・`mobile` はイベント名とハンドラの対応だけを書き、処理は `shared/handlers/` に置く                                             | PC とモバイルで同じ処理を二重に持たないため     |
| 2   | kintone の API・グローバル（`kintone.*`・`location`）を触る処理と、触らない処理を分ける。触らない処理は `shared/lib/` に置いてテストする | モックなしでテストできる範囲を広げるため        |
| 3   | 設定画面の骨組み（Provider・保存・リセットなど）はプラグインに書かない                                                                   | 4か所にコピーされ、すでに版ずれが起きているため |
| 4   | 設定の形を変えるときは版を上げ、`persistence.ts` に旧版からの移行を書く                                                                  | 保存済みの設定を壊さないため                    |
| 5   | 型の回避（`as unknown as`・`any`）は共有パッケージの型を直して解消する                                                                   | 同じ回避が各プラグインに広がるため              |

## 設定画面の起動

```tsx
// apps/<プラグイン名>/src/config/index.tsx
import { renderPluginConfig } from '@kintone-plugin/plugin-shell';
import { pluginConfig } from '@/shared/config';
import { tabs } from './tabs';

renderPluginConfig({ definition: pluginConfig, tabs });
```

`pluginConfig` は `shared/config/persistence.ts` で `definePluginConfig`（kintone-utils）を使って作る。プラグイン名・最新のスキーマ・既定値・旧版からの移行・動的な検証をまとめたもので、`desktop`・`mobile` からも `restore()` で設定を復元する。実装例は [template/src/shared/config/persistence.ts](../template/src/shared/config/persistence.ts)。

`definePluginConfig` はモジュールの最上位で呼ぶ（関数やイベントハンドラの中で呼ばない）。`kintone.$PLUGIN_ID` はプラグインのスクリプトの読み込み時にしか正しい値が保証されないため、定義を作った時点で読んで保持している。

定義を plugin-shell ではなく kintone-utils に置くのは、実行画面から plugin-shell（React・MUI）を読み込まないため。

動的な検証（`dynamicSchema.ts` の `createConfigSchema`）の戻り値の型は `ZodType<PluginConfig, PluginConfig>` と書き、検証の前と後の型を同じにする。フォームの値をそのままスキーマに渡すため、スキーマで値を変換する書き方（`.default()`・`.transform()`・`z.coerce` など）は使わない。既定値は `createDefault` で、旧版からの変換は `migrate` で行う。

### 設定ファイルのインポート

旧版でエクスポートしたファイルも読めるよう、`migrate` を通してから最新版のスキーマで検証する。`version` が数値で入っていないファイルは拒否する（各プラグインの `migrate` は `version` の無い設定を既定値に戻すため、無関係なファイルが既定値として受け付けられてしまう）。そのため、プラグイン設定は必ず `version` を持つ。

### 保存済みの設定を読み込めなかったとき

| 画面     | 扱い                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 設定画面 | 既定値を表示し、警告を出す。変更しなくても保存できる（保存し直さないと壊れた設定を直せないため）。原因はコンソールに出す。秘密（`secrets`）だけを読めなかったときは、読めた設定はそのまま表示し、秘密を空にして同じ警告を出す |
| 実行画面 | 既定値で動き、原因をコンソールに出す                                                                                     |

## template

`pnpm gen` の複製元であり、この構成の基準となる実装。workspace に入れて、lint・型チェック・CI の対象にする。`pnpm gen` は `node_modules` などの生成物を複製しない。template の `manifest.json` はプラグイン名と説明が空で、`pnpm gen` で聞いた値を、作ったプラグインの `manifest.json` に書き込む（`homepage_url` の末尾にはディレクトリ名を足す）。

## 並べ替えの部品

`ui` の `DynamicSortableList`・`SortableRowContainer` は、行の並べ替え（age-calculator のフィールドの組み合わせ）に使う。field-controller のルールと auto-numbering の採番設定はカード単位の並べ替えで、見た目と操作が合わないため、各プラグインの独自の作り（dnd-kit）を使う。カードの並べ替えが3つ目のプラグインで必要になったら、`ui` に移す。
