/**
 * Google Business Profile API クライアント
 *
 * 概要:
 * - Google Business Profile API v1 を使用
 * - OAuth2 でクリニックのGoogleアカウントと連携
 * - 口コミの取得と返信の投稿が可能
 *
 * 必要な環境変数:
 * - GOOGLE_CLIENT_ID: Google Cloud Console で取得
 * - GOOGLE_CLIENT_SECRET: Google Cloud Console で取得
 * - GOOGLE_REDIRECT_URI: OAuth コールバックURL
 *
 * セットアップ手順:
 * 1. Google Cloud Console でプロジェクトを作成
 * 2. Google Business Profile API を有効化
 * 3. OAuth 2.0 クライアント ID を作成
 * 4. リダイレクト URI を設定
 * 5. APIの利用申請（審査あり）
 */

const GOOGLE_API_BASE = 'https://mybusiness.googleapis.com/v4';
const GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// スコープ: ビジネスプロフィールの口コミ管理
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
];

/**
 * OAuth2 認証URLを生成
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `${GOOGLE_OAUTH_BASE}?${params.toString()}`;
}

/**
 * 認証コードをトークンに交換
 */
export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

/**
 * リフレッシュトークンでアクセストークンを更新
 */
export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

/**
 * Google Business Profile のアカウント一覧を取得
 */
export async function listAccounts(accessToken: string) {
  const response = await fetch(`${GOOGLE_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list accounts: ${response.status}`);
  }

  return response.json();
}

/**
 * ロケーション（店舗）一覧を取得
 */
export async function listLocations(accessToken: string, accountId: string) {
  const response = await fetch(
    `${GOOGLE_API_BASE}/${accountId}/locations`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to list locations: ${response.status}`);
  }

  return response.json();
}

/**
 * 口コミ一覧を取得
 */
export async function listReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  pageSize: number = 50,
  pageToken?: string
) {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (pageToken) params.set('pageToken', pageToken);

  const response = await fetch(
    `${GOOGLE_API_BASE}/${accountId}/${locationId}/reviews?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to list reviews: ${response.status}`);
  }

  return response.json() as Promise<{
    reviews: GoogleReview[];
    averageRating: number;
    totalReviewCount: number;
    nextPageToken?: string;
  }>;
}

/**
 * 口コミに返信を投稿
 */
export async function replyToReview(
  accessToken: string,
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string
) {
  const response = await fetch(
    `${GOOGLE_API_BASE}/${accountId}/${locationId}/reviews/${reviewId}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to reply to review: ${response.status}`);
  }

  return response.json();
}

// 型定義
export interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

/**
 * Google の星評価文字列を数値に変換
 */
export function starRatingToNumber(rating: GoogleReview['starRating']): number {
  const map: Record<string, number> = {
    ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
  };
  return map[rating] || 0;
}
