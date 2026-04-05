# クチコミ先生 - クイックスタートガイド

## 30秒で始める

### 1. 依存パッケージをインストール
```bash
npm install
```

### 2. 環境変数を設定
`.env.local` ファイルを作成:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
```

### 3. 開発サーバーを起動
```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## ページマップ

| URL | 説明 | 認証 |
|-----|------|------|
| `/` | ランディング | - |
| `/login` | ログイン | 不要 |
| `/dashboard` | ダッシュボード | 必要 |
| `/dashboard/qrcode` | QR コード生成 | 必要 |
| `/review/[clinicId]` | 患者向け評価 | 不要 |

## 主要機能

### ダッシュボード
- クチコミ統計表示
- クチコミリスト
- AI返信生成
- ログアウト

### AI返信生成
- 3トーン（形式的、フレンドリー、簡潔）
- ガイドラインチェック
- テキストコピー機能

### QR コード
- Google Maps URL から生成
- URL コピー
- プリント機能

### 患者向けページ
- 星評価セレクタ
- 高評価 → Google Maps
- 低評価 → フィードバック送信

## よくある作業

### AI返信を生成する
1. ダッシュボードでクチコミ一覧を表示
2. クチコミカードの "AI返信を生成" をクリック
3. 3つのトーンから選択
4. "コピー" で返信をコピー

### QR コードを作成する
1. `/dashboard/qrcode` にアクセス
2. Google Maps URL を入力
3. "QR コードを生成" をクリック
4. "コピー" または "印刷用PDF" でダウンロード

## トラブルシューティング

### ログインできない
- Supabase の Google Provider が有効か確認
- 認可済みリダイレクト URI が正しいか確認

### AI返信が出ない
- ANTHROPIC_API_KEY が設定されているか確認
- クレジットが残っているか確認

### クチコミが表示されない
- Supabase にクリニック情報が登録されているか確認
- SQL で診療所を追加:
```sql
INSERT INTO clinics (user_id, name, department, address)
VALUES ('your-user-id', 'テスト診療所', '内科', '東京都');
```

## ファイル構造

```
src/
├── app/
│   ├── layout.tsx - ルートレイアウト
│   ├── page.tsx - ランディング
│   ├── login/page.tsx - ログイン
│   ├── dashboard/
│   │   ├── page.tsx - ダッシュボード
│   │   ├── DashboardClient.tsx
│   │   └── qrcode/page.tsx - QR生成
│   ├── review/[clinicId]/page.tsx - 患者向け
│   └── api/
│       ├── auth/callback/route.ts - OAuth
│       └── ai-reply/route.ts - AI API
├── components/
│   ├── StarRating.tsx - 星評価
│   └── ReviewCard.tsx - クチコミカード
├── lib/
│   ├── supabase.ts - ブラウザクライアント
│   └── supabase-server.ts - サーバークライアント
└── types/
    └── index.ts - 型定義
```

## ビルド・デプロイ

### ローカルビルド
```bash
npm run build
npm start
```

### Vercel にデプロイ
```bash
npm i -g vercel
vercel
```

その後、環境変数を設定してリデプロイ。

## 次のステップ

1. **テスト**: すべての機能をローカルで確認
2. **デプロイ**: Vercel にデプロイ
3. **拡張**: クリニック登録画面を追加
4. **連携**: Google Places API を統合

## サポート

詳細は以下を参照:
- `SETUP_GUIDE.md` - 詳細なセットアップ
- `PROJECT_STRUCTURE.md` - プロジェクト構造
- `IMPLEMENTATION_CHECKLIST.md` - 完成度チェック

---

**準備完了。楽しい開発を！**
