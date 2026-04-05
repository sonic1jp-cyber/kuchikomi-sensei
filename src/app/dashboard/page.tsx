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

  // レビューを取得
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('clinic_id', clinicData.id)
    .order('published_at', { ascending: false });

  if (reviewsError || !reviewsData) {
    return { clinic: clinicData, reviews: [], stats: {
      totalReviews: 0,
      averageRating: 0,
      unrepliedCount: 0,
      thisMonthCount: 0,
      ratingDistribution: [],
      monthlyTrend: [],
    }};
  }

  const reviews = reviewsData as Review[];

  // 統計情報を計算
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const unrepliedCount = reviews.filter((r) => !r.replied_at).length;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCount = reviews.filter(
    (r) => new Date(r.published_at) >= thisMonthStart
  ).length;

  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
  }));

  // 月別トレンド（過去6ヶ月）
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (5 - i));
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const monthReviews = reviews.filter((r) => {
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

  return { clinic: clinicData as Clinic, reviews, stats };
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    redirect('/login');
  }

  const { clinic, reviews, stats } = await getClinicData(session.user.id);

  if (!clinic) {
    // TODO: クリニック登録ページへリダイレクト
    redirect('/clinic/setup');
  }

  return <DashboardClient clinic={clinic} initialReviews={reviews} stats={stats} />;
}
