'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface Clinic {
  id: string;
  name: string;
  google_maps_url: string | null;
}

type RatingPhase = 'select' | 'feedback' | 'complete';

export default function ReviewPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [phase, setPhase] = useState<RatingPhase>('select');
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name, google_maps_url')
          .eq('id', clinicId)
          .single();

        if (error) throw error;
        setClinic(data);
      } catch (err) {
        setError('クリニック情報を取得できません');
        console.error(err);
      }
    };

    if (clinicId) {
      fetchClinic();
    }
  }, [clinicId]);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    // 全評価でフィードバック画面へ（レビューゲーティングを避ける）
    setPhase('feedback');
  };

  const handleSubmitFeedback = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.from('feedbacks').insert({
        clinic_id: clinicId,
        rating: selectedRating,
        comment: feedbackText || null,
      });

      if (error) throw error;
      setPhase('complete');
    } catch (err) {
      setError('フィードバックの送信に失敗しました');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipToGoogle = () => {
    // フィードバックなしでGoogle誘導（全評価で可能）
    setPhase('complete');
  };

  // Google Maps URL: 登録済みURLがあればそれを使う、なければクリニック名検索
  const googleMapsUrl = clinic?.google_maps_url
    ? clinic.google_maps_url
    : clinic?.name
      ? `https://www.google.com/maps/search/${encodeURIComponent(clinic.name)}`
      : '';

  if (error && !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">エラー</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {clinic.name}
            </h1>
            <p className="text-blue-100">
              本日はご来院ありがとうございました
            </p>
          </div>

          {/* コンテンツ */}
          <div className="p-6">
            {phase === 'select' && (
              <div className="space-y-6">
                <div>
                  <p className="text-center text-gray-700 font-medium mb-6">
                    ご来院の感想をお聞かせください
                  </p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingSelect(rating)}
                        className="group relative"
                      >
                        <svg
                          className="w-12 h-12 text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {rating} つ星
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-center text-gray-500">
                  上の星をクリックして評価してください
                </p>
              </div>
            )}

            {phase === 'feedback' && (
              <div className="space-y-4">
                <div>
                  <p className="text-center text-gray-700 font-medium mb-3">
                    {selectedRating >= 4
                      ? 'ありがとうございます！よろしければご意見もお聞かせください'
                      : 'ご意見・ご要望をお聞かせください'}
                  </p>
                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-6 h-6 ${star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="ご意見・ご要望をお聞かせください（任意）"
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />

                <div className="space-y-2">
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '送信中...' : 'ご意見を送信'}
                  </button>

                  {selectedRating >= 4 && (
                    <button
                      onClick={handleSkipToGoogle}
                      className="w-full py-2 px-4 text-blue-600 bg-white border border-blue-300 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                    >
                      スキップして Google に口コミを書く
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPhase('select');
                      setSelectedRating(0);
                      setFeedbackText('');
                      setError(null);
                    }}
                    className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    戻る
                  </button>
                </div>
              </div>
            )}

            {phase === 'complete' && (
              <div className="space-y-4 text-center">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-green-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                {/* 全評価でGoogle口コミリンクを表示（レビューゲーティングしない） */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    ありがとうございます！
                  </h2>
                  <p className="text-gray-600 mb-4">
                    よろしければ Google でも口コミをお寄せください
                  </p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    Google で口コミを投稿する
                  </a>
                  <p className="text-xs text-gray-400 mt-3">
                    口コミの投稿は任意です
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-white mt-6 opacity-75">
          クチコミ先生
        </p>
      </div>
    </div>
  );
}
