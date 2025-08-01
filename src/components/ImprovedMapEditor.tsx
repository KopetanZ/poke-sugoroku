'use client';

import { useState, useRef } from 'react';
import { Cell, CellType } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import { GameEngine } from '@/services/gameEngine';
import Image from 'next/image';

interface ImprovedMapEditorProps {
  onSave: (board: Cell[]) => void;
  onCancel: () => void;
  initialBoard?: Cell[];
}

export function ImprovedMapEditor({ onSave, onCancel, initialBoard }: ImprovedMapEditorProps) {
  const [board, setBoard] = useState<Cell[]>(
    initialBoard || GameEngine.createDefaultBoard(30)
  );
  const [selectedTool, setSelectedTool] = useState<CellType>('normal');
  const [toolSettings, setToolSettings] = useState({
    value: 1,
    warpTo: 0,
    message: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ cellId: number; originalType: CellType } | null>(null);

  const cellTypeTools: { type: CellType; label: string; icon: string; color: string; description: string }[] = [
    { type: 'normal', label: '通常', icon: '⚪', color: 'bg-gray-100 hover:bg-gray-200', description: '普通のマス' },
    { type: 'skip', label: '休み', icon: '😴', color: 'bg-red-100 hover:bg-red-200', description: '指定ターン休み' },
    { type: 'advance', label: '進む', icon: '⚡', color: 'bg-blue-100 hover:bg-blue-200', description: '指定マス進む' },
    { type: 'back', label: '戻る', icon: '⬅️', color: 'bg-orange-100 hover:bg-orange-200', description: '指定マス戻る' },
    { type: 'warp', label: 'ワープ', icon: '🌀', color: 'bg-purple-100 hover:bg-purple-200', description: '指定マスへワープ' },
  ];

  const updateCell = (cellId: number, updates: Partial<Cell>) => {
    if (cellId === 0 || cellId === board.length - 1) return; // スタートとゴールは編集不可

    setBoard(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, ...updates }
        : cell
    ));
  };

  const handleCellMouseDown = (cellId: number) => {
    if (cellId === 0 || cellId === board.length - 1) return;
    
    const cell = board[cellId];
    dragStartRef.current = { cellId, originalType: cell.type };
    setIsDragging(true);
    
    applyCellEdit(cellId);
  };

  const handleCellMouseEnter = (cellId: number) => {
    if (isDragging && cellId !== 0 && cellId !== board.length - 1) {
      applyCellEdit(cellId);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const applyCellEdit = (cellId: number) => {
    const updates: Partial<Cell> = {
      type: selectedTool,
      message: toolSettings.message || undefined,
    };

    if (selectedTool === 'skip' || selectedTool === 'advance' || selectedTool === 'back') {
      updates.value = toolSettings.value;
      updates.warpTo = undefined;
    } else if (selectedTool === 'warp') {
      updates.warpTo = toolSettings.warpTo;
      updates.value = undefined;
    } else {
      updates.value = undefined;
      updates.warpTo = undefined;
    }

    updateCell(cellId, updates);
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

  const clearBoard = () => {
    setBoard(prev => prev.map(cell => ({
      ...cell,
      type: cell.id === 0 ? 'start' : cell.id === board.length - 1 ? 'goal' : 'normal',
      value: undefined,
      warpTo: undefined,
      message: cell.id === 0 ? 'スタート！がんばって！' : cell.id === board.length - 1 ? 'ゴール！おめでとう！🎉' : undefined,
      pokemon: undefined
    })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-purple-800">🎨 改良版マップエディター</h1>
            <div className="flex gap-4">
              <button
                onClick={clearBoard}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-semibold"
              >
                クリア
              </button>
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
          
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            💡 <strong>使い方:</strong> 左のツールを選択してマップをクリック、またはドラッグで連続編集できます。スタートとゴールは編集できません。
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* ツールパレット */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4 text-gray-800">🛠️ ツール</h3>
              
              {/* ツール選択 */}
              <div className="space-y-3 mb-6">
                {cellTypeTools.map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => setSelectedTool(tool.type)}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all transform hover:scale-105
                      ${selectedTool === tool.type 
                        ? 'border-purple-500 bg-purple-100 scale-105 shadow-lg' 
                        : 'border-gray-300 bg-white hover:border-purple-300'
                      }
                      ${tool.color}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{tool.icon}</div>
                      <div className="text-left">
                        <div className="font-semibold">{tool.label}</div>
                        <div className="text-xs text-gray-600">{tool.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* ツール設定 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">⚙️ 設定</h4>
                
                {(selectedTool === 'skip' || selectedTool === 'advance' || selectedTool === 'back') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {selectedTool === 'skip' ? '休み回数' : 
                       selectedTool === 'advance' ? '進むマス数' : '戻るマス数'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={toolSettings.value}
                      onChange={(e) => setToolSettings(prev => ({
                        ...prev,
                        value: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                {selectedTool === 'warp' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ワープ先のマス番号
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={board.length - 2}
                      value={toolSettings.warpTo}
                      onChange={(e) => setToolSettings(prev => ({
                        ...prev,
                        warpTo: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    メッセージ
                  </label>
                  <input
                    type="text"
                    value={toolSettings.message}
                    onChange={(e) => setToolSettings(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    placeholder="マスに止まった時のメッセージ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ゲーム盤面 */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div 
                className="grid grid-cols-6 gap-3"
                onMouseLeave={handleMouseUp}
              >
                {board.map((cell) => (
                  <div
                    key={cell.id}
                    onMouseDown={() => handleCellMouseDown(cell.id)}
                    onMouseEnter={() => handleCellMouseEnter(cell.id)}
                    onMouseUp={handleMouseUp}
                    className={`
                      relative aspect-square border-2 rounded-lg p-2 transition-all duration-200
                      ${getCellColor(cell)}
                      ${cell.id === 0 || cell.id === board.length - 1 
                        ? 'cursor-not-allowed opacity-75' 
                        : 'cursor-pointer hover:scale-105 hover:shadow-lg'
                      }
                      min-h-[100px] select-none
                    `}
                  >
                    {/* セル番号 */}
                    <div className="absolute top-1 left-1 text-xs font-bold text-gray-600 bg-white rounded px-1">
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
                      <div className="absolute top-1 right-1 text-xs font-bold bg-yellow-400 rounded px-1">
                        {cell.value}
                      </div>
                    )}

                    {/* ワープ先表示 */}
                    {cell.type === 'warp' && cell.warpTo !== undefined && (
                      <div className="absolute bottom-1 left-1 text-xs font-bold bg-purple-400 text-white rounded px-1">
                        →{cell.warpTo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}