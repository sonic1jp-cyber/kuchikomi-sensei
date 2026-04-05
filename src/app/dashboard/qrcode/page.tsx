'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Note: 実際の実装では react-qr-code ライブラリを使用
// npm install qrcode.react

interface QRCodeDisplayProps {
  url: string;
}

function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  // プレースホルダー実装
  // 実装時に react-qr-code を使用してください
  return (
    <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-4">
          QR コード表示エリア
        </p>
        <code className="text-xs text-gray-400 block break-all max-w-md">
          {url}
        </code>
        <p className="text-xs text-gray-400 mt-2">
          ※ react-qr-code ライブラリをインストール後に有効
        </p>
      </div>
    </div>
  );
}

export default function QRCodePage() {
  const router = useRouter();
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateQR = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Google Maps URL のバリデーション
      if (!googleMapsUrl.includes('maps.google.com') && !googleMapsUrl.includes('goo.gl')) {
        setError('有効な Google Maps URL を入力してください');
        return;
      }

      // クリニック ID を取得
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!clinic) {
        setError('クリニック情報が見つかりません');
        return;
      }

      // QR コード URL を生成
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const reviewUrl = `${baseUrl}/review/${clinic.id}`;

      setQrUrl(reviewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPDF = () => {
    // TODO: QR コード印刷用 PDF 生成
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">QR コード生成</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            {/* 説明 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="font-semibold text-blue-900 mb-2">
                患者様向けの QR コードを生成
              </h2>
              <p className="text-sm text-blue-800">
                このQRコードを院内に掲示することで、患者様が簡単に評価を投稿できます
              </p>
            </div>

            {/* Google Maps URL 入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Maps URL
              </label>
              <p className="text-xs text-gray-500 mb-2">
                クリニックの Google Maps ページの URL を入力してください
              </p>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?cid=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* QR コード表示 */}
            {qrUrl && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    QR コード
                  </p>
                  <QRCodeDisplay url={qrUrl} />
                </div>

                {/* URL 表示 */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    評価ページのURL
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrUrl}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrUrl);
                        // TODO: トースト通知
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      コピー
                    </button>
                  </div>
                </div>

                {/* 印刷ボタン */}
                <button
                  onClick={handlePrintPDF}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  印刷用PDFを生成
                </button>
              </div>
            )}

            {/* 生成ボタン */}
            {!qrUrl && (
              <button
                onClick={handleGenerateQR}
                disabled={!googleMapsUrl || isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '生成中...' : 'QR コードを生成'}
              </button>
            )}

            {/* リセットボタン */}
            {qrUrl && (
              <button
                onClick={() => {
                  setQrUrl(null);
                  setGoogleMapsUrl('');
                }}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                リセット
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
