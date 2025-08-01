'use client';

import { useState, useEffect } from 'react';

interface DiceRollProps {
  isRolling: boolean;
  finalValue?: number;
  onRollComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function DiceRoll({ isRolling, finalValue, onRollComplete, size = 'medium' }: DiceRollProps) {
  const [needleRotation, setNeedleRotation] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'settling' | 'complete'>('idle');
  const [showResult, setShowResult] = useState(false);

  const sizeClasses = {
    small: 'w-24 h-24 text-xs',
    medium: 'w-32 h-32 text-sm',
    large: 'w-48 h-48 text-lg'
  };

  // 各数字の位置（度数）を計算
  const getNumberAngle = (number: number) => {
    // 1から6までの数字を円周上に等間隔配置（0度から時計回り）
    return (number - 1) * 60; // 360度 ÷ 6 = 60度間隔
  };

  // 最終値に応じた針の最終位置を計算
  const getFinalNeedleAngle = (value: number) => {
    const baseAngle = getNumberAngle(value);
    // 数字の中央を指すように調整（針が上向きなので90度オフセット）
    return baseAngle + 90;
  };

  useEffect(() => {
    if (isRolling && animationPhase === 'idle') {
      setAnimationPhase('spinning');
      setShowResult(false);
      
      // 回転アニメーション中のランダム回転
      let currentRotation = needleRotation;
      const spinInterval = setInterval(() => {
        currentRotation += 30; // 30度ずつ回転
        setNeedleRotation(currentRotation);
      }, 100);

      // 2秒後に最終位置に設定
      setTimeout(() => {
        clearInterval(spinInterval);
        if (finalValue) {
          // 最低3回転 + 最終位置
          const finalRotation = 1080 + getFinalNeedleAngle(finalValue);
          setNeedleRotation(finalRotation);
          setAnimationPhase('settling');
          
          // 1秒後に結果表示
          setTimeout(() => {
            setAnimationPhase('complete');
            setShowResult(true);
            onRollComplete?.();
            
            // 3秒後にアイドル状態に戻る
            setTimeout(() => {
              setAnimationPhase('idle');
              setShowResult(false);
            }, 3000);
          }, 1000);
        }
      }, 2000);
    }
  }, [isRolling, finalValue, animationPhase, onRollComplete, needleRotation]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* ルーレット盤 */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* 外側の円 */}
        <div className="w-full h-full rounded-full border-4 border-yellow-500 bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-lg relative overflow-hidden">
          
          {/* 数字セクション */}
          {[1, 2, 3, 4, 5, 6].map((number, index) => {
            const angle = getNumberAngle(number);
            const colors = [
              'bg-red-400', 'bg-blue-400', 'bg-green-400', 
              'bg-purple-400', 'bg-orange-400', 'bg-pink-400'
            ];
            
            return (
              <div
                key={number}
                className={`absolute w-full h-full ${colors[index]} opacity-80`}
                style={{
                  clipPath: `polygon(50% 50%, 
                    ${50 + 45 * Math.cos((angle - 30) * Math.PI / 180)}% ${50 + 45 * Math.sin((angle - 30) * Math.PI / 180)}%, 
                    ${50 + 45 * Math.cos((angle + 30) * Math.PI / 180)}% ${50 + 45 * Math.sin((angle + 30) * Math.PI / 180)}%)`
                }}
              >
                {/* 数字 */}
                <div
                  className="absolute text-white font-bold text-center"
                  style={{
                    top: `${50 - 30 * Math.cos(angle * Math.PI / 180)}%`,
                    left: `${50 + 30 * Math.sin(angle * Math.PI / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: size === 'small' ? '12px' : size === 'medium' ? '16px' : '24px'
                  }}
                >
                  {number}
                </div>
              </div>
            );
          })}
          
          {/* 中央の軸 */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-lg"></div>
          
          {/* 回転する針 */}
          <div
            className={`absolute top-1/2 left-1/2 origin-bottom z-10 transition-transform ${
              animationPhase === 'spinning' ? 'duration-100 ease-linear' : 
              animationPhase === 'settling' ? 'duration-1000 ease-out' : ''
            }`}
            style={{
              transform: `translate(-50%, -100%) rotate(${needleRotation}deg)`,
              width: '4px',
              height: '40%',
              backgroundColor: '#1f2937'
            }}
          >
            {/* 針の先端 */}
            <div className="absolute -top-2 -left-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        </div>
      </div>
      
      {/* 回転状態表示 */}
      {animationPhase === 'spinning' && (
        <div className="text-lg font-semibold text-purple-600">
          🎯 回転中...
        </div>
      )}
      
      {animationPhase === 'settling' && (
        <div className="text-lg font-semibold text-orange-600">
          ⏳ 停止中...
        </div>
      )}
      
      {/* 結果表示 */}
      {showResult && finalValue && (
        <div className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-xl animate-bounce shadow-lg">
          🎉 {finalValue}が出ました！
        </div>
      )}
    </div>
  );
}