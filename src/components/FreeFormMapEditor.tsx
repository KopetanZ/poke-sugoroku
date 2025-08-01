'use client';

import { useState, useRef, useCallback } from 'react';
import { Cell, CellType, Position } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import Image from 'next/image';

interface FreeFormMapEditorProps {
  onSave: (board: Cell[]) => void;
  onCancel: () => void;
  initialBoard?: Cell[];
}

export function FreeFormMapEditor({ onSave, onCancel, initialBoard }: FreeFormMapEditorProps) {
  const [cells, setCells] = useState<Cell[]>(() => {
    if (initialBoard && initialBoard.length > 0) {
      return initialBoard.map(cell => ({
        ...cell,
        position: cell.position || { x: 100 + cell.id * 120, y: 300 }
      }));
    }
    // デフォルトボード: スタート、ゴール、いくつかの通常マス
    return [
      { id: 0, type: 'start', position: { x: 100, y: 300 }, message: 'スタート！' },
      { id: 1, type: 'normal', position: { x: 250, y: 300 } },
      { id: 2, type: 'normal', position: { x: 400, y: 300 } },
      { id: 3, type: 'goal', position: { x: 550, y: 300 }, message: 'ゴール！' }
    ];
  });

  const [selectedTool, setSelectedTool] = useState<CellType>('normal');
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [draggedCell, setDraggedCell] = useState<Cell | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [nextCellId, setNextCellId] = useState(() => Math.max(...cells.map(c => c.id)) + 1);
  const [isFloatingIslandMode, setIsFloatingIslandMode] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const cellTypeTools: { 
    type: CellType; 
    label: string; 
    icon: string; 
    color: string; 
    description: string;
    canFloat?: boolean;
  }[] = [
    { type: 'normal', label: '通常', icon: '⚪', color: 'bg-gray-100 hover:bg-gray-200', description: '普通のマス' },
    { type: 'skip', label: '休み', icon: '😴', color: 'bg-red-100 hover:bg-red-200', description: '指定ターン休み' },
    { type: 'advance', label: '進む', icon: '⚡', color: 'bg-blue-100 hover:bg-blue-200', description: '指定マス進む' },
    { type: 'back', label: '戻る', icon: '⬅️', color: 'bg-orange-100 hover:bg-orange-200', description: '指定マス戻る' },
    { type: 'warp', label: 'ワープ', icon: '🌀', color: 'bg-purple-100 hover:bg-purple-200', description: '指定マスへワープ' },
    { type: 'floating_island', label: '浮島', icon: '🏝️', color: 'bg-cyan-100 hover:bg-cyan-200', description: '浮島エリア', canFloat: true },
    { type: 'island_exit', label: '脱出', icon: '🚪', color: 'bg-green-100 hover:bg-green-200', description: '浮島脱出', canFloat: true },
  ];

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

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (draggedCell) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 新しいマスを追加
    const newCell: Cell = {
      id: nextCellId,
      type: selectedTool,
      position: { x, y },
      isFloatingIsland: isFloatingIslandMode
    };
    
    setCells(prev => [...prev, newCell]);
    setNextCellId(prev => prev + 1);
  }, [selectedTool, nextCellId, draggedCell, isFloatingIslandMode]);

  const handleCellMouseDown = useCallback((e: React.MouseEvent, cell: Cell) => {
    e.stopPropagation();
    
    if (!cell.position) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDraggedCell(cell);
    setDragOffset({
      x: x - cell.position.x,
      y: y - cell.position.y
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedCell || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    setCells(prev => prev.map(cell => 
      cell.id === draggedCell.id 
        ? { ...cell, position: { x: Math.max(0, x), y: Math.max(0, y) } }
        : cell
    ));
  }, [draggedCell, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedCell(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleCellClick = (cell: Cell) => {
    if (cell.type === 'start' || cell.type === 'goal') return;
    setSelectedCell(cell);
  };

  const updateSelectedCell = (updates: Partial<Cell>) => {
    if (!selectedCell) return;
    
    setCells(prev => prev.map(cell => 
      cell.id === selectedCell.id 
        ? { ...cell, ...updates }
        : cell
    ));
    setSelectedCell(prev => prev ? { ...prev, ...updates } : null);
  };

  const deleteCell = (cellId: number) => {
    if (cells.find(c => c.id === cellId)?.type === 'start' || 
        cells.find(c => c.id === cellId)?.type === 'goal') return;
    
    setCells(prev => prev.filter(cell => cell.id !== cellId));
    if (selectedCell?.id === cellId) {
      setSelectedCell(null);
    }
  };

  const handleSave = () => {
    // スタートとゴールの存在確認
    const hasStart = cells.some(cell => cell.type === 'start');
    const hasGoal = cells.some(cell => cell.type === 'goal');
    
    if (!hasStart || !hasGoal) {
      alert('スタートとゴールの両方が必要です！');
      return;
    }
    
    onSave(cells);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <h1 className="text-3xl font-bold text-center">🎨 自由配置マップエディター</h1>
          <p className="text-center mt-2 opacity-90">マスをクリックして配置、ドラッグして移動！</p>
        </div>

        <div className="flex h-[calc(100vh-200px)]">
          {/* ツールパレット */}
          <div className="w-80 bg-gray-50 p-4 overflow-y-auto border-r">
            <div className="space-y-4">
              {/* モード切替 */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-bold mb-3 text-gray-800">配置モード</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isFloatingIslandMode}
                    onChange={(e) => setIsFloatingIslandMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">浮島エリアモード 🏝️</span>
                </label>
              </div>

              {/* ツール選択 */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-bold mb-3 text-gray-800">マスの種類</h3>
                <div className="grid grid-cols-1 gap-2">
                  {cellTypeTools.map((tool) => (
                    <button
                      key={tool.type}
                      onClick={() => setSelectedTool(tool.type)}
                      className={`
                        p-3 rounded-lg border-2 transition-all text-left
                        ${selectedTool === tool.type 
                          ? 'border-purple-500 bg-purple-100' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                        ${tool.color}
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{tool.icon}</span>
                        <div>
                          <div className="font-semibold">{tool.label}</div>
                          <div className="text-xs text-gray-600">{tool.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 選択中のマス設定 */}
              {selectedCell && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-bold mb-3 text-gray-800">マス設定</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        マス番号: {selectedCell.id}
                      </label>
                    </div>
                    
                    {(selectedCell.type === 'skip' || selectedCell.type === 'advance' || selectedCell.type === 'back') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          値
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={selectedCell.value || 1}
                          onChange={(e) => updateSelectedCell({ value: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                    
                    {selectedCell.type === 'warp' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ワープ先
                        </label>
                        <select
                          value={selectedCell.warpTo || ''}
                          onChange={(e) => updateSelectedCell({ warpTo: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">選択してください</option>
                          {cells.filter(c => c.id !== selectedCell.id).map(cell => (
                            <option key={cell.id} value={cell.id}>
                              マス{cell.id} ({getCellIcon(cell)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedCell.type === 'island_exit' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          戻り先（メインルート）
                        </label>
                        <select
                          value={selectedCell.returnTo || ''}
                          onChange={(e) => updateSelectedCell({ returnTo: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">選択してください</option>
                          {cells.filter(c => c.id !== selectedCell.id && !c.isFloatingIsland).map(cell => (
                            <option key={cell.id} value={cell.id}>
                              マス{cell.id} ({getCellIcon(cell)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メッセージ
                      </label>
                      <input
                        type="text"
                        value={selectedCell.message || ''}
                        onChange={(e) => updateSelectedCell({ message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="子供向けメッセージ"
                      />
                    </div>
                    
                    <button
                      onClick={() => deleteCell(selectedCell.id)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      disabled={selectedCell.type === 'start' || selectedCell.type === 'goal'}
                    >
                      このマスを削除
                    </button>
                  </div>
                </div>
              )}

              {/* アクション */}
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold"
                >
                  💾 マップを保存
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>

          {/* キャンバス */}
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={canvasRef}
              className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 relative cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* グリッド背景 */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #cbd5e0 1px, transparent 1px),
                    linear-gradient(to bottom, #cbd5e0 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px'
                }}
              />

              {/* 浮島エリアの背景 */}
              {isFloatingIslandMode && (
                <div className="absolute inset-0 bg-cyan-100 opacity-30 pointer-events-none">
                  <div className="absolute top-4 left-4 text-cyan-600 font-bold text-lg">
                    🏝️ 浮島エリアモード
                  </div>
                </div>
              )}

              {/* マス */}
              {cells.map((cell) => {
                if (!cell.position) return null;
                
                return (
                  <div
                    key={cell.id}
                    className={`
                      absolute w-16 h-16 border-3 rounded-xl shadow-lg cursor-pointer
                      flex flex-col items-center justify-center text-white font-bold text-xs
                      transition-all duration-200 hover:scale-110 hover:shadow-xl
                      ${getCellColor(cell)}
                      ${selectedCell?.id === cell.id ? 'ring-4 ring-yellow-400' : ''}
                      ${cell.isFloatingIsland ? 'ring-2 ring-cyan-400' : ''}
                    `}
                    style={{
                      left: `${cell.position.x - 32}px`,
                      top: `${cell.position.y - 32}px`,
                      zIndex: draggedCell?.id === cell.id ? 1000 : 1
                    }}
                    onMouseDown={(e) => handleCellMouseDown(e, cell)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(cell);
                    }}
                  >
                    <div className="text-lg leading-none">{getCellIcon(cell)}</div>
                    <div className="text-[8px] leading-none mt-1">{cell.id}</div>
                    
                    {/* 特殊設定の表示 */}
                    {cell.value && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[8px] text-black flex items-center justify-center">
                        {cell.value}
                      </div>
                    )}
                    
                    {cell.warpTo !== undefined && (
                      <div className="absolute -bottom-1 -left-1 bg-purple-600 rounded px-1 text-[8px]">
                        →{cell.warpTo}
                      </div>
                    )}

                    {cell.returnTo !== undefined && (
                      <div className="absolute -bottom-1 -left-1 bg-green-600 rounded px-1 text-[8px]">
                        ←{cell.returnTo}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 接続線の描画 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {cells
                  .filter(cell => !cell.isFloatingIsland)
                  .sort((a, b) => a.id - b.id)
                  .slice(0, -1)
                  .map((cell, index) => {
                    const nextCell = cells.find(c => c.id === cell.id + 1 && !c.isFloatingIsland);
                    if (!nextCell || !cell.position || !nextCell.position) return null;
                    
                    return (
                      <line
                        key={`${cell.id}-${nextCell.id}`}
                        x1={cell.position.x}
                        y1={cell.position.y}
                        x2={nextCell.position.x}
                        y2={nextCell.position.y}
                        stroke="#fbbf24"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                      />
                    );
                  })}
              </svg>

              {/* 操作説明 */}
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm">
                <div className="font-bold mb-1">操作方法:</div>
                <div>• クリック: マス配置</div>
                <div>• ドラッグ: マス移動</div>
                <div>• マスクリック: 設定変更</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}