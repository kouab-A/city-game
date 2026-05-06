export const MAP_SIZE = {
  width: 50,
  height: 50,
};

export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;

export type TileType = 'R' | 'C' | 'I' | 'ROAD' | 'GRASS';

export interface TileDef {
  type: TileType;
  color: string;
  cost: number;
  population: number;
  name: string;
}

export const TILE_DEFINITIONS: Record<TileType, TileDef> = {
  R: { type: 'R', color: '#4ADE80', cost: 1, population: 10, name: '住宅' },
  C: { type: 'C', color: '#60A5FA', cost: 1, population: 0, name: '商業' },
  I: { type: 'I', color: '#FBBF24', cost: 1, population: 0, name: 'オフィス' },
  ROAD: { type: 'ROAD', color: '#9CA3AF', cost: 0.5, population: 0, name: '道路' },
  GRASS: { type: 'GRASS', color: '#166534', cost: 0, population: 0, name: '草地' },
};
