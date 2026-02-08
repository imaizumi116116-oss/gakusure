# 未確定事項 / 改善案

- Playwright 実行環境
  - 現在の環境ではネットワーク制限により `@playwright/test` を取得できませんでした。
  - オンライン環境で `npm install` 後、`npm run test:e2e` を再実行してよいか。

- 本番レート制限ストア
  - 現状はDB（`RateLimitBucket`）に記録し、DB未準備時はメモリにフォールバックします。
  - 高負荷/多台数運用では Redis 等の共有ストアへ移行する方針でよいか。

- CSRF強化レベル
  - 現状は `Origin` 検証 + カスタムヘッダで最低限対応。
  - 追加でダブルサブミットトークン方式を導入するか。

- 認証導入時の方針
  - 現在は匿名 + 任意ハンドル + cookie識別。
  - 将来の任意アカウント機能（メール or OAuth）の優先順位はどちらか。

- データモデルの整理
  - 既存互換のため `Category` モデルを残しています（MVP画面では利用最小化）。
  - MVP厳密化として `Thread/Post/Report` 中心へマイグレーション整理を行うか。

- 通報運用
  - 現状は通報保存 + 管理画面（`/admin`）で閲覧/非表示対応が可能です。
  - 追加で「通知（メール/Slack）」「対応ステータス」「対応ログ」を導入するか。

- Vercel（PostgreSQL）移行
  - 開発はSQLite、公開はPostgreSQL想定のため、Prisma schema/migrations を分けています（`prisma/schema.prisma` と `prisma/postgres/schema.prisma`）。
  - 将来的に開発もPostgreSQLへ寄せるか、スキーマ二重管理を続けるか。
