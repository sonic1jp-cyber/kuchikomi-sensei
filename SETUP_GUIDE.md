# クチコミ先生 - セットアップガイド

## 前提条件

- Node.js 18.17以上
- npm または yarn
- Supabase アカウント
- Anthropic Claude API キー（Claude 3.5 Sonnet以上推奨）

## インストール手順

### 1. 依存パッケージのインストール

```bash
cd kuchikomi-sensei
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定します:

```bash
# Supabase 設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Anthropic API キー（サーバーサイドのみ）
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Supabase 設定

Supabase ダッシュボードから:

1. **SQL エディタ**を開く
2. `supabase_schema.sql` のコンテンツをコピー
3. 実行してスキーマを作成

### 4. Google OAuth 設定（Supabase）

Supabase Authentication パネルから:

1. **Providers** > **Google** を有効化
2. Google Cloud Console で OAuth 2.0 認証情報を設定
3. 認可済みリダイレクト URI に以下を追加:
   - `http://localhost:3000/api/auth/callback` （開発時）
   - `https://your-domain.com/api/auth/callback` （本番）

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

## プロジェクト構成

### ページ一覧

| URL | 説明 | 認証 |
|-----|------|------|
| `/` | ランディング（認証状態に応じてリダイレクト） | - |
| `/login` | ログインページ | 不要 |
| `/dashboard` | ダッシュボード | 必要 |
| `/dashboard/qrcode` | QR コード生成 | 必要 |
| `/review/[clinicId]` | 患者向け評価フォーム | 不要 |

### API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/auth/callback` | OAuth コールバック |
| POST | `/api/ai-reply` | AI 返信生成 |

## よくある質問

### Q: QR コードが表示されません

**A**: `react-qrcode-logo` がインストールされていることを確認してください。デモでは URL テキスト表示になっています。

実装するには:

```tsx
import QRCode from 'qrcode.react';

function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={qrRef} className="bg-white p-8 rounded-lg">
      <QRCode value={url} size={256} level="H" />
    </div>
  );
}
```

### Q: AI 返信生成が失敗します

**A**: 以下を確認してください:

1. `ANTHROPIC_API_KEY` が正しく設定されているか
2. API キーに十分なクレジットがあるか
3. Claude 3.5 Sonnet 以上が使用可能か

### Q: Google ログインがリダイレクトループする

**A**: 以下を確認してください:

1. Supabase の Google Provider 設定が完了しているか
2. 認可済みリダイレクト URI が正しく設定されているか
3. ブラウザの開発者ツール > Network でエラーを確認

### Q: クリニック情報が取得できません

**A**: 以下の手順で診療所を作成してください:

```sql
INSERT INTO clinics (user_id, name, department, address)
VALUES (
  'your-user-id-from-auth',
  'テスト診療所',
  '内科',
  '東京都渋谷区'
);
```

（ユーザー ID は Supabase Authentication から取得）

## トラブルシューティング

### ビルドエラー: "Cannot apply unknown utility class"

**原因**: Tailwind CSS v4 の初期設定エラー

**解決**:
```bash
npm run build
```

### TypeScript エラー: "Property does not exist"

**原因**: 型定義が古い可能性

**解決**:
```bash
npm install --save-dev @types/next @types/react
```

### Supabase 接続エラー

**確認事項**:
- `.env.local` で `NEXT_PUBLIC_SUPABASE_URL` が正しいか
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか
- Supabase プロジェクトがアクティブか

## デプロイ（Vercel 推奨）

### Vercel へのデプロイ

```bash
# Vercel CLI をインストール（未インストール時）
npm i -g vercel

# デプロイ
vercel
```

### 環境変数をセット

Vercel ダッシュボード:
1. Settings > Environment Variables
2. 以下を追加:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`

### Google OAuth リダイレクト URI を更新

Supabase Authentication:
- `https://your-app.vercel.app/api/auth/callback` を追加

## パフォーマンス最適化

### 画像最適化

`react-qrcode-logo` で生成した QR コードは、以下で PNG に変換できます:

```tsx
const qrRef = useRef<HTMLDivElement>(null);

const handleDownload = () => {
  const canvas = qrRef.current?.querySelector('canvas');
  if (canvas) {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.png';
    link.click();
  }
};
```

### キャッシング戦略

- 静的ページ: ISR (Incremental Static Regeneration)
- ダッシュボード: リアルタイム（キャッシュなし）
- API: キャッシュなし

## セキュリティチェックリスト

- [ ] `.env.local` は `.gitignore` に追加
- [ ] API キーは環境変数経由のみ
- [ ] 本番環境では HTTPS を使用
- [ ] Supabase RLS が有効化されている
- [ ] CORS 設定を確認

## ログ確認

### ブラウザコンソール
```javascript
// Supabase セッション確認
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
console.log(session);
```

### サーバーログ
```bash
npm run dev
# http://localhost:3000 でコンソール出力確認
```

## 次のステップ

1. **クリニック管理画面** - クリニック情報の登録・編集
2. **Google Places API 連携** - クチコミ自動同期
3. **分析ダッシュボード** - グラフ・チャート表示
4. **メール通知** - 新規クチコミ到着時の通知

---

質問や問題がある場合は、GitHubまたはサポートチャネルにお問い合わせください。
