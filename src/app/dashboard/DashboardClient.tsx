'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Clinic, Review, DashboardStats } from '@/types';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/StarRating';

interface DashboardClientProps {
  clinic: Clinic;
  initialReviews: Review[];
  stats: DashboardStats;
}

export default function DashboardClient({
  clinic,
  initialReviews,
  stats,
}: DashboardClientProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">クチコミ先生</h1>
              <p className="text-sm text-gray-500">{clinic.name}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 総クチコミ数 */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">総クチコミ数</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalReviews}
            </p>
          </div>

          {/* 平均評価 */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">平均評価</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-blue-600">
                {stats.averageRating.toFixed(1)}
              </p>
              <StarRating rating={stats.averageRating} size="md" />
            </div>
          </div>

          {/* 未返信数 */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">未返信</p>
            <p className={`text-3xl font-bold ${stats.unrepliedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.unrepliedCount}
            </p>
          </div>

          {/* 今月のクチコミ */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">今月のクチコミ</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.thisMonthCount}
            </p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex gap-4 mb-8">
          <a
            href="/dashboard/qrcode"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            QR コードを生成
          </a>
        </div>

        {/* クチコミリスト */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              クチコミ一覧
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              全 {initialReviews.length} 件
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {initialReviews.length > 0 ? (
              <div className="space-y-4 p-6">
                {initialReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">クチコミがまだありません</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
