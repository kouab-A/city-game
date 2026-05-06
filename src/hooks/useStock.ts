import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useStock(user: User | null) {
  const [stock, setStock] = useState<number>(0);
  const [maxStock, setMaxStock] = useState<number>(100);
  const [cooldown, setCooldown] = useState<number>(5);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const fetchSettingsAndStats = async () => {
      // ユーザーのストック情報を取得または作成
      let { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
      
      if (!stats && isMounted) {
        const { data: newStats } = await supabase.from('user_stats').insert({
          user_id: user.id,
          current_stock: 15,
          last_placed_at: new Date().toISOString()
        }).select().single();
        stats = newStats;
      }

      if (stats && isMounted) {
        // 固定設定
        const currentMax = 15;
        setMaxStock(currentMax);

        // 経過時間による回復分を計算
        const lastTime = new Date(stats.last_placed_at).getTime();
        const now = Date.now();
        const elapsedSeconds = (now - lastTime) / 1000;
        
        // 3秒ごとに0.1回復 = 1秒あたり (0.1 / 3) 回復
        const recovered = (elapsedSeconds / 3) * 0.1;
        
        let currentCalculatedStock = Math.min(currentMax, stats.current_stock + recovered);
        // 小数第1位で丸める
        currentCalculatedStock = Math.round(currentCalculatedStock * 10) / 10;
        
        setStock(currentCalculatedStock);

        // クライアント側での自動回復タイマー（3秒ごとに0.1追加）
        timer = setInterval(() => {
          setStock((prev) => {
            const next = prev + 0.1;
            return next >= currentMax ? currentMax : Math.round(next * 10) / 10;
          });
        }, 3000);
      }
    };

    fetchSettingsAndStats();

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [user]);

  // ストックの消費（DBも更新）
  const consumeStock = async (amount: number): Promise<boolean> => {
    if (stock < amount) return false;
    
    const newStock = stock - amount;
    setStock(newStock);
    
    await supabase.from('user_stats').update({
      current_stock: newStock,
      last_placed_at: new Date().toISOString()
    }).eq('user_id', user!.id);
    
    return true;
  };

  // ストックの返却（キャンセルの場合）
  const refundStock = async (amount: number) => {
    const newStock = Math.min(maxStock, stock + amount);
    setStock(newStock);
    
    await supabase.from('user_stats').update({
      current_stock: newStock,
      last_placed_at: new Date().toISOString()
    }).eq('user_id', user!.id);
  };

  return { stock, maxStock, consumeStock, refundStock };
}
