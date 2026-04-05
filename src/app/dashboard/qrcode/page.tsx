'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

interface ClinicData {
  id: string;
  name: string;
  google_maps_url: string | null;
}

export default function QRCodePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // ページ読み込み時に自動でQRコードを生成
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('id, name, google_maps_url')
          .eq('user_id', session.user.id)
          .single();

        if (clinicError || !clinicData) {
          setError('クリニック情報が見つかりません');
          return;
        }

        setClinic(clinicData);

        // レビューページURLを自動生成
        const baseUrl = window.location.origin;
        setReviewUrl(`${baseUrl}/review/${clinicData.id}`);
      } catch (err) {
        setError('データの取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const handleCopy = async () => {
    if (!reviewUrl) return;
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- ローディング ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // --- エラー ---
  if (error || !clinic || !reviewUrl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">QR コード</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error || 'クリニック情報がありません'}</p>
            {!clinic?.google_maps_url && (
              <p className="text-red-600 text-sm mt-2">
                クリニック設定で Google Maps URL を登録してください
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {/* ===== 画面表示用（印刷時は非表示） ===== */}
      <div className="min-h-screen bg-gray-50 print:hidden">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">QR コード</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* QRコード表示 */}
          <div className="bg-white rounded-xl shadow p-8 text-center space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{clinic.name}</h2>
            <p className="text-sm text-gray-500">患者様向け口コミ収集用QRコード</p>

            <div className="flex justify-center py-4">
              <QRCodeCanvas value={reviewUrl} size={240} level="H" includeMargin />
            </div>

            {/* URL表示 + コピー */}
            <div className="flex gap-2">
              <input
                type="text"
                value={reviewUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-600"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {copied ? 'コピーしました!' : 'コピー'}
              </button>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <button
              onClick={handlePrint}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              印刷用ポスターを表示
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors active:scale-[0.98]"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </main>
      </div>

      {/* ===== 印刷用ポスター（画面では非表示、印刷時のみ表示） ===== */}
      <div ref={printRef} className="hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />
        <div style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif',
        }}>
          {/* クリニック名 */}
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            {clinic.name}
          </div>

          {/* メインメッセージ */}
          <div style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px',
            textAlign: 'center',
            lineHeight: '1.3',
          }}>
            口コミのご協力を
          </div>
          <div style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '32px',
            textAlign: 'center',
            lineHeight: '1.3',
          }}>
            お願いいたします
          </div>

          {/* 説明テキスト */}
          <div style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '32px',
            textAlign: 'center',
            lineHeight: '1.6',
          }}>
            下のQRコードをスマートフォンで<br />
            読み取ってください
          </div>

          {/* QRコード */}
          <div style={{
            padding: '24px',
            border: '3px solid #e5e7eb',
            borderRadius: '16px',
            marginBottom: '32px',
            background: '#ffffff',
          }}>
            <QRCodeCanvas value={reviewUrl} size={220} level="H" includeMargin />
          </div>

          {/* 星のイメージ */}
          <div style={{
            fontSize: '40px',
            marginBottom: '16px',
            letterSpacing: '4px',
          }}>
            ★★★★★
          </div>

          {/* サブメッセージ */}
          <div style={{
            fontSize: '15px',
            color: '#9ca3af',
            textAlign: 'center',
            lineHeight: '1.6',
          }}>
            皆様のお声が私たちの励みになります<br />
            ご協力ありがとうございます
          </div>

          {/* フッター */}
          <div style={{
            marginTop: '40px',
            fontSize: '11px',
            color: '#d1d5db',
          }}>
            Powered by クチコミ先生
          </div>
        </div>
      </div>
    </>
  );
}
