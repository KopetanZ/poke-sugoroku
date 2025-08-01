'use client';

import { GameState, Cell, Player } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import Image from 'next/image';

interface CurvedGameBoardProps {
  gameState: GameState;
}

export function CurvedGameBoard({ gameState }: CurvedGameBoardProps) {
  // サーペンタイン（蛇行）パターンでマスの位置を計算
  const calculateCellPosition = (cellId: number, totalCells: number) => {
    const boardWidth = 8; // 横8マス
    const cellSize = 80; // マスのサイズ（px）
    const padding = 20; // パディング
    
    const row = Math.floor(cellId / boardWidth);
    const col = row % 2 === 0 ? cellId % boardWidth : boardWidth - 1 - (cellId % boardWidth);
    
    // 曲線効果のためのオフセット
    const curveOffset = Math.sin((cellId / totalCells) * Math.PI * 2) * 10;
    
    return {
      x: col * (cellSize + padding) + padding + curveOffset,
      y: row * (cellSize + padding) + padding,
      rotation: (cellId * 5) % 360 // 微細な回転で動きを演出
    };
  };

  const getCellColor = (cell: Cell): string => {
    switch (cell.type) {
      case 'start':
        return 'bg-gradient-to-br from-green-300 to-green-500 border-green-600';
      case 'goal':
        return 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-600';
      case 'skip':
        return 'bg-gradient-to-br from-red-300 to-red-500 border-red-600';
      case 'advance':
        return 'bg-gradient-to-br from-blue-300 to-blue-500 border-blue-600';
      case 'back':
        return 'bg-gradient-to-br from-orange-300 to-orange-500 border-orange-600';
      case 'warp':
        return 'bg-gradient-to-br from-purple-300 to-purple-500 border-purple-600';
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-300 border-gray-400';
    }
  };

  const getCellIcon = (cell: Cell): string => {
    switch (cell.type) {
      case 'start':
        return '🏁';
      case 'goal':
        return '🏆';
      case 'skip':
        return '😴';
      case 'advance':
        return '⚡';
      case 'back':
        return '⬅️';
      case 'warp':
        return '🌀';
      default:
        return '';
    }
  };

  const getPlayersOnCell = (cellId: number): Player[] => {
    return gameState.players.filter(player => player.position === cellId);
  };

  // パスの描画用SVG要素を生成
  const generatePath = () => {
    const pathPoints: string[] = [];
    const totalCells = gameState.board.length;
    
    gameState.board.forEach((_, index) => {
      const pos = calculateCellPosition(index, totalCells);
      const command = index === 0 ? 'M' : 'L';
      pathPoints.push(`${command} ${pos.x + 40} ${pos.y + 40}`); // 中心座標
    });
    
    return pathPoints.join(' ');
  };

  const boardWidth = Math.max(...gameState.board.map((_, index) => 
    calculateCellPosition(index, gameState.board.length).x
  )) + 120;
  
  const boardHeight = Math.max(...gameState.board.map((_, index) => 
    calculateCellPosition(index, gameState.board.length).y
  )) + 120;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 overflow-auto">
      <div 
        className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-lg border-4 border-brown-300 p-4"
        style={{ 
          width: `${boardWidth}px`, 
          height: `${boardHeight}px`,
          minWidth: '800px',
          minHeight: '600px'
        }}
      >
        {/* パスのSVG */}
        <svg 
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d={generatePath()}
            stroke="url(#pathGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10,5"
            className="animate-pulse"
          />
        </svg>

        {/* マス */}
        {gameState.board.map((cell, index) => {
          const position = calculateCellPosition(cell.id, gameState.board.length);
          const playersOnCell = getPlayersOnCell(cell.id);
          
          return (
            <div
              key={cell.id}
              className={`
                absolute border-3 rounded-2xl p-2 shadow-lg
                ${getCellColor(cell)}
                transition-all duration-300 hover:scale-110 hover:shadow-xl
                min-w-[80px] min-h-[80px] flex flex-col items-center justify-center
              `}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `rotate(${position.rotation * 0.1}deg)`,
                zIndex: 10
              }}
            >
              {/* セル番号 */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-gray-400 flex items-center justify-center text-xs font-bold text-gray-700 shadow-md">
                {cell.id}
              </div>

              {/* セルタイプのアイコン */}
              <div className="text-2xl mb-1 drop-shadow-lg">
                {getCellIcon(cell)}
              </div>

              {/* ポケモン画像 */}
              {cell.pokemon && (
                <div className="flex justify-center mb-1">
                  <div className="relative w-10 h-10 bg-white rounded-full p-1 shadow-md">
                    <Image
                      src={cell.pokemon.sprites?.front_default || '/placeholder-pokemon.png'}
                      alt={cell.pokemon.name}
                      width={32}
                      height={32}
                      className="pixelated rounded-full"
                      onError={(e) => {
                        // フォールバック画像
                        (e.target as HTMLImageElement).src = '/placeholder-pokemon.png';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* プレイヤー */}
              {playersOnCell.length > 0 && (
                <div className="absolute -bottom-2 -right-2 flex flex-wrap gap-1">
                  {playersOnCell.map((player, playerIndex) => (
                    <div
                      key={player.id}
                      className={`
                        w-6 h-6 rounded-full border-2 border-white shadow-lg
                        ${player.color}
                        animate-bounce
                        transform hover:scale-125
                      `}
                      style={{
                        animationDelay: `${playerIndex * 0.2}s`,
                        zIndex: 20
                      }}
                      title={player.name}
                    >
                      {player.avatar && (
                        <Image
                          src={player.avatar.sprites?.front_default || '/placeholder-pokemon.png'}
                          alt={player.avatar.name}
                          width={20}
                          height={20}
                          className="rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-pokemon.png';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 特殊マスの値表示 */}
              {(cell.type === 'skip' || cell.type === 'advance' || cell.type === 'back') && cell.value && (
                <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center text-xs font-bold text-yellow-900 shadow-md">
                  {cell.value}
                </div>
              )}

              {/* ワープ先表示 */}
              {cell.type === 'warp' && cell.warpTo !== undefined && (
                <div className="absolute bottom-0 left-0 bg-purple-400 rounded-lg px-2 py-1 text-xs font-bold text-white shadow-md">
                  →{cell.warpTo}
                </div>
              )}
            </div>
          );
        })}

        {/* 装飾要素 */}
        <div className="absolute top-4 left-4 text-6xl opacity-20 pointer-events-none">🌸</div>
        <div className="absolute top-4 right-4 text-4xl opacity-20 pointer-events-none">🍃</div>
        <div className="absolute bottom-4 left-4 text-5xl opacity-20 pointer-events-none">🌺</div>
        <div className="absolute bottom-4 right-4 text-4xl opacity-20 pointer-events-none">🦋</div>
      </div>
    </div>
  );
}