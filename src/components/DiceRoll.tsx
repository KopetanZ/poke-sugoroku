'use client';

import { useState, useEffect } from 'react';

interface DiceRollProps {
  isRolling: boolean;
  finalValue?: number;
  onRollComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function DiceRoll({ isRolling, finalValue, onRollComplete, size = 'medium' }: DiceRollProps) {
  const [displayValue, setDisplayValue] = useState(1);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'settling'>('idle');

  const sizeClasses = {
    small: 'w-12 h-12 text-xs',
    medium: 'w-20 h-20 text-lg',
    large: 'w-32 h-32 text-3xl'
  };

  const getDotPositions = (value: number) => {
    const positions = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };
    return positions[value as keyof typeof positions] || ['center'];
  };

  useEffect(() => {
    if (isRolling && animationPhase === 'idle') {
      setAnimationPhase('rolling');
      
      // ランダムにサイコロの値を変化させる
      const rollInterval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      // 1秒後に最終値に設定
      setTimeout(() => {
        clearInterval(rollInterval);
        if (finalValue) {
          setDisplayValue(finalValue);
          setAnimationPhase('settling');
          
          // さらに0.5秒後に完了
          setTimeout(() => {
            setAnimationPhase('idle');
            onRollComplete?.();
          }, 500);
        }
      }, 1000);
    }
  }, [isRolling, finalValue, animationPhase, onRollComplete]);

  const getDotStyle = (position: string) => {
    const baseStyle = "absolute w-2 h-2 bg-red-600 rounded-full";
    
    switch (position) {
      case 'top-left':
        return `${baseStyle} top-1 left-1`;
      case 'top-right':
        return `${baseStyle} top-1 right-1`;
      case 'middle-left':
        return `${baseStyle} top-1/2 left-1 transform -translate-y-1/2`;
      case 'center':
        return `${baseStyle} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      case 'middle-right':
        return `${baseStyle} top-1/2 right-1 transform -translate-y-1/2`;
      case 'bottom-left':
        return `${baseStyle} bottom-1 left-1`;
      case 'bottom-right':
        return `${baseStyle} bottom-1 right-1`;
      default:
        return baseStyle;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`
          ${sizeClasses[size]}
          bg-white border-2 border-gray-300 rounded-lg shadow-lg
          relative flex items-center justify-center
          transition-transform duration-200
          ${animationPhase === 'rolling' ? 'animate-bounce' : ''}
          ${animationPhase === 'settling' ? 'animate-pulse' : ''}
          ${isRolling ? 'rotate-animation' : ''}
        `}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* サイコロの点 */}
        {getDotPositions(displayValue).map((position, index) => (
          <div
            key={index}
            className={getDotStyle(position)}
          />
        ))}
        
        {/* 転がり効果のオーバーレイ */}
        {animationPhase === 'rolling' && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-30 animate-spin rounded-lg" />
        )}
      </div>
      
      {/* 値の表示（デバッグ用・本番では非表示にできます） */}
      {finalValue && animationPhase !== 'idle' && (
        <div className="mt-2 text-sm text-gray-600 font-semibold">
          目標: {finalValue}
        </div>
      )}
      
      <style jsx>{`
        .rotate-animation {
          animation: diceRoll 1s ease-in-out;
        }
        
        @keyframes diceRoll {
          0% {
            transform: rotateX(0deg) rotateY(0deg) scale(1);
          }
          25% {
            transform: rotateX(90deg) rotateY(45deg) scale(1.1);
          }
          50% {
            transform: rotateX(180deg) rotateY(90deg) scale(1.2);
          }
          75% {
            transform: rotateX(270deg) rotateY(135deg) scale(1.1);
          }
          100% {
            transform: rotateX(360deg) rotateY(180deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}