'use client';

import { useState, useEffect } from 'react';
import { Achievement, PlayerStats } from '@/types/achievements';
import { AchievementService } from '@/services/achievementService';

interface AchievementPanelProps {
  onClose: () => void;
}

export function AchievementPanel({ onClose }: AchievementPanelProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    setStats(AchievementService.getPlayerStats());
  }, []);

  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'all', name: '全て', icon: '🏆' },
    { id: 'first_time', name: '初回', icon: '🎮' },
    { id: 'victory', name: '勝利', icon: '👑' },
    { id: 'special', name: '特殊', icon: '⭐' },
    { id: 'collection', name: 'コレクション', icon: '📱' }
  ];

  const filteredAchievements = activeCategory === 'all' 
    ? stats.achievements 
    : stats.achievements.filter(a => a.category === activeCategory);

  const unlockedCount = stats.achievements.filter(a => a.isUnlocked).length;
  const totalCount = stats.achievements.length;
  const completionRate = Math.round((unlockedCount / totalCount) * 100);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500 text-white';
      case 'rare': return 'bg-blue-500 text-white';
      case 'epic': return 'bg-purple-500 text-white';
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">🏆 実績・統計</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          
          {/* 統計サマリー */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
              <div className="text-sm opacity-90">プレイ回数</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.gamesWon}</div>
              <div className="text-sm opacity-90">勝利数</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.pokemonEncountered.size}</div>
              <div className="text-sm opacity-90">出会ったポケモン</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{completionRate}%</div>
              <div className="text-sm opacity-90">実績達成率</div>
            </div>
          </div>
        </div>

        {/* カテゴリータブ */}
        <div className="flex border-b overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 px-6 py-4 font-semibold transition-colors ${
                activeCategory === category.id
                  ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* 実績リスト */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`
                  border-2 rounded-xl p-4 transition-all hover:shadow-lg
                  ${achievement.isUnlocked 
                    ? getRarityColor(achievement.rarity)
                    : 'border-gray-200 bg-gray-100 opacity-60'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* アイコン */}
                  <div className={`
                    text-3xl w-12 h-12 rounded-full flex items-center justify-center
                    ${achievement.isUnlocked 
                      ? 'bg-white shadow-md' 
                      : 'bg-gray-300'
                    }
                  `}>
                    {achievement.isUnlocked ? achievement.icon : '🔒'}
                  </div>
                  
                  {/* コンテンツ */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-bold ${achievement.isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                        {achievement.name}
                      </h3>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold uppercase
                        ${getRarityBadge(achievement.rarity)}
                      `}>
                        {achievement.rarity}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-2 ${achievement.isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                    
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <p className="text-xs text-gray-500">
                        解除日時: {achievement.unlockedAt.toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            解除済み: {unlockedCount} / {totalCount} ({completionRate}%)
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-semibold"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}