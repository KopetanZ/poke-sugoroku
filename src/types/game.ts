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

export interface GameSettings {
  boardSize: number;
  maxPlayers: number;
  diceMax: number;
  usePokemonAvatars: boolean;
  playSound: boolean;
}