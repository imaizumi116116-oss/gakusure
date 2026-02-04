# QuietTube

YouTube Data API v3 を使った、ミニマルな動画検索アプリです。Vite + Vanilla JS でローカル実行できます。

## セットアップ

1. 依存関係のインストール

```bash
npm install
```

2. `.env` を作成

```bash
cp .env.example .env
```

`.env` を編集して API キーを設定します。

```
VITE_YT_API_KEY=YOUR_API_KEY_HERE
```

3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

## YouTube API キーの作成と制限

1. Google Cloud Console でプロジェクトを作成
2. 「YouTube Data API v3」を有効化
3. 認証情報から API キーを作成
4. **HTTP リファラ制限（推奨）**
   ローカル開発: `http://localhost:5173/*`
   本番環境: 実際のドメインを追加
5. **API 制限**として「YouTube Data API v3」のみに限定

> クライアント実装のため API キーはブラウザに露出します。公開する場合は必ずリファラ制限を設定してください。

## 仕様

- 検索バー（Enter / 検索ボタン）で動画検索
- 初期表示はデフォルト検索語（Apple）で一覧表示
- 1ページ最大12件の動画を取得
- 「Previous」「Next」でページ移動（pageToken 使用）
- 動画カードをクリックするとモーダルで再生
- `Esc` でモーダルを閉じる／背景スクロール禁止／フォーカストラップ対応

## エラー・Quota の挙動

- API キー未設定: `VITE_YT_API_KEY` の設定を促すメッセージを表示
- Quota 超過: しばらく時間を空けて再試行する旨を表示
- ネットワーク失敗: 接続確認を促すメッセージを表示
- その他 API エラー: 一般的なエラーメッセージを表示

## デザイン

- Apple 公式サイト風のライトテーマ
- 余白とタイポグラフィを強調
- 半透明ヘッダー + 軽いブラー
- グリッドカードと控えめなアニメーション
