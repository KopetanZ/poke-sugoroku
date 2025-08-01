'use client';

import { GameState, Cell, Player } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import Image from 'next/image';

interface FreeFormGameBoardProps {
  gameState: GameState;
}

export function FreeFormGameBoard({ gameState }: FreeFormGameBoardProps) {
  const getCellColor = (cell: Cell): string => {
    switch (cell.type) {
      case 'start':
        return 'bg-gradient-to-br from-green-400 to-green-600 border-green-700';
      case 'goal':
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-700';
      case 'skip':
        return 'bg-gradient-to-br from-red-400 to-red-600 border-red-700';
      case 'advance':
        return 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-700';
      case 'back':
        return 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-700';
      case 'warp':
        return 'bg-gradient-to-br from-purple-400 to-purple-600 border-purple-700';
      case 'floating_island':
        return 'bg-gradient-to-br from-cyan-400 to-cyan-600 border-cyan-700';
      case 'island_exit':
        return 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-700';
      default:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-600';
    }
  };

  const getCellIcon = (cell: Cell): string => {
    switch (cell.type) {
      case 'start': return '🏁';
      case 'goal': return '🏆';
      case 'skip': return '😴';
      case 'advance': return '⚡';
      case 'back': return '⬅️';
      case 'warp': return '🌀';
      case 'floating_island': return '🏝️';
      case 'island_exit': return '🚪';
      default: return '';
    }
  };

  const getPlayersOnCell = (cellId: number): Player[] => {
    return gameState.players.filter(player => player.position === cellId);
  };

  // ボードサイズを計算
  const boardWidth = Math.max(
    ...gameState.board
      .filter(cell => cell.position)
      .map(cell => cell.position!.x)
  ) + 150;
  
  const boardHeight = Math.max(
    ...gameState.board
      .filter(cell => cell.position)
      .map(cell => cell.position!.y)
  ) + 150;

  // 浮島エリアとメインエリアを分離
  const mainAreaCells = gameState.board.filter(cell => !cell.isFloatingIsland);
  const floatingIslandCells = gameState.board.filter(cell => cell.isFloatingIsland);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 overflow-auto">
      <div 
        className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-lg border-4 border-brown-300 p-4"
        style={{ 
          width: `${Math.max(boardWidth, 800)}px`, 
          height: `${Math.max(boardHeight, 600)}px`,
          minWidth: '800px',
          minHeight: '600px'
        }}
      >
        {/* 浮島エリアの背景 */}
        {floatingIslandCells.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {floatingIslandCells.map((cell) => {
              if (!cell.position) return null;
              return (
                <div
                  key={`island-bg-${cell.id}`}
                  className="absolute bg-cyan-100 opacity-30 rounded-full"
                  style={{
                    left: `${cell.position.x - 80}px`,
                    top: `${cell.position.y - 80}px`,
                    width: '160px',
                    height: '160px',
                  }}
                />
              );
            })}
            <div className="absolute top-8 right-8 text-cyan-600 font-bold text-lg opacity-70">
              🏝️ 浮島エリア
            </div>
          </div>
        )}

        {/* メインルートの接続線を描画 */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <linearGradient id="mainPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="islandPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* メインルートの線 */}
          {mainAreaCells
            .sort((a, b) => a.id - b.id)
            .slice(0, -1)
            .map((cell, index) => {
              const nextCell = mainAreaCells.find(c => c.id === cell.id + 1);
              if (!nextCell || !cell.position || !nextCell.position) return null;
              
              return (
                <line
                  key={`main-path-${cell.id}`}
                  x1={cell.position.x}
                  y1={cell.position.y}
                  x2={nextCell.position.x}
                  y2={nextCell.position.y}
                  stroke="url(#mainPathGradient)"
                  strokeWidth="6"
                  strokeDasharray="8,4"
                  className="animate-pulse"
                />
              );
            })}
          
          {/* 浮島エリア内の接続線 */}
          {floatingIslandCells
            .sort((a, b) => a.id - b.id)
            .slice(0, -1)
            .map((cell, index) => {
              const nextCell = floatingIslandCells.find(c => c.id === cell.id + 1);
              if (!nextCell || !cell.position || !nextCell.position) return null;
              
              return (
                <line
                  key={`island-path-${cell.id}`}
                  x1={cell.position.x}
                  y1={cell.position.y}
                  x2={nextCell.position.x}
                  y2={nextCell.position.y}
                  stroke="url(#islandPathGradient)"
                  strokeWidth="4"
                  strokeDasharray="5,3"
                />
              );
            })}

          {/* ワープ線 */}
          {gameState.board
            .filter(cell => cell.type === 'warp' && cell.warpTo !== undefined)
            .map(cell => {
              const targetCell = gameState.board.find(c => c.id === cell.warpTo);
              if (!cell.position || !targetCell?.position) return null;
              
              return (
                <line
                  key={`warp-${cell.id}`}
                  x1={cell.position.x}
                  y1={cell.position.y}
                  x2={targetCell.position.x}
                  y2={targetCell.position.y}
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  className="animate-ping"
                />
              );
            })}

          {/* 浮島脱出線 */}
          {gameState.board
            .filter(cell => cell.type === 'island_exit' && cell.returnTo !== undefined)
            .map(cell => {
              const targetCell = gameState.board.find(c => c.id === cell.returnTo);
              if (!cell.position || !targetCell?.position) return null;
              
              return (
                <line
                  key={`exit-${cell.id}`}
                  x1={cell.position.x}
                  y1={cell.position.y}
                  x2={targetCell.position.x}
                  y2={targetCell.position.y}
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                />
              );
            })}
        </svg>

        {/* マス */}
        {gameState.board.map((cell) => {
          if (!cell.position) return null;
          
          const playersOnCell = getPlayersOnCell(cell.id);
          
          return (
            <div
              key={cell.id}
              className={`
                absolute border-3 rounded-2xl p-2 shadow-lg
                ${getCellColor(cell)}
                transition-all duration-300 hover:scale-110 hover:shadow-xl
                w-16 h-16 flex flex-col items-center justify-center
                ${cell.isFloatingIsland ? 'ring-2 ring-cyan-400' : ''}
              `}
              style={{
                left: `${cell.position.x - 32}px`,
                top: `${cell.position.y - 32}px`,
                zIndex: 10
              }}
            >
              {/* セル番号 */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-gray-400 flex items-center justify-center text-xs font-bold text-gray-700 shadow-md">
                {cell.id}
              </div>

              {/* セルタイプのアイコン */}
              <div className="text-xl leading-none drop-shadow-lg">
                {getCellIcon(cell)}
              </div>

              {/* ポケモン画像 */}
              {cell.pokemon && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="relative w-8 h-8 bg-white rounded-full p-1 shadow-md">
                    <Image
                      src={PokeApiService.getPokemonImageUrl(cell.pokemon, 'sprite')}
                      alt={cell.pokemon.name}
                      width={24}
                      height={24}
                      className="pixelated rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-pokemon.svg';
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
                          src={PokeApiService.getPokemonImageUrl(player.avatar, 'sprite')}
                          alt={player.avatar.name}
                          width={20}
                          height={20}
                          className="rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-pokemon.svg';
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
                <div className="absolute bottom-0 left-0 bg-purple-600 rounded-lg px-1 py-0.5 text-[8px] font-bold text-white shadow-md">
                  →{cell.warpTo}
                </div>
              )}

              {/* 脱出先表示 */}
              {cell.type === 'island_exit' && cell.returnTo !== undefined && (
                <div className="absolute bottom-0 left-0 bg-green-600 rounded-lg px-1 py-0.5 text-[8px] font-bold text-white shadow-md">
                  ←{cell.returnTo}
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
        
        {/* 浮島装飾 */}
        {floatingIslandCells.length > 0 && (
          <>
            <div className="absolute top-1/4 right-1/4 text-3xl opacity-30 pointer-events-none">☁️</div>
            <div className="absolute top-1/3 right-1/6 text-2xl opacity-30 pointer-events-none">🐚</div>
            <div className="absolute bottom-1/3 right-1/5 text-3xl opacity-30 pointer-events-none">🌊</div>
          </>
        )}
      </div>
    </div>
  );
}