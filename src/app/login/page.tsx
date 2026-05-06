'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, isAllowed, loading, login, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isAllowed) {
      router.push('/');
    }
  }, [user, isAllowed, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-700 text-center max-w-lg w-full">
        <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Pixel City Builder
        </h1>
        <p className="text-gray-400 mb-8">多人数同時参加型 ドット絵街づくりゲーム</p>
        
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : user && isAllowed === false ? (
          <div className="text-center p-6 bg-red-900/40 border border-red-800 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-red-400">アクセスが許可されていません</h2>
            <p className="mb-6 text-sm text-gray-300 leading-relaxed">
              あなたのDiscordアカウント <br/>
              <span className="font-mono text-gray-400">({user.user_metadata?.full_name || 'No Name'} / ID: {user.user_metadata?.provider_id})</span> <br/>
              はホワイトリストに登録されていません。
              管理人に連絡してアクセス権をリクエストしてください。
            </p>
            <button 
              onClick={logout} 
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
            >
              別のアカウントでやり直す
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Discordでログイン
          </button>
        )}
      </div>
    </div>
  );
}
