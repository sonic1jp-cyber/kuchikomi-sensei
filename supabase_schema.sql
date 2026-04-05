-- ===== クチコミ先生 データベーススキーマ =====
-- Supabase SQL Editor にコピー&ペーストして実行してください

-- 1. クリニック情報テーブル
CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  google_place_id TEXT,
  google_maps_url TEXT,
  department TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. クチコミテーブル
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  google_review_id TEXT,
  author_name TEXT NOT NULL DEFAULT '匿名',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. AI返信候補テーブル
CREATE TABLE ai_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('formal', 'friendly', 'concise')),
  content TEXT NOT NULL,
  guideline_warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. 院内フィードバックテーブル（★3以下の患者からの声）
CREATE TABLE feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== RLS（行レベルセキュリティ）設定 =====

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- clinics: 自分のクリニックのみ操作可能
CREATE POLICY "Users can view own clinics" ON clinics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clinics" ON clinics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clinics" ON clinics
  FOR UPDATE USING (auth.uid() = user_id);

-- reviews: 自分のクリニックのクチコミのみ閲覧可能
CREATE POLICY "Users can view own clinic reviews" ON reviews
  FOR SELECT USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert reviews for own clinics" ON reviews
  FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own clinic reviews" ON reviews
  FOR UPDATE USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- ai_replies: 自分のクチコミの返信候補のみ
CREATE POLICY "Users can view own ai replies" ON ai_replies
  FOR SELECT USING (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN clinics c ON r.clinic_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert ai replies" ON ai_replies
  FOR INSERT WITH CHECK (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN clinics c ON r.clinic_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- feedbacks: 誰でも投稿可能（QRコードからのアクセス）、閲覧はオーナーのみ
CREATE POLICY "Anyone can insert feedback" ON feedbacks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own clinic feedbacks" ON feedbacks
  FOR SELECT USING (
    clinic_id IN (SELECT id FROM clinics WHERE user_id = auth.uid())
  );

-- ===== インデックス =====
CREATE INDEX idx_reviews_clinic_id ON reviews(clinic_id);
CREATE INDEX idx_reviews_published_at ON reviews(published_at DESC);
CREATE INDEX idx_reviews_is_flagged ON reviews(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_feedbacks_clinic_id ON feedbacks(clinic_id);
