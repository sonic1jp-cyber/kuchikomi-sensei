'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ClinicSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { error: insertError } = await supabase.from('clinics').insert({
        user_id: session.user.id,
        name,
        department,
        address,
        google_maps_url: googleMapsUrl || null,
        google_review_url: googleReviewUrl || null,
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('登録に失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              クリニック情報の登録
            </h1>
            <p className="text-gray-600 text-sm">
              まずはクリニックの基本情報を登録してください
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                クリニック名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：さくら歯科クリニック"
                required
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                診療科目
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="例：一般歯科・矯正歯科・小児歯科"
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                住所
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例：東京都渋谷区..."
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="googleMapsUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Googleマップ URL
              </label>
              <input
                id="googleMapsUrl"
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Googleマップで施設を検索し、共有URLを貼り付けてください
              </p>
            </div>

            <div>
              <label htmlFor="googleReviewUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Google口コミ投稿URL <span className="text-blue-500 text-xs font-normal">（推奨）</span>
              </label>
              <input
                id="googleReviewUrl"
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=..."
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <p>患者様がタップすると口コミ入力画面が直接開くURLです。</p>
                <details className="cursor-pointer">
                  <summary className="text-blue-600 hover:text-blue-800">取得方法を見る</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
                    <p>1. Googleマップでクリニックを検索</p>
                    <p>2. 「クチコミを書く」ボタンが表示されるページのURLをコピー</p>
                    <p>3. または Google ビジネスプロフィールの管理画面から「クチコミのリンクを取得」</p>
                  </div>
                </details>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !name}
              className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登録中...' : '登録してはじめる'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
