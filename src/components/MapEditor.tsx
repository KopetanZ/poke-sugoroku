'use client';

import { useState } from 'react';
import { Cell, CellType } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import { GameEngine } from '@/services/gameEngine';
import Image from 'next/image';

interface MapEditorProps {
  onSave: (board: Cell[]) => void;
  onCancel: () => void;
  initialBoard?: Cell[];
}

export function MapEditor({ onSave, onCancel, initialBoard }: MapEditorProps) {
  const [board, setBoard] = useState<Cell[]>(
    initialBoard || GameEngine.createDefaultBoard(30)
  );
  const [selectedCellType, setSelectedCellType] = useState<CellType>('normal');
  const [selectedValue, setSelectedValue] = useState<number>(1);
  const [selectedWarpTarget, setSelectedWarpTarget] = useState<number>(0);
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const [editingCell, setEditingCell] = useState<number | null>(null);

  const cellTypeOptions: { type: CellType; label: string; icon: string; color: string }[] = [
    { type: 'normal', label: '通常', icon: '⚪', color: 'bg-gray-100' },
    { type: 'skip', label: '休み', icon: '😴', color: 'bg-red-200' },
    { type: 'advance', label: '進む', icon: '⚡', color: 'bg-blue-200' },
    { type: 'back', label: '戻る', icon: '⬅️', color: 'bg-orange-200' },
    { type: 'warp', label: 'ワープ', icon: '🌀', color: 'bg-purple-200' },
  ];

  const updateCell = (cellId: number, updates: Partial<Cell>) => {
    setBoard(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, ...updates }
        : cell
    ));
  };

  const handleCellClick = (cellId: number) => {
    if (cellId === 0 || cellId === board.length - 1) return; // スタートとゴールは編集不可

    setEditingCell(cellId);
    const cell = board[cellId];
    setSelectedCellType(cell.type);
    setSelectedValue(cell.value || 1);
    setSelectedWarpTarget(cell.warpTo || 0);
    setSelectedMessage(cell.message || '');
  };

  const applyEdit = () => {
    if (editingCell === null) return;

    let updates: Partial<Cell> = {
      type: selectedCellType,
      message: selectedMessage || undefined,
    };

    if (selectedCellType === 'skip' || selectedCellType === 'advance' || selectedCellType === 'back') {
      updates.value = selectedValue;
      updates.warpTo = undefined;
    } else if (selectedCellType === 'warp') {
      updates.warpTo = selectedWarpTarget;
      updates.value = undefined;
    } else {
      updates.value = undefined;
      updates.warpTo = undefined;
    }

    updateCell(editingCell, updates);
    setEditingCell(null);
  };

  const getCellColor = (cell: Cell): string => {
    switch (cell.type) {
      case 'start': return 'bg-green-200 border-green-400';
      case 'goal': return 'bg-yellow-200 border-yellow-400';
      case 'skip': return 'bg-red-200 border-red-400';
      case 'advance': return 'bg-blue-200 border-blue-400';
      case 'back': return 'bg-orange-200 border-orange-400';
      case 'warp': return 'bg-purple-200 border-purple-400';
      default: return 'bg-gray-100 border-gray-300';
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
      default: return '';
    }
  };

  const addRandomPokemon = async () => {
    const pokemon = await PokeApiService.getMultiplePokemon(Math.floor(board.length / 3));
    
    setBoard(prev => prev.map((cell, index) => {
      if (index % 3 === 0 && pokemon.length > Math.floor(index / 3)) {
        return {
          ...cell,
          pokemon: pokemon[Math.floor(index / 3)]
        };
      } else if (index % 3 !== 0) {
        return {
          ...cell,
          pokemon: undefined
        };
      }
      return cell;
    }));
  };

  const resetBoard = () => {
    setBoard(GameEngine.createDefaultBoard(board.length));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-purple-800">🎨 マップエディター</h1>
            <div className="flex gap-4">
              <button
                onClick={resetBoard}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
              >
                リセット
              </button>
              <button
                onClick={addRandomPokemon}
                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
              >
                ポケモン配置
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={() => onSave(board)}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
              >
                保存
              </button>
            </div>
          </div>

          {/* セルタイプ選択 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {cellTypeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedCellType(option.type)}
                className={`
                  p-4 rounded-xl border-2 transition-all transform hover:scale-105
                  ${selectedCellType === option.type 
                    ? 'border-purple-500 bg-purple-100 scale-105' 
                    : 'border-gray-300 bg-white'
                  }
                `}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-semibold">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ゲーム盤面 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-6 gap-3">
            {board.map((cell) => (
              <div
                key={cell.id}
                onClick={() => handleCellClick(cell.id)}
                className={`
                  relative aspect-square border-2 rounded-lg p-2 cursor-pointer
                  ${getCellColor(cell)}
                  ${editingCell === cell.id ? 'ring-4 ring-yellow-400' : ''}
                  ${cell.id === 0 || cell.id === board.length - 1 ? 'cursor-not-allowed opacity-75' : 'hover:scale-105'}
                  transition-all duration-200
                  min-h-[100px]
                `}
              >
                {/* セル番号 */}
                <div className="absolute top-1 left-1 text-xs font-bold text-gray-600">
                  {cell.id}
                </div>

                {/* セルタイプのアイコン */}
                <div className="text-center text-xl md:text-2xl mb-1">
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

                {/* 特殊マスの値表示 */}
                {(cell.type === 'skip' || cell.type === 'advance' || cell.type === 'back') && cell.value && (
                  <div className="absolute top-1 right-1 text-xs font-bold bg-white rounded px-1">
                    {cell.value}
                  </div>
                )}

                {/* ワープ先表示 */}
                {cell.type === 'warp' && cell.warpTo !== undefined && (
                  <div className="absolute bottom-1 left-1 text-xs font-bold bg-white rounded px-1">
                    →{cell.warpTo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 編集パネル */}
        {editingCell !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              マス {editingCell} を編集中
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-700">
                  マスの種類
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {cellTypeOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setSelectedCellType(option.type)}
                      className={`
                        p-3 rounded-xl border-2 transition-all
                        ${selectedCellType === option.type 
                          ? 'border-purple-500 bg-purple-100' 
                          : 'border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="text-xl mb-1">{option.icon}</div>
                      <div className="text-sm font-semibold">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {(selectedCellType === 'skip' || selectedCellType === 'advance' || selectedCellType === 'back') && (
                  <div>
                    <label className="block text-lg font-semibold mb-2 text-gray-700">
                      {selectedCellType === 'skip' ? '休み回数' : 
                       selectedCellType === 'advance' ? '進むマス数' : '戻るマス数'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                {selectedCellType === 'warp' && (
                  <div>
                    <label className="block text-lg font-semibold mb-2 text-gray-700">
                      ワープ先のマス番号
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={board.length - 2}
                      value={selectedWarpTarget}
                      onChange={(e) => setSelectedWarpTarget(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-lg font-semibold mb-2 text-gray-700">
                    メッセージ
                  </label>
                  <input
                    type="text"
                    value={selectedMessage}
                    onChange={(e) => setSelectedMessage(e.target.value)}
                    placeholder="マスに止まった時のメッセージ"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={applyEdit}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold text-lg"
                  >
                    適用
                  </button>
                  <button
                    onClick={() => setEditingCell(null)}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold text-lg"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}