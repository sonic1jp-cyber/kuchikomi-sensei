# クチコミ先生 - プロジェクト構造

Next.js (App Router) + TypeScript + Tailwind CSS で実装した、クリニック向けの Google クチコミ管理・AI返信生成ツールです。

## ファイル構成

### ルートレベル

- **middleware.ts** - 認証・セッション管理用ミドルウェア
- **package.json** - 依存パッケージ管理
- **tailwind.config.ts** - Tailwind CSS 設定
- **postcss.config.mjs** - PostCSS 設定
- **tsconfig.json** - TypeScript 設定

### ソースコード構造

```
src/
├── app/
│   ├── layout.tsx                 # ルートレイアウト（Inter フォント、言語設定）
│   ├── page.tsx                   # ランディング/リダイレクトページ
│   ├── globals.css                # グローバルスタイル
│   ├── login/
│   │   └── page.tsx               # ログインページ（Google OAuth）
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts       # OAuth コールバックハンドラ
│   │   └── ai-reply/
│   │       └── route.ts           # AI 返信生成 API
│   ├── dashboard/
│   │   ├── page.tsx               # ダッシュボード（サーバーコンポーネント）
│   │   ├── DashboardClient.tsx    # ダッシュボード（クライアントコンポーネント）
│   │   └── qrcode/
│   │       └── page.tsx           # QR コード生成ページ
│   └── review/
│       └── [clinicId]/
│           └── page.tsx           # 公開評価リクエストページ（認証不要）
├── components/
│   ├── StarRating.tsx             # 星評価コンポーネント（表示・インタラクティブ）
│   └── ReviewCard.tsx             # クチコミカード（AI返信生成機能付き）
├── lib/
│   ├── supabase.ts                # Supabase ブラウザクライアント
│   └── supabase-server.ts         # Supabase サーバークライアント
└── types/
    └── index.ts                   # 型定義（Clinic, Review, AiReply, など）
```

## 主要ファイルの説明

### ページ・レイアウト

#### `src/app/layout.tsx`
- Inter フォントを使用
- メタデータ設定（タイトル: "クチコミ先生"）
- 言語を `ja` に設定
- グローバルスタイル適用

#### `src/app/page.tsx`
- ユーザーの認証状態をチェック
- ログイン済み → `/dashboard` へリダイレクト
- 未ログイン → `/login` へリダイレクト

#### `src/app/login/page.tsx`
- Google OAuth を使用したログイン
- Supabase `signInWithOAuth` メソッド利用
- クリーンなセンタリングデザイン
- 医療クリニック向けの説明メッセージ

#### `src/app/dashboard/page.tsx`
- サーバーコンポーネント
- Supabase から診療所情報・クチコミを取得
- 統計情報を計算（平均評価、未返信数、月別トレンド）

#### `src/app/dashboard/DashboardClient.tsx`
- クライアントコンポーネント
- ヘッダー（診療所名、ログアウトボタン）
- 統計カード（総数、平均評価、未返信数、今月のクチコミ）
- クチコミリスト表示
- QR コード生成ページへのリンク

#### `src/app/dashboard/qrcode/page.tsx`
- Google Maps URL 入力フォーム
- QR コード URL 生成
- プリント用 PDF 生成機能（`window.print()`）
- URL コピーボタン

#### `src/app/review/[clinicId]/page.tsx`
- 公開ページ（認証不要）
- 5 段階の星評価セレクタ
- 評価 >= 4: Google Maps へのリンク表示
- 評価 <= 3: 院内フィードバック用テキストエリア + 送信
- Supabase `feedbacks` テーブルに保存
- モバイル優先デザイン

### API ルート

#### `src/app/api/auth/callback/route.ts`
- OAuth コールバックハンドラ
- `exchangeCodeForSession()` でセッション確立
- ダッシュボードへリダイレクト

#### `src/app/api/ai-reply/route.ts`
- **メソッド**: POST
- **リクエスト**: `{ reviewText: string, rating: number }`
- **レスポンス**: `AiReply[]` (3 つのトーン: formal, friendly, concise)
- Anthropic Claude API を使用
- 医療広告ガイドラインチェック:
  - NG キーワード検出（治ります、最高の治療、日本一など）
  - 警告メッセージ生成
