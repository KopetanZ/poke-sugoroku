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
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'settling' | 'complete'>('idle');
  const [showResult, setShowResult] = useState(false);

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
      setShowResult(false);
      
      // より滑らかに値を変化させる
      const rollInterval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80);

      // 1.5秒後に最終値に設定
      setTimeout(() => {
        clearInterval(rollInterval);
        if (finalValue) {
          setDisplayValue(finalValue);
          setAnimationPhase('settling');
          
          // 0.5秒後に結果表示
          setTimeout(() => {
            setAnimationPhase('complete');
            setShowResult(true);
            onRollComplete?.();
            
            // 2秒後にアイドル状態に戻る
            setTimeout(() => {
              setAnimationPhase('idle');
              setShowResult(false);
            }, 2000);
          }, 500);
        }
      }, 1500);
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
          transition-all duration-300
          ${animationPhase === 'rolling' ? 'dice-rolling' : ''}
          ${animationPhase === 'settling' ? 'dice-settling' : ''}
          ${animationPhase === 'complete' ? 'dice-complete' : ''}
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
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent opacity-40 animate-spin rounded-lg" />
        )}
      </div>
      
      {/* 結果表示 */}
      {showResult && (
        <div className="mt-3 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full font-bold text-xl animate-bounce">
          {displayValue}が出ました！
        </div>
      )}
      
      <style jsx>{`
        .dice-rolling {
          animation: continuousRoll 1.5s ease-in-out;
        }
        
        .dice-settling {
          animation: settleDown 0.5s ease-out;
        }
        
        .dice-complete {
          animation: celebrate 0.6s ease-out;
        }
        
        @keyframes continuousRoll {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
          }
          10% {
            transform: rotateX(45deg) rotateY(45deg) rotateZ(15deg) scale(1.05);
          }
          20% {
            transform: rotateX(90deg) rotateY(90deg) rotateZ(30deg) scale(1.1);
          }
          30% {
            transform: rotateX(135deg) rotateY(135deg) rotateZ(45deg) scale(1.15);
          }
          40% {
            transform: rotateX(180deg) rotateY(180deg) rotateZ(60deg) scale(1.2);
          }
          50% {
            transform: rotateX(225deg) rotateY(225deg) rotateZ(75deg) scale(1.15);
          }
          60% {
            transform: rotateX(270deg) rotateY(270deg) rotateZ(90deg) scale(1.1);
          }
          70% {
            transform: rotateX(315deg) rotateY(315deg) rotateZ(105deg) scale(1.05);
          }
          80% {
            transform: rotateX(360deg) rotateY(360deg) rotateZ(120deg) scale(1);
          }
          90% {
            transform: rotateX(405deg) rotateY(405deg) rotateZ(135deg) scale(0.95);
          }
          100% {
            transform: rotateX(450deg) rotateY(450deg) rotateZ(150deg) scale(1);
          }
        }
        
        @keyframes settleDown {
          0% {
            transform: rotateX(450deg) rotateY(450deg) rotateZ(150deg) scale(1);
          }
          50% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.1);
          }
          100% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
          }
        }
        
        @keyframes celebrate {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}