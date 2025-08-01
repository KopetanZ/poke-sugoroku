export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
  category: 'first_time' | 'victory' | 'special' | 'collection';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalMoves: number;
  specialCellsLanded: number;
  pokemonEncountered: Set<number>;
  longestWinStreak: number;
  currentWinStreak: number;
  fastestWin: number | null; // 最少手数での勝利
  achievements: Achievement[];
  lastPlayed: Date;
  firstPlayDate: Date;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    name: '初めての冒険',
    description: '初めてゲームをプレイしました',
    icon: '🎮',
    isUnlocked: false,
    category: 'first_time',
    rarity: 'common'
  },
  {
    id: 'first_win',
    name: '初勝利',
    description: '初めてゲームに勝利しました',
    icon: '🏆',
    isUnlocked: false,
    category: 'victory',
    rarity: 'common'
  },
  {
    id: 'win_streak_3',
    name: '連勝街道',
    description: '3連勝を達成しました',
    icon: '🔥',
    isUnlocked: false,
    category: 'victory',
    rarity: 'rare'
  },
  {
    id: 'win_streak_5',
    name: '無敗の王者',
    description: '5連勝を達成しました',
    icon: '👑',
    isUnlocked: false,
    category: 'victory',
    rarity: 'epic'
  },
  {
    id: 'speed_runner',
    name: 'スピードランナー',
    description: '10手以内でゴールしました',
    icon: '⚡',
    isUnlocked: false,
    category: 'special',
    rarity: 'rare'
  },
  {
    id: 'lucky_seven',
    name: 'ラッキーセブン',
    description: '7回連続で6の目を出しました',
    icon: '🎲',
    isUnlocked: false,
    category: 'special',
    rarity: 'epic'
  },
  {
    id: 'warp_master',
    name: 'ワープマスター',
    description: 'ワープマスを10回使用しました',
    icon: '🌀',
    isUnlocked: false,
    category: 'special',
    rarity: 'rare'
  },
  {
    id: 'pokemon_collector',
    name: 'ポケモンコレクター',
    description: '50種類のポケモンに出会いました',
    icon: '📱',
    isUnlocked: false,
    category: 'collection',
    rarity: 'epic'
  },
  {
    id: 'pokemon_master',
    name: 'ポケモンマスター',
    description: '100種類のポケモンに出会いました',
    icon: '🌟',
    isUnlocked: false,
    category: 'collection',
    rarity: 'legendary'
  },
  {
    id: 'dedicated_player',
    name: '熱心なプレイヤー',
    description: '100回ゲームをプレイしました',
    icon: '💪',
    isUnlocked: false,
    category: 'special',
    rarity: 'epic'
  },
  {
    id: 'map_creator',
    name: 'マップクリエイター',
    description: 'カスタムマップを作成しました',
    icon: '🎨',
    isUnlocked: false,
    category: 'first_time',
    rarity: 'rare'
  }
];

export interface AchievementNotification {
  achievement: Achievement;
  timestamp: Date;
}