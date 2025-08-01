'use client';

import { useState, useEffect } from 'react';
import { Achievement } from '@/types/achievements';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // アニメーション完了後にクローズ
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-400';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
    `}>
      <div className={`
        bg-white rounded-2xl shadow-2xl border-4 ${getRarityBorder(achievement.rarity)}
        overflow-hidden transform hover:scale-105 transition-transform
      `}>
        {/* ヘッダーグラデーション */}
        <div className={`
          h-2 bg-gradient-to-r ${getRarityColor(achievement.rarity)}
        `} />
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* アイコン */}
            <div className={`
              text-4xl w-16 h-16 rounded-full flex items-center justify-center
              bg-gradient-to-br ${getRarityColor(achievement.rarity)} text-white
              shadow-lg animate-bounce
            `}>
              {achievement.icon}
            </div>
            
            {/* コンテンツ */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-gray-800">
                  🏆 実績解除！
                </h3>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-semibold uppercase
                  ${achievement.rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                    achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                    'bg-yellow-100 text-yellow-700'
                  }
                `}>
                  {achievement.rarity}
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-800 mb-1">
                {achievement.name}
              </h4>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {achievement.description}
              </p>
            </div>
            
            {/* 閉じるボタン */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* 底部のキラキラアニメーション */}
        <div className="relative h-1 overflow-hidden">
          <div className={`
            absolute inset-0 bg-gradient-to-r ${getRarityColor(achievement.rarity)}
            animate-pulse
          `} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-ping" />
        </div>
      </div>
    </div>
  );
}