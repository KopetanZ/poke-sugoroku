'use client';

import { useState } from 'react';
import { DifficultyLevel, GameSettings, DIFFICULTY_PRESETS } from '@/types/game';

interface DifficultySelectorProps {
  onSelect: (settings: Partial<GameSettings>) => void;
  onCancel: () => void;
  currentSettings?: Partial<GameSettings>;
}

export function DifficultySelector({ onSelect, onCancel, currentSettings }: DifficultySelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(
    currentSettings?.difficulty || 'normal'
  );
  const [customSettings, setCustomSettings] = useState<Partial<GameSettings>>({
    diceMin: currentSettings?.diceMin || 1,
    diceMax: currentSettings?.diceMax || 6,
    boardSize: currentSettings?.boardSize || 30,
    specialCellFrequency: currentSettings?.specialCellFrequency || 0.25,
  });

  const difficulties = [
    {
      level: 'easy' as DifficultyLevel,
      name: 'かんたん',
      icon: '🟢',
      description: 'サイコロ1-4、短いコース、特殊マス少なめ',
      color: 'from-green-400 to-green-600',
      textColor: 'text-green-700'
    },
    {
      level: 'normal' as DifficultyLevel,
      name: 'ふつう',
      icon: '🟡',
      description: 'サイコロ1-6、標準コース、バランスの良い特殊マス',
      color: 'from-yellow-400 to-yellow-600',
      textColor: 'text-yellow-700'
    },
    {
      level: 'hard' as DifficultyLevel,
      name: 'むずかしい',
      icon: '🔴',
      description: 'サイコロ1-8、長いコース、特殊マス多め',
      color: 'from-red-400 to-red-600',
      textColor: 'text-red-700'
    },
    {
      level: 'custom' as DifficultyLevel,
      name: 'カスタム',
      icon: '⚙️',
      description: '自分で細かく設定',
      color: 'from-purple-400 to-purple-600',
      textColor: 'text-purple-700'
    }
  ];

  const handleSelect = () => {
    const settings: Partial<GameSettings> = {
      difficulty: selectedDifficulty,
      ...DIFFICULTY_PRESETS[selectedDifficulty]
    };

    if (selectedDifficulty === 'custom') {
      Object.assign(settings, customSettings);
    }

    onSelect(settings);
  };

  const getPreviewSettings = (difficulty: DifficultyLevel) => {
    if (difficulty === 'custom') {
      return customSettings;
    }
    return DIFFICULTY_PRESETS[difficulty];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">🎯 難易度設定</h2>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 opacity-90">お好みの難易度を選んでください</p>
        </div>

        {/* 難易度選択 */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {difficulties.map((difficulty) => {
              const settings = getPreviewSettings(difficulty.level);
              return (
                <div
                  key={difficulty.level}
                  onClick={() => setSelectedDifficulty(difficulty.level)}
                  className={`
                    border-2 rounded-xl p-4 cursor-pointer transition-all transform hover:scale-105
                    ${selectedDifficulty === difficulty.level
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                    }
                  `}
                >
                  <div className="text-center mb-4">
                    <div className={`
                      text-4xl w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3
                      bg-gradient-to-br ${difficulty.color} text-white shadow-lg
                    `}>
                      {difficulty.icon}
                    </div>
                    <h3 className={`text-xl font-bold ${difficulty.textColor} mb-2`}>
                      {difficulty.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {difficulty.description}
                    </p>
                  </div>

                  {/* 設定プレビュー */}
                  <div className="text-xs space-y-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span>サイコロ:</span>
                      <span className="font-semibold">
                        {settings.diceMin}-{settings.diceMax}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>コースの長さ:</span>
                      <span className="font-semibold">{settings.boardSize}マス</span>
                    </div>
                    <div className="flex justify-between">
                      <span>特殊マス:</span>
                      <span className="font-semibold">
                        {Math.round((settings.specialCellFrequency || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* カスタム設定 */}
          {selectedDifficulty === 'custom' && (
            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-700 mb-4">カスタム設定</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    サイコロの最小値
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={customSettings.diceMin}
                    onChange={(e) => setCustomSettings(prev => ({
                      ...prev,
                      diceMin: parseInt(e.target.value) || 1
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    サイコロの最大値
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={customSettings.diceMax}
                    onChange={(e) => setCustomSettings(prev => ({
                      ...prev,
                      diceMax: parseInt(e.target.value) || 6
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    コースの長さ（マス数）
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={customSettings.boardSize}
                    onChange={(e) => setCustomSettings(prev => ({
                      ...prev,
                      boardSize: parseInt(e.target.value) || 30
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    特殊マスの頻度 ({Math.round((customSettings.specialCellFrequency || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={customSettings.specialCellFrequency}
                    onChange={(e) => setCustomSettings(prev => ({
                      ...prev,
                      specialCellFrequency: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
          >
            キャンセル
          </button>
          <button
            onClick={handleSelect}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
          >
            この設定で始める
          </button>
        </div>
      </div>
    </div>
  );
}