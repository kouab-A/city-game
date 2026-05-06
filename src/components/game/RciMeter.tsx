import { TILE_DEFINITIONS } from '@/lib/constants';

interface RciMeterProps {
  demand: { r: number; c: number; i: number };
}

export function RciMeter({ demand }: RciMeterProps) {
  const renderBar = (type: string, value: number, color: string) => {
    const isPositive = value >= 0;
    const width = `${Math.abs(value) / 2}%`; // -100~100 を 0~50% の幅で表現
    
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
        <span className="w-4 text-center">{type}</span>
        <div className="w-24 h-2.5 bg-gray-900 rounded flex relative shadow-inner">
          <div className="w-1/2 h-full border-r border-gray-600/50"></div>
          {isPositive ? (
            <div 
              className="absolute h-full top-0 left-1/2 rounded-r"
              style={{ width, backgroundColor: color }}
            />
          ) : (
            <div 
              className="absolute h-full top-0 right-1/2 rounded-l"
              style={{ width, backgroundColor: '#ef4444' }} // マイナス需要は赤
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 bg-gray-800/80 p-2.5 rounded-lg border border-gray-700 shadow backdrop-blur-sm">
      {renderBar('R', demand.r, TILE_DEFINITIONS.R.color)}
      {renderBar('C', demand.c, TILE_DEFINITIONS.C.color)}
      {renderBar('I', demand.i, TILE_DEFINITIONS.I.color)}
    </div>
  );
}
