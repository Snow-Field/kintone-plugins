# Git の運用

## 現行の方針

- ブランチは Git Flow に従う。`main`（リリース済み）と `develop`（開発の統合先）を置き、作業ブランチは `develop` から切って PR で戻す
- 作業ブランチの名前は `<type>/<英語の要約>`（kebab-case）。新機能は `feature/`、それ以外は Conventional Commits の type（`fix/` `chore/` `docs/` など）を使う。リリースと緊急修正には `release/` `hotfix/` を使う
- commit は Conventional Commits に従う。対象のプラグインは scope で示す（`feat(age): 〇〇`）。scope は `age` / `field` / `num`（auto-numbering）で、全体に関わる変更では省く
- `main`・`develop` へは直接 commit せず、PR 経由でマージする。GitHub のブランチ保護で強制している（PR 必須・CI の `check` ジョブの通過が必須・管理者にも適用・force push と削除は禁止）。個人開発のため承認者数は 0

## 判断履歴

### 2026-11-21 Git Flow と Conventional Commits に揃える

- 背景: 引き継ぎ時点では `main` だけで開発していた。commit には `add` / `change` / `update` / `delete` など Conventional Commits にない type が混在し、対象タグの位置（`[num] feat:` と `fix: [age]`）も揃っていなかった
- 決定: 上記の方針にする。commit の type は一般的な慣習（Conventional Commits）に合わせる
- 新機能のブランチ名: Git Flow の慣習に合わせて `feature/` を使う（`feat/` は使わない）
- 却下した案: 既存の `fix: [age] 〇〇` 形式を続ける案。Conventional Commits の scope 表記と二重になり、ツール（changelog の生成など）とも合わないため
