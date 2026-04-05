-- =====================================================
-- Google Business Profile API 連携用マイグレーション
-- =====================================================
-- clinics テーブルに Google OAuth トークンを保存するカラムを追加

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS google_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_account_id TEXT,
  ADD COLUMN IF NOT EXISTS google_location_id TEXT;

-- reviews テーブルの google_review_id にユニーク制約を追加（upsert用）
-- 既存のNULL値を許可するため、部分インデックスを使用
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_google_review_id
  ON reviews (google_review_id)
  WHERE google_review_id IS NOT NULL;

-- コメント
COMMENT ON COLUMN clinics.google_access_token IS 'Google Business Profile API のアクセストークン';
COMMENT ON COLUMN clinics.google_refresh_token IS 'Google Business Profile API のリフレッシュトークン';
COMMENT ON COLUMN clinics.google_token_expires_at IS 'アクセストークンの有効期限';
COMMENT ON COLUMN clinics.google_account_id IS 'Google Business Profile のアカウントID (accounts/xxx)';
COMMENT ON COLUMN clinics.google_location_id IS 'Google Business Profile のロケーションID (locations/xxx)';
