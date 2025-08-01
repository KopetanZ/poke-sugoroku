'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Cell, CellType, Position } from '@/types/game';
import { PokeApiService } from '@/services/pokeapi';
import { Pokemon } from '@/types/pokemon';
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
    // きほんのすごろくばん: スタート、ゴール、ふつうのマス
    return [
      { id: 0, type: 'start', position: { x: 100, y: 300 }, message: 'スタート！がんばろう！' },
      { id: 1, type: 'normal', position: { x: 250, y: 300 }, message: 'いいかんじだね！' },
      { id: 2, type: 'normal', position: { x: 400, y: 300 }, message: 'もうすこしだよ！' },
      { id: 3, type: 'goal', position: { x: 550, y: 300 }, message: 'ゴール！やったね！' }
    ];
  });

  const [selectedTool, setSelectedTool] = useState<CellType>('normal');
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [draggedCell, setDraggedCell] = useState<Cell | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [nextCellId, setNextCellId] = useState(() => Math.max(...cells.map(c => c.id)) + 1);
  const [isFloatingIslandMode, setIsFloatingIslandMode] = useState(false);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [showPokemonSelector, setShowPokemonSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const cellTypeTools: { 
    type: CellType; 
    label: string; 
    icon: string; 
    color: string; 
    description: string;
    canFloat?: boolean;
  }[] = [
    { type: 'normal', label: 'ふつうのマス', icon: '⚪', color: 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300', description: 'なにもおこらない あんぜんなマスだよ' },
    { type: 'skip', label: 'おやすみマス', icon: '😴', color: 'bg-red-100 hover:bg-red-200 border-2 border-red-300', description: 'とまったら おやすみするよ' },
    { type: 'advance', label: 'すすむマス', icon: '⚡', color: 'bg-blue-100 hover:bg-blue-200 border-2 border-blue-300', description: 'まえに すすめるよ' },
    { type: 'back', label: 'もどるマス', icon: '⬅️', color: 'bg-orange-100 hover:bg-orange-200 border-2 border-orange-300', description: 'うしろに もどっちゃうよ' },
    { type: 'warp', label: 'ワープマス', icon: '🌀', color: 'bg-purple-100 hover:bg-purple-200 border-2 border-purple-300', description: 'べつのマスに とんじゃうよ' },
    { type: 'floating_island', label: 'うきしま', icon: '🏝️', color: 'bg-cyan-100 hover:bg-cyan-200 border-2 border-cyan-300', description: 'うきしまエリアに いくよ', canFloat: true },
    { type: 'island_exit', label: 'しまのそと', icon: '🚪', color: 'bg-green-100 hover:bg-green-200 border-2 border-green-300', description: 'うきしまから でるよ', canFloat: true },
  ];

  const getCellColor = (cell: Cell): string => {
    switch (cell.type) {
      case 'start':
        return 'bg-gradient-to-br from-green-300 via-green-400 to-green-500 border-green-600 shadow-green-300';
      case 'goal':
        return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 border-yellow-600 shadow-yellow-300';
      case 'skip':
        return 'bg-gradient-to-br from-red-300 via-red-400 to-red-500 border-red-600 shadow-red-300';
      case 'advance':
        return 'bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500 border-blue-600 shadow-blue-300';
      case 'back':
        return 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 border-orange-600 shadow-orange-300';
      case 'warp':
        return 'bg-gradient-to-br from-purple-300 via-purple-400 to-purple-500 border-purple-600 shadow-purple-300';
      case 'floating_island':
        return 'bg-gradient-to-br from-cyan-300 via-cyan-400 to-teal-500 border-cyan-600 shadow-cyan-300';
      case 'island_exit':
        return 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 border-emerald-600 shadow-emerald-300';
      default:
        return 'bg-gradient-to-br from-pink-300 via-pink-400 to-pink-500 border-pink-600 shadow-pink-300';
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

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleCellMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, cell: Cell) => {
    e.stopPropagation();
    e.preventDefault(); // スクロール防止
    
    if (!cell.position) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const eventPos = getEventPosition(e);
    const x = eventPos.x - rect.left;
    const y = eventPos.y - rect.top;
    
    setDraggedCell(cell);
    setDragOffset({
      x: x - cell.position.x,
      y: y - cell.position.y
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedCell || !canvasRef.current) return;
    
    e.preventDefault(); // スクロール防止
    
    const rect = canvasRef.current.getBoundingClientRect();
    const eventPos = getEventPosition(e);
    const x = eventPos.x - rect.left - dragOffset.x;
    const y = eventPos.y - rect.top - dragOffset.y;
    
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

  // モバイル検出とポケモンデータを読み込み
  useEffect(() => {
    // モバイル検出
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const loadPokemon = async () => {
      try {
        const pokemon = await PokeApiService.getMultiplePokemon(30);
        setAvailablePokemon(pokemon);
      } catch (error) {
        console.error('Failed to load Pokemon:', error);
      }
    };
    
    loadPokemon();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const assignPokemonToCell = (cellId: number, pokemon: Pokemon) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, pokemon }
        : cell
    ));
    if (selectedCell?.id === cellId) {
      setSelectedCell(prev => prev ? { ...prev, pokemon } : null);
    }
  };

  const removePokemonFromCell = (cellId: number) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, pokemon: undefined }
        : cell
    ));
    if (selectedCell?.id === cellId) {
      setSelectedCell(prev => prev ? { ...prev, pokemon: undefined } : null);
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
    <>
      {/* ポケモンセレクターモーダル */}
      {showPokemonSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-8 max-w-4xl max-h-[80vh] overflow-y-auto border-4 border-yellow-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-orange-800">🎮 すきなポケモンをえらぼう！</h3>
              <button
                onClick={() => setShowPokemonSelector(false)}
                className="text-red-500 hover:text-red-700 text-3xl font-bold bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              >
                ×
              </button>
            </div>
            
            {availablePokemon.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                {availablePokemon.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    className="flex flex-col items-center p-4 bg-white border-3 border-blue-200 rounded-2xl cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    onClick={() => {
                      if (selectedCell) {
                        assignPokemonToCell(selectedCell.id, pokemon);
                      }
                      setShowPokemonSelector(false);
                    }}
                  >
                    <Image
                      src={PokeApiService.getPokemonImageUrl(pokemon, 'sprite')}
                      alt={pokemon.name}
                      width={64}
                      height={64}
                      className="mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-pokemon.svg';
                      }}
                    />
                    <div className="text-sm text-center font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded-full">
                      {pokemon.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-orange-600 text-xl font-bold">
                <div className="animate-spin text-4xl mb-4">🌟</div>
                ポケモンたちが やってくるよ...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500">
        {/* モバイル用ヘッダー */}
        {isMobile && (
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 sticky top-0 z-30 shadow-lg">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">🎨 すごろくをつくろう！</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowToolPanel(!showToolPanel)}
                  className="px-4 py-2 bg-white bg-opacity-20 rounded-xl font-bold text-lg shadow-lg"
                >
                  {showToolPanel ? '✕' : '🛠️ どうぐ'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-400 rounded-xl font-bold text-lg shadow-lg hover:bg-green-300"
                >
                  💾 ほぞん
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-red-400 rounded-xl font-bold text-lg shadow-lg hover:bg-red-300"
                >
                  ✕ やめる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* デスクトップ用ヘッダー */}
        {!isMobile && (
          <div className="max-w-7xl mx-auto bg-white rounded-t-3xl shadow-2xl p-6">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-3xl shadow-lg">
              <h1 className="text-5xl font-bold text-center mb-2">🎨 すごろくをつくろう！</h1>
              <p className="text-center text-xl opacity-90">マスをタッチして おいたり うごかしたり しよう！</p>
            </div>
          </div>
        )}

        <div className={`${isMobile ? 'relative' : 'max-w-7xl mx-auto bg-white rounded-b-3xl shadow-xl flex'} ${isMobile ? '' : 'h-[calc(100vh-200px)]'}`}>
          {/* モバイル用ツールパネル */}
          {isMobile && showToolPanel && (
            <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-yellow-100 to-orange-100 border-t-4 border-yellow-300 p-6 z-40 max-h-[60vh] overflow-y-auto shadow-2xl">
              <div className="space-y-6">
                {/* モード切替 */}
                <div className="bg-white rounded-2xl p-4 border-3 border-cyan-300 shadow-lg">
                  <h3 className="font-bold mb-3 text-cyan-800 text-lg">🏝️ とくべつモード</h3>
                  <label className="flex items-center space-x-3 bg-cyan-50 p-3 rounded-xl">
                    <input
                      type="checkbox"
                      checked={isFloatingIslandMode}
                      onChange={(e) => setIsFloatingIslandMode(e.target.checked)}
                      className="w-6 h-6 text-cyan-500"
                    />
                    <span className="text-lg font-bold text-cyan-700">うきしまモード 🏝️</span>
                  </label>
                  <p className="text-sm text-cyan-600 mt-2">うきしまのマスを つくるよ！</p>
                </div>

                {/* ツール選択 */}
                <div className="bg-white rounded-2xl p-4 border-3 border-blue-300 shadow-lg">
                  <h3 className="font-bold mb-3 text-blue-800 text-lg">🎯 マスのしゅるい</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {cellTypeTools.map((tool) => (
                      <button
                        key={tool.type}
                        onClick={() => setSelectedTool(tool.type)}
                        className={`
                          p-4 rounded-xl border-3 transition-all text-left shadow-lg
                          ${selectedTool === tool.type 
                            ? 'border-yellow-400 bg-yellow-100 transform scale-105' 
                            : 'border-gray-300 hover:border-gray-400 hover:transform hover:scale-102'
                          }
                          ${tool.color}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{tool.icon}</span>
                          <div>
                            <div className="font-bold text-lg text-gray-800">{tool.label}</div>
                            <div className="text-sm text-gray-600">{tool.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* デスクトップ用ツールパレット */}
          {!isMobile && (
            <div className="w-96 bg-gradient-to-b from-yellow-100 to-orange-100 p-6 overflow-y-auto border-r-4 border-yellow-300">
              <div className="space-y-6">
                {/* モード切替 */}
                <div className="bg-white rounded-2xl p-5 shadow-xl border-3 border-cyan-300">
                  <h3 className="font-bold mb-4 text-cyan-800 text-xl">🏝️ とくべつモード</h3>
                  <label className="flex items-center space-x-4 bg-cyan-50 p-4 rounded-xl cursor-pointer hover:bg-cyan-100 transition-all">
                    <input
                      type="checkbox"
                      checked={isFloatingIslandMode}
                      onChange={(e) => setIsFloatingIslandMode(e.target.checked)}
                      className="w-6 h-6 text-cyan-500"
                    />
                    <div>
                      <span className="text-lg font-bold text-cyan-700">うきしまモード 🏝️</span>
                      <p className="text-sm text-cyan-600">うきしまのマスを つくるよ！</p>
                    </div>
                  </label>
                </div>

                {/* ツール選択 */}
                <div className="bg-white rounded-2xl p-5 shadow-xl border-3 border-blue-300">
                  <h3 className="font-bold mb-4 text-blue-800 text-xl">🎯 マスのしゅるい</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {cellTypeTools.map((tool) => (
                      <button
                        key={tool.type}
                        onClick={() => setSelectedTool(tool.type)}
                        className={`
                          p-4 rounded-xl border-3 transition-all text-left shadow-lg hover:shadow-xl
                          ${selectedTool === tool.type 
                            ? 'border-yellow-400 bg-yellow-100 transform scale-105' 
                            : 'border-gray-300 hover:border-gray-400 hover:transform hover:scale-102'
                          }
                          ${tool.color}
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{tool.icon}</span>
                          <div>
                            <div className="font-bold text-lg text-gray-800">{tool.label}</div>
                            <div className="text-sm text-gray-600">{tool.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 選択中のマス設定 */}
                {selectedCell && (
                  <div className="bg-white rounded-2xl p-5 shadow-xl border-3 border-green-300">
                    <h3 className="font-bold mb-4 text-green-800 text-xl">⚙️ マスのせってい</h3>
                    <div className="space-y-4">
                      <div className="bg-green-50 p-3 rounded-xl">
                        <label className="block text-lg font-bold text-green-700 mb-1">
                          📍 マスばんごう: {selectedCell.id}
                        </label>
                        <p className="text-sm text-green-600">このマスは {getCellIcon(selectedCell)} {cellTypeTools.find(t => t.type === selectedCell.type)?.label} だよ！</p>
                      </div>
                      
                      {(selectedCell.type === 'skip' || selectedCell.type === 'advance' || selectedCell.type === 'back') && (
                        <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300">
                          <label className="block text-lg font-bold text-yellow-700 mb-2">
                            🔢 すうじをきめよう
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={selectedCell.value || 1}
                            onChange={(e) => updateSelectedCell({ value: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl text-xl font-bold text-center"
                          />
                          <p className="text-sm text-yellow-600 mt-2">
                            {selectedCell.type === 'skip' && '何回おやすみするか'}
                            {selectedCell.type === 'advance' && '何マスすすむか'}
                            {selectedCell.type === 'back' && '何マスもどるか'}
                          </p>
                        </div>
                      )}
                      
                      {selectedCell.type === 'warp' && (
                        <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-300">
                          <label className="block text-lg font-bold text-purple-700 mb-2">
                            🌀 どこにワープする？
                          </label>
                          <select
                            value={selectedCell.warpTo || ''}
                            onChange={(e) => updateSelectedCell({ warpTo: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl text-lg font-bold"
                          >
                            <option value="">えらんでね！</option>
                            {cells.filter(c => c.id !== selectedCell.id).map(cell => (
                              <option key={cell.id} value={cell.id}>
                                {cell.id}ばんのマス {getCellIcon(cell)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedCell.type === 'island_exit' && (
                        <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-300">
                          <label className="block text-lg font-bold text-emerald-700 mb-2">
                            🚪 うきしまから どこにもどる？
                          </label>
                          <select
                            value={selectedCell.returnTo || ''}
                            onChange={(e) => updateSelectedCell({ returnTo: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl text-lg font-bold"
                          >
                            <option value="">えらんでね！</option>
                            {cells.filter(c => c.id !== selectedCell.id && !c.isFloatingIsland).map(cell => (
                              <option key={cell.id} value={cell.id}>
                                {cell.id}ばんのマス {getCellIcon(cell)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* ポケモン設定 */}
                      <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-300">
                        <label className="block text-lg font-bold text-blue-700 mb-3">
                          🎮 ポケモンをおこう！
                        </label>
                        {selectedCell.pokemon ? (
                          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border-2 border-blue-300 shadow-lg">
                            <Image
                              src={PokeApiService.getPokemonImageUrl(selectedCell.pokemon, 'sprite')}
                              alt={selectedCell.pokemon.name}
                              width={60}
                              height={60}
                              className="rounded-full bg-yellow-100 p-2 shadow-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-pokemon.svg';
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-bold text-xl text-blue-800 mb-2">{selectedCell.pokemon.name}</div>
                              <button
                                onClick={() => removePokemonFromCell(selectedCell.id)}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded-full hover:bg-red-600 font-bold"
                              >
                                🗑️ けす
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowPokemonSelector(true)}
                            className="w-full py-4 px-6 border-3 border-dashed border-blue-400 rounded-xl text-blue-700 hover:bg-blue-50 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                          >
                            ✨ ポケモンをえらぼう！
                          </button>
                        )}
                      </div>

                      <div className="bg-pink-50 p-4 rounded-xl border-2 border-pink-300">
                        <label className="block text-lg font-bold text-pink-700 mb-2">
                          💬 メッセージをかこう！
                        </label>
                        <input
                          type="text"
                          value={selectedCell.message || ''}
                          onChange={(e) => updateSelectedCell({ message: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl text-lg font-bold"
                          placeholder="たのしいメッセージをかいてね！"
                        />
                        <p className="text-sm text-pink-600 mt-2">みんなが よろこぶメッセージを かいてみよう！</p>
                      </div>
                      
                      <button
                        onClick={() => deleteCell(selectedCell.id)}
                        className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedCell.type === 'start' || selectedCell.type === 'goal'}
                      >
                        🗑️ このマスをけす
                      </button>
                    </div>
                  </div>
                )}

                {/* アクション */}
                <div className="space-y-4">
                  <button
                    onClick={handleSave}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-2xl hover:from-green-500 hover:to-green-700 font-bold text-xl shadow-xl transform hover:scale-105 transition-all"
                  >
                    💾 すごろくをほぞん！
                  </button>
                  <button
                    onClick={onCancel}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-2xl hover:from-gray-500 hover:to-gray-700 font-bold text-xl shadow-xl transform hover:scale-105 transition-all"
                  >
                    ✕ やめる
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* キャンバス */}
          <div className={`${isMobile ? 'w-full h-screen' : 'flex-1'} relative overflow-hidden`}>
            <div
              ref={canvasRef}
              className={`w-full ${isMobile ? 'h-full' : 'h-full'} bg-gradient-to-br from-green-50 to-blue-50 relative cursor-crosshair`}
              style={{ 
                touchAction: 'none', // スクロール完全無効化
                minHeight: isMobile ? '100vh' : 'auto'
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
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
                      absolute ${isMobile ? 'w-24 h-24' : 'w-20 h-20'} border-4 rounded-2xl shadow-2xl cursor-pointer
                      flex flex-col items-center justify-center text-white font-black ${isMobile ? 'text-lg' : 'text-base'}
                      transition-all duration-300 hover:scale-125 hover:shadow-3xl hover:rotate-3
                      ${getCellColor(cell)}
                      ${selectedCell?.id === cell.id ? 'ring-6 ring-yellow-300 ring-opacity-80 animate-pulse' : ''}
                      ${cell.isFloatingIsland ? 'ring-4 ring-cyan-300 ring-opacity-60' : ''}
                    `}
                    style={{
                      left: `${cell.position.x - (isMobile ? 48 : 40)}px`,
                      top: `${cell.position.y - (isMobile ? 48 : 40)}px`,
                      zIndex: draggedCell?.id === cell.id ? 1000 : 1
                    }}
                    onMouseDown={(e) => handleCellMouseDown(e, cell)}
                    onTouchStart={(e) => handleCellMouseDown(e, cell)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(cell);
                    }}
                  >
                    <div className="text-2xl leading-none drop-shadow-lg">{getCellIcon(cell)}</div>
                    <div className="text-xs leading-none mt-1 bg-black bg-opacity-40 px-2 py-0.5 rounded-full">{cell.id}</div>
                    
                    {/* ポケモン画像 */}
                    {cell.pokemon && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="relative w-6 h-6 bg-white rounded-full p-0.5 shadow-md">
                          <Image
                            src={PokeApiService.getPokemonImageUrl(cell.pokemon, 'sprite')}
                            alt={cell.pokemon.name}
                            width={20}
                            height={20}
                            className="pixelated rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-pokemon.svg';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
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
              {!isMobile && (
                <div className="absolute bottom-6 right-6 bg-gradient-to-br from-yellow-100 to-orange-100 border-3 border-yellow-400 rounded-2xl p-5 shadow-2xl">
                  <div className="font-bold mb-3 text-orange-800 text-lg">🎯 つかいかた:</div>
                  <div className="space-y-2 text-orange-700 font-bold">
                    <div>• タッチ: マスをおく</div>
                    <div>• ひっぱる: マスをうごかす</div>
                    <div>• マスをタッチ: せっていをかえる</div>
                  </div>
                </div>
              )}
              
              {/* モバイル用操作ヒント */}
              {isMobile && !showToolPanel && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 shadow-xl border-2 border-white">
                  <div className="font-bold text-lg">🛠️ どうぐボタンで</div>
                  <div className="font-bold text-lg">ツールをひょうじ！</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}