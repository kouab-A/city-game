import { useMemo } from 'react';
import { MapTile } from '@/types/game';
import { TILE_DEFINITIONS, TileType } from '@/lib/constants';

export function useGameLogic(tiles: MapTile[]) {
  const stats = useMemo(() => {
    let population = 0;
    let r = 0;
    let c = 0;
    let i = 0;

    tiles.forEach(tile => {
      const def = TILE_DEFINITIONS[tile.tile_type as TileType];
      if (!def) return;
      
      population += def.population;
      
      if (tile.tile_type === 'R') r++;
      if (tile.tile_type === 'C') c++;
      if (tile.tile_type === 'I') i++;
    });

    // シンプルなRCI需要ロジック（住宅が増えれば商業・オフィス需要が増え、逆も然り）
    const totalRCI = r + c + i;
    const targetR = totalRCI > 0 ? (c + i) * 1.5 : 10;
    const targetC = totalRCI > 0 ? r * 0.3 : 5;
    const targetI = totalRCI > 0 ? r * 0.4 : 5;

    const demandR = targetR - r;
    const demandC = targetC - c;
    const demandI = targetI - i;

    // -100 から 100 の範囲に正規化
    const normalize = (val: number) => Math.max(-100, Math.min(100, Math.floor(val * 10)));

    return {
      population,
      counts: { r, c, i },
      demand: {
        r: normalize(demandR),
        c: normalize(demandC),
        i: normalize(demandI)
      }
    };
  }, [tiles]);

  return stats;
}
