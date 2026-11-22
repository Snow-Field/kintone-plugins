# 開発ツールと依存関係

## 現行の方針

- 依存関係は、基本的にすべて最新の版を使う。上げられない理由があるものは、その理由と上げる条件を書く
- 検査（lint）と整形（format）は Biome で行う。ESLint・Prettier は使わない
- Biome の実験段階（nursery）のルールは採用しない
- Markdown のドキュメントは整形の対象にしない
- TypeScript は 7 系（ネイティブ版）を使う。TypeScript の JavaScript API に依存する道具は使えないため、道具を選ぶときは TypeScript 7 への対応を確かめる
  - `@kintone/dts-gen` は、型を生成するコマンドのために `typescript-eslint` に依存しており、TypeScript 7 では依存の食い違いの警告が出る。このリポジトリは型定義ファイル（`kintone.d.ts`）だけを使い、生成のコマンドは使わないため、影響はない

## 判断履歴

### 2026-11-23 画面の部品のテストに Testing Library と jsdom を使う

- 背景: `ui` の `FormAutocomplete` と `plugin-shell` の `FieldSelect` を作るにあたり、画面の部品を描画して確かめる環境が無かった（それまでのテストは画面を持たない処理だけ）
- 検討した選択肢: DOM の模擬として (1) jsdom (2) happy-dom
- 決定: (1)。`@testing-library/react`・`@testing-library/dom`・`@testing-library/user-event` と組み合わせ、`ui`・`plugin-shell` の Vitest の環境を `jsdom` にする
- 却下した理由: (2) は速いが、MUI の Autocomplete が使うフォーカスや配置の計算で、ブラウザと振る舞いがずれることがある

### 2026-11-22 プラグインの zip の作成とアップロードを cli-kintone に置き換える
- 背景: `@kintone/plugin-packer`・`@kintone/plugin-uploader` は、最新版も含めて保守が終了した（npm で非推奨。後継は `@kintone/cli`）
- 決定: `@kintone/cli`（cli-kintone）の `plugin pack`・`plugin upload`・`plugin keygen` に置き換える
  - 今の秘密鍵で今の packer と cli-kintone の両方で zip を作り、`cli-kintone plugin info` でプラグイン ID が同じになることを確かめた
  - アップロードはブラウザの自動操作から REST API に変わり、puppeteer（Chrome のダウンロードを含む）が不要になった
  - 秘密鍵の作成（node-rsa）と `.env` の読み込み（dotenv）も不要になった（`.env` は Node の `process.loadEnvFile` で読む）
- 制約: アップロードはパスワード認証のみ（今と同じ）

### 2026-11-22 ESLint・Prettier を Biome に置き換える

- 背景: 依存関係を最新にするにあたり、ESLint で TypeScript を解析する `typescript-eslint`（8.73.0）が TypeScript 6.0 系までにしか対応しておらず、TypeScript 7 に上げられなかった。検査と整形に ESLint・Prettier・`@cybozu/eslint-config`・`packages/eslint-config` の4つを使っていた
- 検討した選択肢: (1) ESLint 10・`@cybozu/eslint-config` 26 に上げ、TypeScript は 6 系にとどめる (2) Biome に置き換える
- 決定: (2)。このリポジトリで Biome の移行ツールを試した結果に基づく
  - 有効な ESLint のルール200個のうち、151個はそのまま移せ、16個は Biome の実験段階のルールで移せる。実装されていない27個は、ほとんどが React のクラスコンポーネント向けで、このリポジトリには関係しない
  - ESLint では型情報を使う検査をしていなかったため、Biome の型を使う検査が発展途上でも、今より弱くならない
  - Prettier の設定を移して既存のコードに当てると、変わったのは1ファイルの1か所だけだった
  - Biome は TypeScript に依存しないため、TypeScript 7 に上げられる
- 失うもの: kintone の開発元がそろえたルールの選び方（`@cybozu/eslint-config`）。実装されていないルールのうち、`consistent-return`・`react/no-unescaped-entities`・`no-invalid-regexp`
- 却下した理由: (1) は TypeScript を最新にできず、道具も4つのまま減らない

### 2026-11-22 依存関係を基本的にすべて最新にする

- 背景: MUI が 7 系で、最新の 9 系より2つ前だった。ほかにも30個の依存が古く、うち16個がメジャー更新だった
- 決定: 基本的にすべて最新にする。新しい共通部品を最初から最新の版で書くため、フェーズ1 の部品作り（手順7）より前に行う。目的ごとに PR を分け、実機での確認はすべての PR を入れた後に1回まとめて行う
