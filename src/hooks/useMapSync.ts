import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapTile } from '@/types/game';

export function useMapSync() {
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回データ取得
    const fetchTiles = async () => {
      const { data, error } = await supabase.from('map_tiles').select('*');
      if (data && !error) {
        setTiles(data);
      }
      setLoading(false);
    };

    fetchTiles();

    // リアルタイムサブスクリプション
    const channel = supabase
      .channel('public:map_tiles')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'map_tiles' },
        (payload) => {
          setTiles((current) => [...current, payload.new as MapTile]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'map_tiles' },
        (payload) => {
          setTiles((current) => current.filter((tile) => tile.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { tiles, loading };
}
