import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import {
  listAccounts,
  listLocations,
  listReviews,
  refreshAccessToken,
  starRatingToNumber,
  GoogleReview,
} from '@/lib/google-business';

/**
 * Google 口コミ同期 API
 * POST /api/google-reviews/sync
 *
 * Google Business Profile API から口コミを取得し、
 * reviews テーブルに保存する
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // クリニック情報（Googleトークン含む）を取得
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    if (!clinic.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google account not connected. Please connect your Google Business Profile first.' },
        { status: 400 }
      );
    }

    // アクセストークンを更新
    let accessToken = clinic.google_access_token;
    const tokenExpiry = new Date(clinic.google_token_expires_at);

    if (tokenExpiry <= new Date()) {
      const newTokens = await refreshAccessToken(clinic.google_refresh_token);
      accessToken = newTokens.access_token;

      // 新しいトークンを保存
      await supabase
        .from('clinics')
        .update({
          google_access_token: newTokens.access_token,
          google_token_expires_at: new Date(
            Date.now() + newTokens.expires_in * 1000
          ).toISOString(),
        })
        .eq('id', clinic.id);
    }

    // アカウント・ロケーション情報を取得
    const accountsData = await listAccounts(accessToken);
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      return NextResponse.json(
        { error: 'No Google Business accounts found' },
        { status: 400 }
      );
    }

    const accountId = accountsData.accounts[0].name;

    // ロケーション取得（google_place_id が設定されていればそれを使う）
    const locationsData = await listLocations(accessToken, accountId);
    if (!locationsData.locations || locationsData.locations.length === 0) {
      return NextResponse.json(
        { error: 'No business locations found' },
        { status: 400 }
      );
    }

    const locationId = locationsData.locations[0].name;

    // 口コミを取得
    const reviewsData = await listReviews(accessToken, accountId, locationId);

    if (!reviewsData.reviews || reviewsData.reviews.length === 0) {
      return NextResponse.json({
        message: 'No reviews found',
        synced: 0,
      });
    }

    // 口コミをDBに保存（upsert）
    let syncedCount = 0;

    for (const googleReview of reviewsData.reviews) {
      const reviewData = {
        clinic_id: clinic.id,
        google_review_id: googleReview.reviewId,
        author_name: googleReview.reviewer.displayName,
        rating: starRatingToNumber(googleReview.starRating),
        text: googleReview.comment || '',
        published_at: googleReview.createTime,
        reply_text: googleReview.reviewReply?.comment || null,
        replied_at: googleReview.reviewReply?.updateTime || null,
        is_flagged: starRatingToNumber(googleReview.starRating) <= 3,
      };

      const { error: upsertError } = await supabase
        .from('reviews')
        .upsert(reviewData, {
          onConflict: 'google_review_id',
        });

      if (!upsertError) {
        syncedCount++;
      }
    }

    return NextResponse.json({
      message: `Synced ${syncedCount} reviews`,
      synced: syncedCount,
      total: reviewsData.totalReviewCount,
      averageRating: reviewsData.averageRating,
    });
  } catch (err) {
    console.error('Google reviews sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
