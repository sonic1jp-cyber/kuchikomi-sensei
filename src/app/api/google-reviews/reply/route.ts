import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { refreshAccessToken, replyToReview } from '@/lib/google-business';

/**
 * Google 口コミ返信 API
 * POST /api/google-reviews/reply
 *
 * body: { reviewId: string, replyText: string }
 *
 * Google Business Profile API を使って口コミに返信し、
 * ローカルDBも更新する
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId, replyText } = await request.json();

    if (!reviewId || !replyText) {
      return NextResponse.json(
        { error: 'reviewId and replyText are required' },
        { status: 400 }
      );
    }

    // クリニック情報を取得
    const { data: clinic } = await supabase
      .from('clinics')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!clinic || !clinic.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google account not connected' },
        { status: 400 }
      );
    }

    // レビュー情報を取得
    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('clinic_id', clinic.id)
      .single();

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // アクセストークンを更新
    let accessToken = clinic.google_access_token;
    const tokenExpiry = new Date(clinic.google_token_expires_at);

    if (tokenExpiry <= new Date()) {
      const newTokens = await refreshAccessToken(clinic.google_refresh_token);
      accessToken = newTokens.access_token;

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

    // Google API で返信を投稿
    // 注: accountId と locationId は初回同期時にDBに保存しておく必要がある
    // 現在は簡易実装のため、google_review_id からパスを組み立てる
    if (review.google_review_id) {
      // Google Business Profile API v1 では name ベースのパスを使用
      // 例: accounts/123/locations/456/reviews/789
      // 実際のパスはアカウント・ロケーション設定から取得
      await replyToReview(
        accessToken,
        clinic.google_account_id || '',
        clinic.google_location_id || '',
        review.google_review_id,
        replyText
      );
    }

    // ローカルDBを更新
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        reply_text: replyText,
        replied_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update local review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Reply posted successfully',
      reviewId,
    });
  } catch (err) {
    console.error('Google review reply error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Reply failed' },
      { status: 500 }
    );
  }
}
