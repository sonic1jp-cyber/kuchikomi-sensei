'use client';

import { useState } from 'react';
import { Review, AiReply } from '@/types';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: Review;
  onAiReplyGenerated?: (replies: AiReply[]) => void;
}

export function ReviewCard({ review, onAiReplyGenerated }: ReviewCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<AiReply[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReplies = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.text,
          rating: review.rating,
        }),
      });

      if (!response.ok) {
        throw new Error('AI返信生成に失敗しました');
      }

      const data = await response.json();
      setReplies(data);
      setShowReplies(true);
      onAiReplyGenerated?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReply = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: トースト通知
  };

  const publishedDate = new Date(review.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isFlagged = review.rating <= 3;

  return (
    <div
      className={`rounded-lg border p-5 transition-colors ${
        isFlagged
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="font-medium text-gray-900">{review.author_name}</div>
            {isFlagged && (
              <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
                低評価
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                review.replied_at
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {review.replied_at ? '返信済' : '未返信'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <StarRating rating={review.rating} size="sm" />
            <span className="font-medium text-gray-900">{review.rating}</span>
            <span>•</span>
            <span>{publishedDate}</span>
          </div>
        </div>
      </div>

      {/* クチコミテキスト */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {review.text}
      </p>

      {/* 既存の返信 */}
      {review.reply_text && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs font-semibold text-blue-900 mb-1">クリニックからの返信</p>
          <p className="text-sm text-blue-800">{review.reply_text}</p>
        </div>
      )}

      {/* AI返信候補表示 */}
      {showReplies && replies.length > 0 && (
        <div className="mb-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">AI返信候補</p>
          {replies.map((reply) => (
            <div key={reply.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 capitalize">
                  {reply.tone === 'formal' && '形式的'}
                  {reply.tone === 'friendly' && 'フレンドリー'}
                  {reply.tone === 'concise' && '簡潔'}
                </span>
                <button
                  onClick={() => handleCopyReply(reply.content)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  コピー
                </button>
              </div>
              <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
              {reply.guideline_warnings && reply.guideline_warnings.length > 0 && (
                <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                  <p className="font-semibold mb-1">ガイドライン確認</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {reply.guideline_warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* AI返信生成ボタン */}
      {!review.replied_at && (
        <button
          onClick={handleGenerateReplies}
          disabled={isGenerating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'AI返信を生成中...' : 'AI返信を生成'}
        </button>
      )}
    </div>
  );
}
