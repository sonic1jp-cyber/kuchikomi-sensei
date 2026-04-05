import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { exchangeCodeForTokens } from '@/lib/google-business';

/**
 * Google Business Profile OAuth コールバック
 * ユーザーがGoogleアカウント連携を承認した後にリダイレクトされる
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // clinic_id
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=google_auth_denied`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/dashboard?error=invalid_callback`, request.url)
      );
    }

    // 認証チェック
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // コードをトークンに交換
    const tokens = await exchangeCodeForTokens(code);

    // トークンをDBに保存（clinicsテーブルに追加カラムが必要）
    const { error: updateError } = await supabase
      .from('clinics')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
      .eq('id', state)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Failed to save Google tokens:', updateError);
      return NextResponse.redirect(
        new URL(`/dashboard?error=token_save_failed`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/dashboard?success=google_connected`, request.url)
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(`/dashboard?error=google_auth_failed`, request.url)
    );
  }
}
