'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CanvasMap } from '@/components/game/CanvasMap';
import { useMapSync } from '@/hooks/useMapSync';
import { TileType, TILE_DEFINITIONS } from '@/lib/constants';
import { useStock } from '@/hooks/useStock';
import { useGameLogic } from '@/hooks/useGameLogic';
import { RciMeter } from '@/components/game/RciMeter';

export default function GamePage() {
  const { user, isAllowed, loading, logout } = useAuth();
  const { tiles, loading: mapLoading } = useMapSync();
  const { stock, maxStock, consumeStock, refundStock } = useStock(user);
  const gameStats = useGameLogic(tiles);
  const router = useRouter();
  
  const [selectedTile, setSelectedTile] = useState<TileType | 'DELETE'>('R');

  useEffect(() => {
    if (!loading && (!user || isAllowed === false)) {
      router.push('/login');
    }
  }, [user, isAllowed, loading, router]);

  if (loading || !user || !isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-400 font-medium tracking-widest">LOADING CITY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <header className="p-3 bg-gray-800 flex justify-between items-center shadow-lg border-b border-gray-700 z-20">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 drop-shadow-md">
            PixelCity
          </h1>
          
          <div className="flex items-center gap-4">
            <RciMeter demand={gameStats.demand} />
            <div className="bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700/50 shadow-inner">
              <span className="text-xs text-gray-400 font-bold block mb-0.5">総人口</span>
              <span className="text-xl font-mono text-green-400">{gameStats.population.toLocaleString()} <span className="text-sm">人</span></span>
            </div>
            
            <div className="bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700/50 shadow-inner min-w-[200px]">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-gray-400 font-bold">資材ストック</span>
                <span className="text-sm font-mono text-blue-400">{stock.toFixed(1)} / {maxStock}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 ease-linear" 
                  style={{ width: `${(stock / maxStock) * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-xs">
                  {user.user_metadata?.full_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-gray-300">
              {user.user_metadata?.custom_claims?.global_name || user.user_metadata?.full_name || 'Player'}
            </span>
          </div>
          <button 
            onClick={logout}
            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-md text-xs font-bold transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* ツールバー */}
      <div className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 p-2.5 flex justify-center gap-3 shadow-sm z-10">
        {(Object.keys(TILE_DEFINITIONS) as TileType[]).filter(t => t !== 'GRASS').map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTile(type)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2.5 border-b-2 ${
              selectedTile === type 
                ? 'bg-gray-700 border-blue-500 text-white shadow-lg' 
                : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }`}
          >
            <div className="w-4 h-4 rounded border border-black/50 shadow-sm" style={{ backgroundColor: TILE_DEFINITIONS[type].color }} />
            {TILE_DEFINITIONS[type].name}
            <span className="text-[10px] text-gray-500 ml-1">cost:{TILE_DEFINITIONS[type].cost}</span>
          </button>
        ))}
        <button
          onClick={() => setSelectedTile('DELETE')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2.5 border-b-2 ${
            selectedTile === 'DELETE' 
              ? 'bg-red-900/50 border-red-500 text-white shadow-lg' 
              : 'bg-transparent border-transparent text-red-400 hover:bg-red-900/30 hover:text-red-300'
          }`}
        >
          <div className="w-4 h-4 rounded border border-black/50 shadow-sm bg-red-500 flex items-center justify-center text-[10px] text-white">✖</div>
          撤去
        </button>
      </div>

      <main className="flex-grow p-4 flex flex-col items-center justify-start bg-[#0b0f19] overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>
        
        {mapLoading ? (
          <div className="text-gray-400 mt-20 flex flex-col items-center z-10">
            <div className="animate-pulse w-10 h-10 bg-gray-700 rounded-md mb-4 shadow-lg shadow-blue-500/20"></div>
            マップデータを同期中...
          </div>
        ) : (
          <div className="z-10 relative shadow-2xl shadow-black/50 rounded-lg">
            <CanvasMap 
              tiles={tiles} 
              currentUser={user} 
              selectedTileType={selectedTile} 
              stock={stock}
              consumeStock={consumeStock}
              refundStock={refundStock}
            />
          </div>
        )}
      </main>
    </div>
  );
}
