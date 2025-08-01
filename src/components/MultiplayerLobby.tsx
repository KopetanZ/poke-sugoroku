'use client';

import { useState, useEffect } from 'react';
import { Room, OnlinePlayer, ChatMessage } from '@/types/multiplayer';
import { websocketService } from '@/services/websocketService';

interface MultiplayerLobbyProps {
  onJoinGame: (room: Room) => void;
  onBackToMenu: () => void;
}

export function MultiplayerLobby({ onJoinGame, onBackToMenu }: MultiplayerLobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // WebSocket接続
    const connectWebSocket = async () => {
      setIsConnecting(true);
      const connected = await websocketService.connect();
      setIsConnected(connected);
      setIsConnecting(false);
    };

    // イベントリスナー設定
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleRoomUpdate = (room: Room) => {
      setCurrentRoom(room);
    };
    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };

    websocketService.addEventListener('connected', handleConnected);
    websocketService.addEventListener('disconnected', handleDisconnected);
    websocketService.addEventListener('roomUpdate', handleRoomUpdate);
    websocketService.addEventListener('chatMessage', handleChatMessage);

    connectWebSocket();

    return () => {
      websocketService.removeEventListener('connected', handleConnected);
      websocketService.removeEventListener('disconnected', handleDisconnected);
      websocketService.removeEventListener('roomUpdate', handleRoomUpdate);
      websocketService.removeEventListener('chatMessage', handleChatMessage);
    };
  }, []);

  const joinRoom = (roomId: string) => {
    if (playerName.trim() && isConnected) {
      websocketService.joinRoom(roomId, playerName.trim());
    }
  };

  const leaveRoom = () => {
    if (currentRoom && isConnected) {
      websocketService.leaveRoom(currentRoom.id);
      setCurrentRoom(null);
      setChatMessages([]);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && currentRoom && isConnected) {
      websocketService.sendChatMessage(currentRoom.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const startGame = () => {
    if (currentRoom && isConnected) {
      websocketService.startGame(currentRoom.id);
    }
  };

  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-6">接続エラー</h2>
          <p className="text-gray-700 mb-6">
            マルチプレイヤーサーバーに接続できませんでした。
            現在この機能は開発中です。
          </p>
          <button
            onClick={onBackToMenu}
            className="w-full py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold text-lg"
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">サーバーに接続中...</p>
        </div>
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">部屋: {currentRoom.name}</h2>
              <button
                onClick={leaveRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
              >
                部屋を離れる
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* プレイヤーリスト */}
              <div>
                <h3 className="text-lg font-semibold mb-3">プレイヤー ({currentRoom.players.length}/{currentRoom.maxPlayers})</h3>
                <div className="space-y-2">
                  {currentRoom.players.map((player) => (
                    <div
                      key={player.id}
                      className={`p-3 rounded-xl border-2 ${
                        player.isReady ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{player.name}</span>
                        <div className="flex items-center gap-2">
                          {player.isReady && <span className="text-green-600">✓</span>}
                          {!player.isConnected && <span className="text-red-600">⚠️</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {currentRoom.players.every(p => p.isReady) && currentRoom.players.length >= 2 && (
                  <button
                    onClick={startGame}
                    className="w-full mt-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold text-lg"
                  >
                    ゲーム開始！
                  </button>
                )}
              </div>

              {/* チャット */}
              <div>
                <h3 className="text-lg font-semibold mb-3">チャット</h3>
                <div className="bg-gray-100 rounded-xl p-4 h-64 overflow-y-auto mb-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="mb-2">
                      <span className="font-semibold text-sm text-gray-600">
                        {msg.playerName}:
                      </span>
                      <span className="ml-2">{msg.message}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ルーム選択画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-purple-800">🌐 オンラインロビー</h1>
            <button
              onClick={onBackToMenu}
              className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              戻る
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2 text-gray-700">
              プレイヤー名
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="あなたの名前を入力してください"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">🚧 開発中 🚧</h2>
            <p className="text-gray-600 mb-4">
              オンラインマルチプレイヤー機能は現在開発中です。<br />
              将来のアップデートでご利用いただけるようになります。
            </p>
            <div className="text-sm text-gray-500">
              <p>予定機能:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>最大4人同時プレイ</li>
                <li>リアルタイムチャット</li>
                <li>カスタムルーム作成</li>
                <li>観戦モード</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}