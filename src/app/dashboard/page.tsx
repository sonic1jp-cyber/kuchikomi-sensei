import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { Clinic, Review, DashboardStats } from '@/types';
import DashboardClient from './DashboardClient';

async function getClinicData(userId: string): Promise<{
  clinic: Clinic | null;
  reviews: Review[];
  stats: DashboardStats;
}> {
  const supabase = await createServerSupabase();

  // ユーザーのクリニックを取得
  const { data: clinicData, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (clinicError || !clinicData) {
    return { clinic: null, reviews: [], stats: {
      totalReviews: 0,
      averageRating: 0,
      unrepliedCount: 0,
      thisMonthCount: 0,
      ratingDistribution: [],
      monthlyTrend: [],
    }};
  }

  // Google レビュー（reviews テーブル）を取得
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('*')
    .eq('clinic_id', clinicData.id)
    .order('published_at', { ascending: false });

  // 院内フィードバック（feedbacks テーブル）を取得
  const { data: feedbacksData } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('clinic_id', clinicData.id)
    .order('created_at', { ascending: false });

  // feedbacks を reviews と同じ形式に変換して統合
  const googleReviews: Review[] = (reviewsData || []) as Review[];
  const feedbackReviews: Review[] = (feedbacksData || []).map((fb: any) => ({
    id: fb.id,
    clinic_id: fb.clinic_id,
    google_review_id: null,
    author_name: '院内フィードバック',
    rating: fb.rating,
    text: fb.comment || '',
    published_at: fb.created_at,
    reply_text: null,
    replied_at: null,
    is_flagged: fb.rating <= 2,
    created_at: fb.created_at,
  }));

  // 統合して日付順にソート
  const allReviews = [...googleReviews, ...feedbackReviews].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  // 統計情報を計算
  const totalReviews = allReviews.length;
  const averageRating =
    totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const unrepliedCount = allReviews.filter((r) => !r.replied_at).length;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCount = allReviews.filter(
    (r) => new Date(r.published_at) >= thisMonthStart
  ).length;

  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: allReviews.filter((r) => r.rating === rating).length,
  }));

  // 月別トレンド（過去6ヶ月）
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const monthReviews = allReviews.filter((r) => {
      const rDate = new Date(r.published_at);
      return rDate >= monthStart && rDate <= monthEnd;
    });

    return {
      month: monthStart.toLocaleDateString('ja-JP', { month: 'short' }),
      count: monthReviews.length,
      avgRating:
        monthReviews.length > 0
          ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length
          : 0,
    };
  });

  const stats: DashboardStats = {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    unrepliedCount,
    thisMonthCount,
    ratingDistribution,
    monthlyTrend,
  };

  return { clinic: clinicData as Clinic, reviews: allReviews, stats };
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    redirect('/login');
  }

  const { clinic, reviews, stats } = await getClinicData(session.user.id);

  if (!clinic) {
    redirect('/clinic/setup');
  }

  return <DashboardClient clinic={clinic} initialReviews={reviews} stats={stats} />;
}
