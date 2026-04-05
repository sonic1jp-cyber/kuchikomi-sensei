'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface Clinic {
  id: string;
  name: string;
  google_maps_url: string | null;
  google_review_url: string | null;
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
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name, google_maps_url, google_review_url')
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

    if (rating >= 4) {
      // 高評価 → 完了画面（Google誘導メイン）
      setPhase('complete');
    } else {
      // 低評価 → フィードバック画面
      setPhase('feedback');
    }
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
      setFeedbackSent(true);
      setPhase('complete');
    } catch (err) {
      setError('送信に失敗しました。もう一度お試しください。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google 誘導URL: 口コミ投稿URL > Google Maps URL > クリニック名検索
  // 口コミ投稿URLがあれば直接投稿画面に飛ばす
  const googleMapsUrl = clinic?.google_review_url
    ? clinic.google_review_url
    : clinic?.google_maps_url
      ? clinic.google_maps_url
      : clinic?.name
        ? `https://www.google.com/maps/search/${encodeURIComponent(clinic.name)}`
        : '';

  // --- エラー画面 ---
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

  // --- ローディング ---
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

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

            {/* ====== Phase 1: 星の選択 ====== */}
            {phase === 'select' && (
              <div className="space-y-6">
                <p className="text-center text-gray-700 font-medium mb-2">
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
                        {rating}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-400">
                  星をタップして評価してください
                </p>
              </div>
            )}

            {/* ====== Phase 2: 低評価フィードバック（星1-3） ====== */}
            {phase === 'feedback' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-700 font-medium mb-3">
                    ご意見をお聞かせください
                  </p>
                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="改善してほしい点やご要望など（任意）"
                  className="w-full h-28 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />

                <button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '送信中...' : '送信する'}
                </button>

                {/* 低評価でもGoogleリンクは小さく表示（ゲーティングではないという建前） */}
                <p className="text-center">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 underline"
                  >
                    Google マップで口コミを書く
                  </a>
                </p>

                <button
                  onClick={() => {
                    setPhase('select');
                    setSelectedRating(0);
                    setFeedbackText('');
                    setError(null);
                  }}
                  className="w-full py-2 px-4 text-gray-500 text-sm hover:text-gray-700 transition-all active:scale-95 active:bg-gray-100 rounded-lg"
                >
                  ← 戻る
                </button>
              </div>
            )}

            {/* ====== Phase 3: 完了画面 ====== */}
            {phase === 'complete' && (
              <div className="space-y-5 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-green-500"
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

                {selectedRating >= 4 ? (
                  /* --- 高評価: Googleへの誘導がメイン --- */
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      ありがとうございます！
                    </h2>
                    <p className="text-gray-600">
                      よろしければ Google でも口コミをお寄せいただけると大変嬉しいです
                    </p>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block py-4 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                      Google で口コミを書く
                    </a>
                    <p className="text-xs text-gray-400">
                      Googleマップが開きます
                    </p>
                  </div>
                ) : (
                  /* --- 低評価からフィードバック送信後 --- */
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      ご意見ありがとうございました
                    </h2>
                    <p className="text-gray-500 text-sm">
                      いただいたご意見は今後の改善に活かしてまいります
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-gray-400 mt-6 opacity-75">
          Powered by クチコミ先生
        </p>
      </div>
    </div>
  );
}
