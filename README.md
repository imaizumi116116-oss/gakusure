# こくとちスレ

温かく優しい雰囲気の匿名掲示板アプリです。  
Next.js(App Router) + TypeScript + Tailwind + Prisma(SQLite) で実装しています。

## 機能（MVP）
- スレ一覧（bump順）
- スレ検索（タイトル/本文の部分一致）
- スレ作成（タイトル必須・本文必須・名前任意）
- スレ詳細表示
- 返信投稿（名前任意・本文必須）
- リアクション（スレ本文 / 返信）
- 返信並び替え（古い順/新しい順）
- ページネーション
- ルールページ（`/rules`）
- 簡易通報（DB保存）
- 管理者ログイン（環境変数パスワード）
- 管理画面（通報一覧 / スレ・返信の非表示）

## セキュリティ実装（最低限）
- 入力バリデーション: Zod（サーバ側）
- XSS対策: プレーンテキスト表示 + サーバ側で `<` `>` を無害化
- CSRF対策: `Origin` 検証 + カスタムヘッダ検証
- レート制限: 同一IPまたは同一cookie識別子で短時間の連投を制限（既定は投稿系: 30秒に1回）
  - `.env` の `*_RATE_LIMIT_*` で調整可能（詳細は「環境変数」参照）
  - cookie識別用に `clientId`（httpOnly）を自動付与します

## 技術スタック
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Prisma ORM
- SQLite（開発）
- Vitest（ユニット）
- Playwright（E2E 用設定・テストファイルあり）

## セットアップ
1. 依存関係をインストール
```bash
npm install
```

2. 環境変数を作成
```bash
cp .env.example .env
```

3. マイグレーション適用
```bash
npm run prisma:migrate
```

4. シード投入（任意）
```bash
npm run db:seed
```

5. 開発サーバー起動
```bash
npm run dev
```

`npm run dev` は起動前に `prisma migrate deploy` を実行するため、migrations が増えた場合もDBが自動で追従します。

## 利用ルート
- `/` : スレ一覧 / 検索 / ページング
- `/new` : スレ作成
- `/thread/[id]` : スレ詳細 / 返信投稿
- `/rules` : 利用ルール
- `/admin/login` : 管理者ログイン
- `/admin` : 管理画面

## コマンド一覧
- `npm run dev` 開発起動
- `npm run build` 本番ビルド
- `npm run start` 本番起動
- `npm run lint` ESLint
- `npm run typecheck` TypeScript型チェック
- `npm run test` Vitest
- `npm run test:e2e` Playwright
- `npm run prisma:migrate` Prismaマイグレーション
- `npm run db:seed` シード投入

Playwright 実行時は必要に応じて `npx playwright install` でブラウザを導入してください。
E2E は `prisma/e2e.db` を毎回作り直して実行するため、普段の開発DB（`prisma/dev.db`）を汚しません。

## 環境変数
- `DATABASE_URL`（例: `file:./dev.db`）
- `ADMIN_OWNER_PASSWORD`（管理者: owner のパスワード）
- `ADMIN_MODERATOR_PASSWORD`（管理者: moderator のパスワード、未設定可）
- `ADMIN_VIEWER_PASSWORD`（管理者: viewer のパスワード、未設定可）
- `ADMIN_SESSION_SECRET`（管理者セッション署名用の長いランダム文字列）
- `ADMIN_SESSION_VERSION`（セッション無効化用の数値。変更すると既存セッションを強制失効）
- レート制限（任意、ms / count）
  - `THREAD_RATE_LIMIT_WINDOW_MS`（スレ作成の最短間隔。既定: 30000）
  - `POST_RATE_LIMIT_WINDOW_MS`（返信投稿の最短間隔。既定: 30000）
  - `REPORT_RATE_LIMIT_WINDOW_MS`（通報の最短間隔。既定: 30000）
  - `REACTION_RATE_LIMIT_WINDOW_MS`（リアクションのウィンドウ。既定: 10000）
  - `REACTION_RATE_LIMIT_MAX`（リアクション上限回数。既定: 12）
  - `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS`（管理者ログインのウィンドウ。既定: 600000）
  - `ADMIN_LOGIN_MAX_ATTEMPTS`（管理者ログインの上限回数。既定: 5）
  - `SEARCH_RATE_LIMIT_WINDOW_MS`（検索のウィンドウ。既定: 60000）
  - `SEARCH_RATE_LIMIT_MAX`（検索上限回数。既定: 60）

## 管理機能
- 管理者ログイン: `POST /api/admin/login`
- 管理者ログアウト: `POST /api/admin/logout`
- 通報一覧API: `GET /api/admin/reports`（管理者のみ）
- 非表示API: `POST /api/admin/moderate`（moderator / owner のみ）
- 管理者ガードは署名付きセッションcookieで検証します（`SameSite=Strict`）。
- 権限（RBAC）
  - `owner`: すべて可能
  - `moderator`: 通報閲覧 + 非表示
  - `viewer`: 通報閲覧のみ（非表示は不可）

## DB / Prisma
- 開発DBはSQLite
- スキーマ: `prisma/schema.prisma`
- マイグレーション: `prisma/migrations/`
- 将来PostgreSQL移行時は `datasource db.provider` と `DATABASE_URL` を変更

## デプロイ方針メモ
- Vercel / Nodeサーバーどちらでも運用可能
- 本番では以下を置き換え推奨
  - レート制限のメモリ実装 -> Redis
  - SQLite -> PostgreSQL
  - 監査ログ/通報確認用の管理UI追加

## Vercel（PostgreSQL）デプロイ手順（推奨）
Vercel はサーバレス環境のため、SQLite（ファイルDB）の永続運用には向きません。公開する場合は PostgreSQL を推奨します。

1. Vercel にリポジトリを接続してプロジェクト作成
2. PostgreSQL を用意（Vercel Postgres / Neon / Supabase など）
3. Vercel の Environment Variables に以下を設定
   - `DATABASE_URL`（PostgreSQL 接続文字列）
   - `ADMIN_OWNER_PASSWORD`（または `ADMIN_PASSWORD`）
   - `ADMIN_SESSION_SECRET`（長いランダム文字列）
   - `ADMIN_SESSION_VERSION`（任意、セッション強制失効用）
4. Vercel の Build Command を `npm run vercel-build` に変更
   - `prisma/postgres/schema.prisma` と `prisma/postgres/migrations` を使って migrate + generate してから build します
5. Deploy

注意:
- サーバレス + Prisma + Postgres は接続数が増えやすいので、接続プール（pgBouncer など）や提供元の推奨設定に従ってください。
