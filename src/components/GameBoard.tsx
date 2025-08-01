'use client';

import { GameState, Cell, Player } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import Image from 'next/image';

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const getCellColor = (cell: Cell): string => {
    switch (cell.type) {
      case 'start':
        return 'bg-green-200 border-green-400';
      case 'goal':
        return 'bg-yellow-200 border-yellow-400';
      case 'skip':
        return 'bg-red-200 border-red-400';
      case 'advance':
        return 'bg-blue-200 border-blue-400';
      case 'back':
        return 'bg-orange-200 border-orange-400';
      case 'warp':
        return 'bg-purple-200 border-purple-400';
      default:
        return 'bg-gray-100 border-gray-300';
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

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-6 gap-2 md:gap-4">
        {gameState.board.map((cell, index) => {
          const playersOnCell = getPlayersOnCell(cell.id);
          
          return (
            <div
              key={cell.id}
              className={`
                relative aspect-square border-2 rounded-lg p-2
                ${getCellColor(cell)}
                transition-all duration-300 hover:scale-105
                min-h-[80px] md:min-h-[120px]
              `}
            >
              {/* セル番号 */}
              <div className="absolute top-1 left-1 text-xs font-bold text-gray-600">
                {cell.id}
              </div>

              {/* セルタイプのアイコン */}
              <div className="text-center text-lg md:text-2xl mb-1">
                {getCellIcon(cell)}
              </div>

              {/* ポケモン画像 */}
              {cell.pokemon && (
                <div className="flex justify-center mb-1">
                  <Image
                    src={PokeApiService.getPokemonImageUrl(cell.pokemon, 'sprite')}
                    alt={cell.pokemon.name}
                    width={40}
                    height={40}
                    className="pixelated"
                  />
                </div>
              )}

              {/* プレイヤー */}
              {playersOnCell.length > 0 && (
                <div className="absolute bottom-1 right-1 flex flex-wrap gap-1">
                  {playersOnCell.map((player) => (
                    <div
                      key={player.id}
                      className={`
                        w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-white
                        ${player.color}
                        animate-bounce
                      `}
                      title={player.name}
                    >
                      {player.avatar && (
                        <Image
                          src={PokeApiService.getPokemonImageUrl(player.avatar, 'sprite')}
                          alt={player.avatar.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 特殊マスの値表示 */}
              {(cell.type === 'skip' || cell.type === 'advance' || cell.type === 'back') && cell.value && (
                <div className="absolute top-1 right-1 text-xs font-bold bg-white rounded px-1">
                  {cell.value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}