'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface ClinicSettings {
  id: string;
  name: string;
  department: string;
  address: string;
  google_maps_url: string | null;
  google_review_url: string | null;
  google_refresh_token: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // フォーム state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  useEffect(() => {
    const fetchClinic = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data } = await supabase
        .from('clinics')
        .select('id, name, department, address, google_maps_url, google_review_url, google_refresh_token')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setClinic(data);
        setName(data.name || '');
        setDepartment(data.department || '');
        setAddress(data.address || '');
        setGoogleMapsUrl(data.google_maps_url || '');
        setGoogleReviewUrl(data.google_review_url || '');
      }
      setIsLoading(false);
    };
    fetchClinic();
  }, [router]);

  const handleSave = async () => {
    if (!clinic) return;
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const supabase = createClient();
      const { error } = await supabase
        .from('clinics')
        .update({
          name,
          department,
          address,
          google_maps_url: googleMapsUrl || null,
          google_review_url: googleReviewUrl || null,
        })
        .eq('id', clinic.id);

      if (error) throw error;
      setSaveMessage('保存しました');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const isGoogleConnected = !!clinic?.google_refresh_token;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* クリニック基本情報 */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">クリニック情報</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">クリニック名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">診療科目</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GoogleマップURL</label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/place/..."
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google口コミ投稿URL <span className="text-blue-500 text-xs font-normal">（推奨）</span>
            </label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              患者様が星4〜5を付けた際にこのURLに誘導します
            </p>
          </div>

          {/* 保存ボタン */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-400"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            {saveMessage && (
              <span className={`text-sm font-medium ${
                saveMessage.includes('失敗') ? 'text-red-600' : 'text-green-600'
              }`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        {/* Google連携 */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Googleビジネスプロフィール連携</h2>

          {isGoogleConnected ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-green-800">連携済み</p>
                <p className="text-sm text-green-700">Googleマップの口コミを自動で取得できます</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Googleビジネスプロフィールを連携すると、以下の機能が使えるようになります：
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Googleマップの口コミを自動取得
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    AIによる返信文の自動生成
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ワンクリックでGoogleに返信を投稿
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    新着口コミの通知
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">セットアップ方法</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Google Cloud Console でプロジェクトを作成</li>
                  <li>Business Profile API を有効化</li>
                  <li>OAuth クライアントIDを作成</li>
                  <li>環境変数を設定</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  ※ APIの利用にはGoogleの審査が必要です（数日〜数週間）
                </p>
              </div>

              <button
                disabled
                className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                Googleアカウントと連携する（準備中）
              </button>
            </div>
          )}
        </div>

        {/* 通知設定 */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">新着口コミ通知</p>
                <p className="text-xs text-gray-500">新しい口コミが投稿された時にメールで通知</p>
              </div>
              <div className="relative">
                <input type="checkbox" disabled className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 cursor-not-allowed"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">低評価アラート</p>
                <p className="text-xs text-gray-500">星3以下の口コミが投稿された時に即時通知</p>
              </div>
              <div className="relative">
                <input type="checkbox" disabled className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 cursor-not-allowed"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">週次レポート</p>
                <p className="text-xs text-gray-500">毎週月曜に口コミの集計レポートをメール送信</p>
              </div>
              <div className="relative">
                <input type="checkbox" disabled className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 cursor-not-allowed"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"></div>
              </div>
            </label>
          </div>
          <p className="text-xs text-gray-400">※ 通知機能はGoogleビジネスプロフィール連携後に有効になります</p>
        </div>
      </main>
    </div>
  );
}
