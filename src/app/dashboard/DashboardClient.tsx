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
  isGoogleConnected: boolean;
}

export default function DashboardClient({
  clinic,
  initialReviews,
  stats,
  isGoogleConnected,
}: DashboardClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unreplied' | 'low'>('all');

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

  const handleSyncGoogle = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);

      const response = await fetch('/api/google-reviews/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSyncMessage(`${data.synced}件の口コミを同期しました`);
        // ページをリロードして最新データを表示
        setTimeout(() => router.refresh(), 1500);
      } else {
        setSyncMessage(data.error || '同期に失敗しました');
      }
    } catch (err) {
      setSyncMessage('同期中にエラーが発生しました');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // フィルタリング
  const filteredReviews = reviews.filter((review) => {
    if (filter === 'unreplied') return !review.replied_at;
    if (filter === 'low') return review.rating <= 3;
    return true;
  });

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
            <div className="flex items-center gap-3">
              <a
                href="/dashboard/settings"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
                title="設定"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Google連携バナー */}
        {!isGoogleConnected && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">Googleビジネスプロフィールを連携しましょう</p>
              <p className="text-sm text-yellow-700 mt-1">
                連携すると、Googleマップの口コミを自動取得し、AIで返信文を生成できるようになります。
              </p>
              <a
                href="/dashboard/settings"
                className="inline-block mt-2 text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
              >
                設定画面で連携する →
              </a>
            </div>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">総クチコミ数</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalReviews}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">平均評価</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-blue-600">{stats.averageRating.toFixed(1)}</p>
              <StarRating rating={stats.averageRating} size="md" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">未返信</p>
            <p className={`text-3xl font-bold ${stats.unrepliedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.unrepliedCount}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">今月のクチコミ</p>
            <p className="text-3xl font-bold text-blue-600">{stats.thisMonthCount}</p>
          </div>
        </div>

        {/* ツールバー */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <a
            href="/dashboard/qrcode"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QRコード
          </a>

          {isGoogleConnected && (
            <button
              onClick={handleSyncGoogle}
              disabled={isSyncing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-all active:scale-95 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  同期中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Google口コミを同期
                </>
              )}
            </button>
          )}

          <a
            href="/dashboard/settings"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300 transition-all active:scale-95"
          >
            設定
          </a>
        </div>

        {/* 同期メッセージ */}
        {syncMessage && (
          <div className={`mb-6 p-3 rounded-lg text-sm font-medium ${
            syncMessage.includes('失敗') || syncMessage.includes('エラー')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {syncMessage}
          </div>
        )}

        {/* フィルタータブ */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: 'all' as const, label: `全て (${reviews.length})` },
            { key: 'unreplied' as const, label: `未返信 (${reviews.filter(r => !r.replied_at).length})` },
            { key: 'low' as const, label: `低評価 (${reviews.filter(r => r.rating <= 3).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* クチコミリスト */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">クチコミ一覧</h2>
              <p className="text-sm text-gray-500 mt-1">{filteredReviews.length} 件表示</p>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredReviews.length > 0 ? (
              <div className="space-y-4 p-6">
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {filter === 'all' ? (
                  <div>
                    <p className="text-gray-500 mb-2">クチコミがまだありません</p>
                    {!isGoogleConnected && (
                      <p className="text-sm text-gray-400">Googleビジネスプロフィールを連携すると、口コミが自動で取り込まれます</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">該当するクチコミはありません</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
