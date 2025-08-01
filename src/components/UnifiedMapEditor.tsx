'use client';

import { useState } from 'react';
import { Cell } from '@/types/game';
import { ImprovedMapEditor } from './ImprovedMapEditor';
import { FreeFormMapEditor } from './FreeFormMapEditor';

interface UnifiedMapEditorProps {
  onSave: (board: Cell[]) => void;
  onCancel: () => void;
  initialBoard?: Cell[];
}

export function UnifiedMapEditor({ onSave, onCancel, initialBoard }: UnifiedMapEditorProps) {
  const [editorMode, setEditorMode] = useState<'grid' | 'freeform'>('grid');

  if (editorMode === 'freeform') {
    return (
      <FreeFormMapEditor
        onSave={onSave}
        onCancel={onCancel}
        initialBoard={initialBoard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <h1 className="text-3xl font-bold text-center mb-4">🎨 マップエディター</h1>
          
          {/* モード選択 */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setEditorMode('grid')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                editorMode === 'grid'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              🎯 グリッド配置
            </button>
            <button
              onClick={() => setEditorMode('freeform')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                editorMode === 'freeform'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              🎨 自由配置
            </button>
          </div>
          
          <div className="text-center mt-3 text-sm opacity-90">
            {editorMode === 'grid' ? (
              <span>📐 規則的なグリッド配置でマップを作成</span>
            ) : (
              <span>🏝️ ドラッグ&ドロップで自由配置 + 浮島機能</span>
            )}
          </div>
        </div>

        {/* エディター本体 */}
        <ImprovedMapEditor
          onSave={onSave}
          onCancel={onCancel}
          initialBoard={initialBoard}
        />
      </div>
    </div>
  );
}