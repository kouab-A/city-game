'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MAP_SIZE, TILE_DEFINITIONS, TILE_WIDTH, TILE_HEIGHT, TileType } from '@/lib/constants';
import { MapTile } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface CanvasMapProps {
  tiles: MapTile[];
  currentUser: User;
  selectedTileType: TileType | 'DELETE';
  stock: number;
  consumeStock: (amount: number) => Promise<boolean>;
  refundStock: (amount: number) => Promise<void>;
}

export function CanvasMap(props: CanvasMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Reactの再レンダリングによるパフォーマンス低下とクロージャ問題を回避するため、
  // 最新のPropsやカメラ状態をRefに保持する
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
    // タイルが更新されたら再描画
    requestAnimationFrame(renderCanvas);
  }, [props]);

  const cameraRef = useRef({ x: 0, y: 100, scale: 2 });
  const hoveredRef = useRef<{ x: number; y: number } | null>(null);
  const jimenImgRef = useRef<HTMLImageElement | null>(null);
  const roadImgRef = useRef<HTMLImageElement | null>(null);
  const houseImgRef = useRef<HTMLImageElement | null>(null);
  const officeImgRef = useRef<HTMLImageElement | null>(null);
  const commImgRef = useRef<HTMLImageElement | null>(null);

  // 初期化
  useEffect(() => {
    if (canvasRef.current) {
      const parent = canvasRef.current.parentElement;
      if (parent) {
        const cw = parent.clientWidth;
        const ch = parent.clientHeight;
        
        // 初期の拡大率を上げるため、基準ピクセルを256から128に変更（より大きく表示される）
        const targetVisiblePixels = 128;
        const calculatedScale = Math.max(1, Math.min(cw, ch) / targetVisiblePixels);
        cameraRef.current.scale = calculatedScale;

        // 指定：「初期カメラは地面の真ん中からスタート」
        const centerGridX = MAP_SIZE.width / 2;
        const centerGridY = MAP_SIZE.height / 2;
        
        // スケール適用後のマップ中心座標
        const mapCenterX = (centerGridX - centerGridY) * (TILE_WIDTH / 2) * calculatedScale;
        const mapCenterY = (centerGridX + centerGridY) * (TILE_HEIGHT / 2) * calculatedScale;

        // 画面中心にマップの中心を合わせる
        cameraRef.current.x = cw / 2 - mapCenterX;
        cameraRef.current.y = ch / 2 - mapCenterY;
      }
    }
    
    // 背景画像（jimen.png）の読み込み
    const img = new Image();
    img.src = '/images/jimen.png';
    img.onload = () => {
      jimenImgRef.current = img;
      requestAnimationFrame(renderCanvas);
    };

    // 道路画像（road_1.png）の読み込み
    const roadImgObj = new Image();
    roadImgObj.src = '/images/road_1.png';
    roadImgObj.onload = () => {
      roadImgRef.current = roadImgObj;
      requestAnimationFrame(renderCanvas);
    };

    // 住宅画像（house_1.png）の読み込み
    const houseImgObj = new Image();
    houseImgObj.src = '/images/house_1.png';
    houseImgObj.onload = () => {
      houseImgRef.current = houseImgObj;
      requestAnimationFrame(renderCanvas);
    };

    // オフィス画像（office_1.png）の読み込み
    const officeImgObj = new Image();
    officeImgObj.src = '/images/office_1.png';
    officeImgObj.onload = () => {
      officeImgRef.current = officeImgObj;
      requestAnimationFrame(renderCanvas);
    };

    // 商業画像（comm_1.png）の読み込み
    const commImgObj = new Image();
    commImgObj.src = '/images/comm_1.png';
    commImgObj.onload = () => {
      commImgRef.current = commImgObj;
      requestAnimationFrame(renderCanvas);
    };
  }, []);

  // 描画エンジン
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const { x: offsetX, y: offsetY, scale } = cameraRef.current;
    const hoveredCell = hoveredRef.current;
    const { tiles } = propsRef.current;

    // ピクセルアートのぼやけ・隙間を防ぐためにMath.roundを使用
    const scaledTileW = Math.round(TILE_WIDTH * scale);
    const scaledTileH = Math.round(TILE_HEIGHT * scale);
    const jimenImg = jimenImgRef.current;
    const roadImg = roadImgRef.current;
    const houseImg = houseImgRef.current;
    const officeImg = officeImgRef.current;
    const commImg = commImgRef.current;

    const getScreenCoords = (gx: number, gy: number) => ({
      x: Math.round(offsetX + (gx - gy) * (TILE_WIDTH / 2) * scale),
      y: Math.round(offsetY + (gx + gy) * (TILE_HEIGHT / 2) * scale)
    });

    // 1. 背景グリッドの描画
    for (let y = 0; y < MAP_SIZE.height; y++) {
      for (let x = 0; x < MAP_SIZE.width; x++) {
        const { x: sx, y: sy } = getScreenCoords(x, y);
        
        if (jimenImg && jimenImg.complete && jimenImg.width > 0) {
          // 画像の元サイズを取得してスケール倍する（引き伸ばしを防ぐ）
          const imgW = Math.round(jimenImg.width * scale);
          const imgH = Math.round(jimenImg.height * scale);
          // 横方向は中央揃え、縦方向は上の座標を基準に描画
          ctx.drawImage(jimenImg, sx - imgW / 2, sy, imgW, imgH);
        } else {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + scaledTileW / 2, sy + scaledTileH / 2);
          ctx.lineTo(sx, sy + scaledTileH);
          ctx.lineTo(sx - scaledTileW / 2, sy + scaledTileH / 2);
          ctx.closePath();
          ctx.fillStyle = TILE_DEFINITIONS.GRASS.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // 2. 配置されたタイルの描画 (Zソート：奥から手前)
    const sortedTiles = [...tiles].sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.y - b.y);
    
    sortedTiles.forEach((tile) => {
      const def = TILE_DEFINITIONS[tile.tile_type as TileType];
      if (def) {
        const { x: sx, y: sy } = getScreenCoords(tile.x, tile.y);
        
        if (tile.tile_type === 'ROAD' && roadImg && roadImg.complete && roadImg.width > 0) {
          // 道路は road_1.png で描画（比率維持）
          const imgW = Math.round(roadImg.width * scale);
          const imgH = Math.round(roadImg.height * scale);
          ctx.drawImage(roadImg, sx - imgW / 2, sy, imgW, imgH);
        } else if (tile.tile_type === 'R' && houseImg && houseImg.complete && houseImg.width > 0) {
          // 住宅は house_1.png で描画（画像の下部をタイルの下部 sy + scaledTileH に合わせる）
          const imgW = Math.round(houseImg.width * scale);
          const imgH = Math.round(houseImg.height * scale);
          ctx.drawImage(houseImg, sx - imgW / 2, sy + scaledTileH - imgH, imgW, imgH);
        } else if (tile.tile_type === 'I' && officeImg && officeImg.complete && officeImg.width > 0) {
          // オフィスは office_1.png で描画
          const imgW = Math.round(officeImg.width * scale);
          const imgH = Math.round(officeImg.height * scale);
          ctx.drawImage(officeImg, sx - imgW / 2, sy + scaledTileH - imgH, imgW, imgH);
        } else if (tile.tile_type === 'C' && commImg && commImg.complete && commImg.width > 0) {
          // 商業は comm_1.png で描画
          const imgW = Math.round(commImg.width * scale);
          const imgH = Math.round(commImg.height * scale);
          ctx.drawImage(commImg, sx - imgW / 2, sy + scaledTileH - imgH, imgW, imgH);
        } else {
          // その他のタイルは平らな菱形として描画
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + scaledTileW / 2, sy + scaledTileH / 2);
          ctx.lineTo(sx, sy + scaledTileH);
          ctx.lineTo(sx - scaledTileW / 2, sy + scaledTileH / 2);
          ctx.closePath();
          ctx.fillStyle = def.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // 3. ホバーハイライト
    if (hoveredCell) {
      const { x: sx, y: sy } = getScreenCoords(hoveredCell.x, hoveredCell.y);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + scaledTileW / 2, sy + scaledTileH / 2);
      ctx.lineTo(sx, sy + scaledTileH);
      ctx.lineTo(sx - scaledTileW / 2, sy + scaledTileH / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  // イベントリスナーの登録（マウント時のみ実行）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let initialPinchDist: number | null = null;
    let initialScale = 1;
    let dragThresholdExceeded = false; // クリックかドラッグかを判定

    // ご提示いただいた数式での逆算（画面 -> グリッド）
    const getMouseGridPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      
      const { x: offsetX, y: offsetY, scale } = cameraRef.current;
      
      const adjX = (mouseX - offsetX) / scale;
      const adjY = (mouseY - offsetY) / scale;
      
      const gridX = Math.floor(((adjX / 16) + (adjY / 8)) / 2);
      const gridY = Math.floor(((adjY / 8) - (adjX / 16)) / 2);
      
      return { gridX, gridY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        dragThresholdExceeded = true;
        cameraRef.current.x += e.clientX - lastX;
        cameraRef.current.y += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        requestAnimationFrame(renderCanvas);
        return;
      }

      const { gridX, gridY } = getMouseGridPos(e.clientX, e.clientY);
      
      if (gridX >= 0 && gridX < MAP_SIZE.width && gridY >= 0 && gridY < MAP_SIZE.height) {
        if (hoveredRef.current?.x !== gridX || hoveredRef.current?.y !== gridY) {
          hoveredRef.current = { x: gridX, y: gridY };
          requestAnimationFrame(renderCanvas);
        }
      } else if (hoveredRef.current) {
        hoveredRef.current = null;
        requestAnimationFrame(renderCanvas);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragThresholdExceeded = false;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDragging = false;
      
      // ドラッグせずに離した場合のみクリック（配置）処理
      if (!dragThresholdExceeded && e.button === 0 && hoveredRef.current) {
        placeTile(hoveredRef.current.x, hoveredRef.current.y);
      }
    };

    // PC: ホイールズーム（画面中央を基準）
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.0015;
      const delta = -e.deltaY * zoomSensitivity;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      let newScale = cameraRef.current.scale * (1 + delta);
      newScale = Math.max(0.5, Math.min(newScale, 30)); // スケール制限
      
      const ratio = newScale / cameraRef.current.scale;
      cameraRef.current.x = centerX - (centerX - cameraRef.current.x) * ratio;
      cameraRef.current.y = centerY - (centerY - cameraRef.current.y) * ratio;
      cameraRef.current.scale = newScale;
      
      requestAnimationFrame(renderCanvas);
    };

    // スマホ: タッチイベント（ピンチイン・アウト、ドラッグ）
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.sqrt(dx*dx + dy*dy);
        initialScale = cameraRef.current.scale;
      } else if (e.touches.length === 1) {
        isDragging = true;
        dragThresholdExceeded = false;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        
        const { gridX, gridY } = getMouseGridPos(e.touches[0].clientX, e.touches[0].clientY);
        if (gridX >= 0 && gridX < MAP_SIZE.width && gridY >= 0 && gridY < MAP_SIZE.height) {
          hoveredRef.current = { x: gridX, y: gridY };
        } else {
          hoveredRef.current = null;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // スワイプによる画面スクロール防止
      
      if (e.touches.length === 2 && initialPinchDist !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const ratio = dist / initialPinchDist;
        
        let newScale = initialScale * ratio;
        newScale = Math.max(0.5, Math.min(newScale, 30));

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const sRatio = newScale / cameraRef.current.scale;
        
        cameraRef.current.x = centerX - (centerX - cameraRef.current.x) * sRatio;
        cameraRef.current.y = centerY - (centerY - cameraRef.current.y) * sRatio;
        cameraRef.current.scale = newScale;
        
        requestAnimationFrame(renderCanvas);
      } else if (e.touches.length === 1 && isDragging) {
        dragThresholdExceeded = true;
        cameraRef.current.x += e.touches[0].clientX - lastX;
        cameraRef.current.y += e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        requestAnimationFrame(renderCanvas);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
      }
      if (e.touches.length === 0) {
        if (!dragThresholdExceeded && hoveredRef.current) {
          placeTile(hoveredRef.current.x, hoveredRef.current.y);
        }
        isDragging = false;
        hoveredRef.current = null;
        requestAnimationFrame(renderCanvas);
      }
    };
    const handleMouseLeave = () => {
      isDragging = false;
      if (hoveredRef.current) {
        hoveredRef.current = null;
        requestAnimationFrame(renderCanvas);
      }
    };

    // リスナー登録
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    const preventContext = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', preventContext); // 右クリックメニュー防止

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('contextmenu', preventContext);
    };
  }, [renderCanvas]);

  const placeTile = async (x: number, y: number) => {
    const { tiles, currentUser, selectedTileType, stock, consumeStock, refundStock } = propsRef.current;
    
    const existingTile = tiles.find(t => t.x === x && t.y === y);
    
    // 撤去ツール（ブルドーザー）が選択されている場合
    if (selectedTileType === 'DELETE') {
      if (!existingTile) return; // 空き地の場合は何もしない
      
      const isMine = existingTile.placed_by === currentUser.id;
      const ageInSeconds = (Date.now() - new Date(existingTile.created_at).getTime()) / 1000;
      
      if (isMine) {
        // 確認ダイアログを出さずに即時削除
        const { data, error } = await supabase.from('map_tiles').delete().eq('id', existingTile.id).select();
        
        if (error || !data || data.length === 0) {
          alert('削除に失敗しました。（データベース側で削除がブロックされています）');
        } else {
          // 設置から5分（300秒）以内ならストックを返却
          if (ageInSeconds <= 300) {
            const def = TILE_DEFINITIONS[existingTile.tile_type as TileType];
            if (def) await refundStock(def.cost);
          }
        }
      } else {
        alert('他人のタイルは削除できません。');
      }
      return;
    }

    // 建設ツールが選択されている場合
    if (existingTile) {
      alert('すでにタイルが配置されています。撤去ツールを使って空き地にしてください。');
      return;
    }

    const def = TILE_DEFINITIONS[selectedTileType as TileType];
    if (stock < def.cost) {
      alert(`ストックが足りません！ (必要コスト: ${def.cost})`);
      return;
    }

    const success = await consumeStock(def.cost);
    if (!success) return;

    const { error } = await supabase.from('map_tiles').insert({
      x,
      y,
      tile_type: selectedTileType,
      placed_by: currentUser.id,
    });

    if (error) {
      console.error('Failed to place tile:', error);
      alert('タイルの設置に失敗しました。');
      await refundStock(def.cost);
    }
  };

  return (
    <div className="overflow-hidden border-4 border-gray-700 rounded-lg shadow-inner bg-gray-900 w-full h-[70vh] relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute top-2 left-2 text-xs text-white/50 bg-black/50 p-2 rounded pointer-events-none flex flex-col gap-1">
        <span>🖱 ドラッグ: マップ移動</span>
        <span>🔍 ホイール / ピンチ: ズーム</span>
        <span>🏗 クリック / タップ: 設置・削除</span>
      </div>
    </div>
  );
}
