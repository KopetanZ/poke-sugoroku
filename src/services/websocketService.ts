import { MultiplayerEvent, Room, OnlinePlayer, ChatMessage } from '@/types/multiplayer';
import { GameState } from '@/types/game';

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnecting = false;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!this.instance) {
      this.instance = new WebSocketService();
    }
    return this.instance;
  }

  // イベントリスナーの追加
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // イベントリスナーの削除
  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // イベントの発火
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // WebSocket接続
  async connect(url?: string): Promise<boolean> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected', {});
      };

      this.socket.onmessage = (event) => {
        try {
          const data: MultiplayerEvent = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('disconnected', {});
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

      return true;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
      return false;
    }
  }

  // 自動再接続
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  // メッセージの処理
  private handleMessage(data: MultiplayerEvent): void {
    switch (data.type) {
      case 'room_update':
        this.emit('roomUpdate', data.data);
        break;
      case 'game_update':
        this.emit('gameUpdate', data.data);
        break;
      case 'chat_message':
        this.emit('chatMessage', data.data);
        break;
      case 'error':
        this.emit('error', data.data);
        break;
      default:
        this.emit(data.type, data.data);
    }
  }

  // メッセージ送信
  send(event: MultiplayerEvent): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
      return true;
    }
    return false;
  }

  // 部屋に参加
  joinRoom(roomId: string, playerName: string): boolean {
    return this.send({
      type: 'join_room',
      data: { roomId, playerName },
      timestamp: new Date()
    });
  }

  // 部屋を離れる
  leaveRoom(roomId: string): boolean {
    return this.send({
      type: 'leave_room',
      data: { roomId },
      timestamp: new Date()
    });
  }

  // プレイヤー準備完了
  setPlayerReady(roomId: string, ready: boolean): boolean {
    return this.send({
      type: 'player_ready',
      data: { roomId, ready },
      timestamp: new Date()
    });
  }

  // ゲーム開始
  startGame(roomId: string): boolean {
    return this.send({
      type: 'start_game',
      data: { roomId },
      timestamp: new Date()
    });
  }

  // サイコロを振る
  rollDice(roomId: string, diceValue: number): boolean {
    return this.send({
      type: 'roll_dice',
      data: { roomId, diceValue },
      timestamp: new Date()
    });
  }

  // チャットメッセージ送信
  sendChatMessage(roomId: string, message: string): boolean {
    return this.send({
      type: 'chat_message',
      data: { roomId, message },
      timestamp: new Date()
    });
  }

  // 接続状態確認
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // 接続を切断
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  // デバッグ用: 接続状態の取得
  getConnectionState(): string {
    if (!this.socket) return 'CLOSED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// シングルトンインスタンス
export const websocketService = WebSocketService.getInstance();