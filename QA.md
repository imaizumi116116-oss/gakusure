# QA チェック結果

実施日: 2026-02-08

## 1. コマンド実行結果
- `npm run typecheck` : PASS
- `npm run lint` : PASS
- `npm run test` : PASS（6 files / 28 tests）
- `npm run build` : PASS
- `npm run test:e2e` : PASS（1 passed）
  - 事前準備: `npx playwright install chromium`

## 2. 追加した管理機能の確認項目
- 管理者ログイン（`/admin/login`）
- 管理画面（`/admin`）で通報一覧を表示
- 管理画面から対象スレ・返信を非表示化（`deletedAt` 更新）
- 管理者APIガード（未ログイン時に401）

## 2.1 リリース前のスパム対策チェック
- 検索連打のレート制限（`/` の検索 / `GET /api/threads`）
- 通報作成時の最小ログ出力（本文/補足メモはログに残さない）
- IPが取れない環境で全ユーザーが同一IP扱いにならない（IPが不明な場合はcookie識別へフォールバック）

## 3. 再発防止テスト
- 管理者認証トークンとパスワード検証
  - `tests/adminAuth.test.ts`
- CSRF検証強化（Origin/Referer必須）
  - `tests/security.test.ts`
- バリデーション境界値と危険文字列
  - `tests/validators.test.ts`
- レート制限（複合キー時のブロック）
  - `tests/rateLimit.test.ts`
- 返信投稿時の整合性（deleted threadへ投稿不可、bump更新）
  - `tests/forumDb.test.ts`
- リアクション（スレ本文/返信）のトグルと集計
  - `tests/reactions.test.ts`

## 4. 補足
- E2Eシナリオは `tests/e2e/app.spec.js` に配置済み。
- E2E は `prisma/e2e.db` を毎回作り直して動作し、開発DB（`prisma/dev.db`）を汚しません。
- `npm run dev` は起動前に `prisma migrate deploy` を実行し、DBがスキーマに追従します。
