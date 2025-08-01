import { GameState, Player, Cell } from './game';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: OnlinePlayer[];
  maxPlayers: number;
  gameState?: GameState;
  isPrivate: boolean;
  createdAt: Date;
}

export interface OnlinePlayer extends Player {
  socketId: string;
  isConnected: boolean;
  isReady: boolean;
  lastActivity: Date;
}

export type MultiplayerEventType = 
  | 'join_room'
  | 'leave_room'
  | 'player_ready'
  | 'start_game'
  | 'roll_dice'
  | 'game_update'
  | 'chat_message'
  | 'room_update'
  | 'error';

export interface MultiplayerEvent {
  type: MultiplayerEventType;
  data: any;
  timestamp: Date;
  playerId?: string;
  roomId?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'game_event';
}

export interface RoomListRequest {
  page?: number;
  limit?: number;
  showPrivate?: boolean;
}

export interface RoomListResponse {
  rooms: Room[];
  total: number;
  page: number;
  hasMore: boolean;
}