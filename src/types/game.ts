import { Pokemon } from './pokemon';

export type CellType = 
  | 'normal'
  | 'skip' // 〇回休み
  | 'advance' // 〇進む
  | 'back' // 〇戻る
  | 'warp' // ワープ
  | 'start'
  | 'goal';

export interface Cell {
  id: number;
  type: CellType;
  value?: number; // skip turns, advance/back steps
  warpTo?: number; // warp destination cell id
  pokemon?: Pokemon;
  message?: string; // 子供向けメッセージ
}

export interface Player {
  id: string;
  name: string;
  position: number;
  skipTurns: number;
  color: string;
  avatar?: Pokemon;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  board: Cell[];
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: Player;
  diceValue?: number;
  lastMove?: {
    from: number;
    to: number;
    player: Player;
    timestamp: Date;
  };
}

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'custom';

export interface GameSettings {
  boardSize: number;
  maxPlayers: number;
  diceMax: number;
  diceMin: number;
  usePokemonAvatars: boolean;
  playSound: boolean;
  difficulty: DifficultyLevel;
  specialCellFrequency: number; // 特殊マスの出現頻度 (0.0-1.0)
}

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, Partial<GameSettings>> = {
  easy: {
    diceMin: 1,
    diceMax: 4,
    specialCellFrequency: 0.15,
    boardSize: 25
  },
  normal: {
    diceMin: 1,
    diceMax: 6,
    specialCellFrequency: 0.25,
    boardSize: 30
  },
  hard: {
    diceMin: 1,
    diceMax: 8,
    specialCellFrequency: 0.35,
    boardSize: 40
  },
  custom: {
    // カスタム設定はユーザーが自由に設定
  }
};