- 各返信候補に `guideline_warnings` を含める

### コンポーネント

#### `src/components/StarRating.tsx`
- **Props**:
  - `rating: number` - 表示する星の数
  - `interactive?: boolean` - クリック可能にするか
  - `onRatingChange?: (rating: number) => void` - コールバック
  - `size?: 'sm' | 'md' | 'lg'` - サイズ
- 表示モード（read-only）とインタラクティブモードに対応

#### `src/components/ReviewCard.tsx`
- **Props**:
  - `review: Review` - クチコミデータ
  - `onAiReplyGenerated?: (replies: AiReply[]) => void` - コールバック
- 機能:
  - クチコミ表示（作成者、評価、テキスト、日付）
  - 返信状態表示（返信済/未返信）
  - 低評価（<=3）のハイライト表示
  - "AI返信を生成" ボタン
  - AI返信の 3 つの候補表示
  - 各候補にコピーボタン
  - ガイドラインチェック結果表示

### 型定義

`src/types/index.ts` で以下の型を定義:

- **Clinic** - 診療所情報
- **Review** - Google クチコミ
- **AiReply** - AI 生成返信
- **Feedback** - 院内フィードバック
- **DashboardStats** - ダッシュボード統計

### スタイル

#### `src/app/globals.css`
- Tailwind CSS v4 を使用
- `@import "tailwindcss"` で全機能を有効化
- カスタム CSS 変数（フォント、背景色など）

## デザインテーマ

- **色**: 青/白/医療系グレー
- **フォント**: Inter（Google Fonts）
- **レスポンシブ**: モバイルファースト
- **Tailwind クラス**: 標準ユーティリティクラスを活用

## 認証フロー

1. ユーザーが `/login` にアクセス
2. "Google でログイン" ボタンをクリック
3. Supabase OAuth フロー開始
4. Google ログイン完了 → `/api/auth/callback` へリダイレクト
5. セッション確立 → `/dashboard` へリダイレクト

## データフロー

### クチコミの流れ
1. 診療所スタッフが QR コード生成 (`/dashboard/qrcode`)
2. QR コードを院内に掲示
3. 患者が QR コードをスキャン → `/review/[clinicId]` にアクセス
4. 患者が評価投稿
   - 高評価 → Google Maps リンク表示
   - 低評価 → フィードバック送信 → `feedbacks` テーブルに保存

### AI 返信生成
1. ダッシュボードでクチコミ未返信を表示
2. "AI返信を生成" をクリック
3. `/api/ai-reply` に POST（review text + rating）
4. Claude API で 3 種類の返信候補を生成
5. ガイドラインチェック実施
6. UI に 3 つの候補を表示（各候補にコピーボタン）

## ビルド・デプロイ

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番実行
npm start
```

ビルド結果:
- ✓ TypeScript コンパイル成功
- ✓ 静的ページプリレンダリング成功
- ✓ 動的ページ（ダッシュボード、API）は on-demand でサーバーレンダリング

## 環境変数

必須:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名キー
- `ANTHROPIC_API_KEY` - Claude API キー（サーバーサイド）

## 依存パッケージ

主要:
- `next@16.2.2` - フレームワーク
- `react@19.2.4` - UI ライブラリ
- `typescript@5` - 言語
- `tailwindcss@4` - CSS フレームワーク
- `@supabase/ssr@0.10.0` - Supabase (SSR対応)
- `@anthropic-ai/sdk@0.82.0` - Claude API
- `react-qrcode-logo@4.0.0` - QR コード生成
- `qrcode@1.5.4` - QR コードライブラリ

## セキュリティ

- **RLS (Row Level Security)** - Supabase で行レベルセキュリティを設定
- **認証ミドルウェア** - セッション管理
- **API ルート** - サーバーサイド処理で API キーを保護
- **CORS** - Next.js が自動処理

## 今後の実装予定

- [ ] クリニック登録ページ
- [ ] クチコミ同期機能（Google Places API連携）
- [ ] 返信の保存・編集・削除機能
- [ ] 分析ダッシュボード（グラフ表示）
- [ ] メール通知機能
- [ ] マルチクリニック対応
- [ ] ダークモード対応
- [ ] 多言語対応

---

**作成日**: 2026-04-05
**バージョン**: 0.1.0
