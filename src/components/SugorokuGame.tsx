'use client';

import { useState, useEffect } from 'react';
import { GameState, Player, Cell } from '@/types/game';
import { GameEngine } from '@/services/gameEngine';
import { GameBoard } from './GameBoard';
import { CurvedGameBoard } from './CurvedGameBoard';
import { MapEditor } from './MapEditor';
import { ImprovedMapEditor } from './ImprovedMapEditor';
import { PokemonSelector } from './PokemonSelector';
import { AchievementNotification } from './AchievementNotification';
import { AchievementPanel } from './AchievementPanel';
import { DifficultySelector } from './DifficultySelector';
import { DiceRoll } from './DiceRoll';
import { PokeApiService } from '@/services/pokeapi';
import { SoundService } from '@/services/soundService';
import { AchievementService } from '@/services/achievementService';
import { Pokemon } from '@/types/pokemon';
import { Achievement } from '@/types/achievements';
import { GameSettings } from '@/types/game';
import Image from 'next/image';

export function SugorokuGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showMessage, setShowMessage] = useState('');
  const [playerNames, setPlayerNames] = useState(['プレイヤー1', 'プレイヤー2']);
  const [gameSetup, setGameSetup] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [customBoard, setCustomBoard] = useState<Cell[] | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showPokemonSelector, setShowPokemonSelector] = useState(false);
  const [currentPlayerForAvatar, setCurrentPlayerForAvatar] = useState<number | null>(null);
  const [playerAvatars, setPlayerAvatars] = useState<{ [key: number]: Pokemon }>({});
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);
  const [achievementNotifications, setAchievementNotifications] = useState<Achievement[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [gameSettings, setGameSettings] = useState<Partial<GameSettings>>({
    difficulty: 'normal',
    diceMin: 1,
    diceMax: 6,
    boardSize: 30,
    specialCellFrequency: 0.25
  });
  const [useCurvedBoard] = useState(true);
  const [useImprovedEditor] = useState(true);
  const [diceRollState, setDiceRollState] = useState({
    isRolling: false,
    finalValue: undefined as number | undefined
  });

  const startNewGame = async () => {
    setGameSetup(false);
    const newGame = await GameEngine.createGame(playerNames, gameSettings);
    if (customBoard) {
      newGame.board = customBoard;
    }
    
    // カスタムアバターを適用
    newGame.players.forEach((player, index) => {
      if (playerAvatars[index]) {
        player.avatar = playerAvatars[index];
      }
    });
    
    setGameState(newGame);
    setMoveCount(0);
    
    // ゲーム開始時の実績チェック
    const newAchievements = AchievementService.onGameStart();
    if (newAchievements.length > 0) {
      setAchievementNotifications(prev => [...prev, ...newAchievements]);
    }
  };

  const openMapEditor = () => {
    setEditMode(true);
  };

  const saveCustomBoard = (board: Cell[]) => {
    setCustomBoard(board);
    setEditMode(false);
    // ローカルストレージに保存
    localStorage.setItem('customSugorokuBoard', JSON.stringify(board));
    
    // カスタムマップ作成実績
    const newAchievements = AchievementService.onCustomMapCreated();
    if (newAchievements.length > 0) {
      setAchievementNotifications(prev => [...prev, ...newAchievements]);
    }
  };

  const cancelMapEditor = () => {
    setEditMode(false);
  };

  // コンポーネントマウント時の初期化
  useEffect(() => {
    // カスタムボードを読み込み
    const savedBoard = localStorage.getItem('customSugorokuBoard');
    if (savedBoard) {
      try {
        setCustomBoard(JSON.parse(savedBoard));
      } catch (error) {
        console.error('Failed to load custom board:', error);
      }
    }

    // サウンドサービスを初期化
    SoundService.initialize();

    // ミュート設定を読み込み
    const savedMuteState = localStorage.getItem('sugorokuMuted');
    if (savedMuteState) {
      const muted = JSON.parse(savedMuteState);
      setIsMuted(muted);
      SoundService.setMute(muted);
    }

    // 難易度設定を読み込み
    const savedGameSettings = localStorage.getItem('sugorokuGameSettings');
    if (savedGameSettings) {
      try {
        setGameSettings(JSON.parse(savedGameSettings));
      } catch (error) {
        console.error('Failed to load game settings:', error);
      }
    }

    // プレイヤーアバターを読み込み
    const savedAvatars = localStorage.getItem('playerAvatars');
    if (savedAvatars) {
      try {
        setPlayerAvatars(JSON.parse(savedAvatars));
      } catch (error) {
        console.error('Failed to load player avatars:', error);
      }
    }

    // 実績リスナーを設定
    const handleAchievement = (achievement: Achievement) => {
      setAchievementNotifications(prev => [...prev, achievement]);
    };
    AchievementService.addAchievementListener(handleAchievement);

    return () => {
      AchievementService.removeAchievementListener(handleAchievement);
    };
  }, []);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    SoundService.setMute(newMutedState);
    localStorage.setItem('sugorokuMuted', JSON.stringify(newMutedState));
  };

  const openPokemonSelector = (playerIndex: number) => {
    setCurrentPlayerForAvatar(playerIndex);
    setShowPokemonSelector(true);
  };

  const handlePokemonSelect = (pokemon: Pokemon) => {
    if (currentPlayerForAvatar !== null) {
      setPlayerAvatars(prev => ({
        ...prev,
        [currentPlayerForAvatar]: pokemon
      }));
      // ローカルストレージに保存
      const newAvatars = { ...playerAvatars, [currentPlayerForAvatar]: pokemon };
      localStorage.setItem('playerAvatars', JSON.stringify(newAvatars));
    }
    setShowPokemonSelector(false);
    setCurrentPlayerForAvatar(null);
  };

  const cancelPokemonSelect = () => {
    setShowPokemonSelector(false);
    setCurrentPlayerForAvatar(null);
  };

  const handleDifficultySelect = (settings: Partial<GameSettings>) => {
    setGameSettings(settings);
    setShowDifficultySelector(false);
    // ローカルストレージに保存
    localStorage.setItem('sugorokuGameSettings', JSON.stringify(settings));
  };

  const cancelDifficultySelect = () => {
    setShowDifficultySelector(false);
  };

  const rollDice = async () => {
    if (!gameState || isRolling || gameState.gameEnded) return;

    setIsRolling(true);
    setMoveCount(prev => prev + 1);
    
    // サイコロ音を再生
    SoundService.playDiceRoll();
    
    // 3Dサイコロアニメーションを開始
    setDiceRollState({ isRolling: true, finalValue: undefined });
    
    // サイコロアニメーション完了を待つ
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const diceValue = GameEngine.rollDice(gameSettings.diceMin || 1, gameSettings.diceMax || 6);
    
    // サイコロの最終値を設定
    setDiceRollState({ isRolling: false, finalValue: diceValue });
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const oldPosition = currentPlayer.position;
    const newGameState = await GameEngine.makeMove(gameState, diceValue);
    const newPosition = currentPlayer.position;
    
    setGameState(newGameState);
    
    // 特殊マスの効果音を再生
    const currentCell = newGameState.board[newPosition];
    switch (currentCell.type) {
      case 'advance':
        SoundService.playAdvanceSound();
        break;
      case 'back':
        SoundService.playBackSound();
        break;
      case 'skip':
        SoundService.playSkipSound();
        break;
      case 'warp':
        SoundService.playWarpSound();
        break;
    }

    // ポケモンの鳴き声を再生・実績チェック
    if (currentCell.pokemon) {
      setTimeout(() => {
        SoundService.playPokemonCry(currentCell.pokemon!);
      }, 500);
      
      // ポケモン出会い実績
      const pokemonAchievements = AchievementService.onPokemonEncounter(currentCell.pokemon.id);
      if (pokemonAchievements.length > 0) {
        setAchievementNotifications(prev => [...prev, ...pokemonAchievements]);
      }
    }

    // 特殊マス実績
    if (currentCell.type !== 'normal' && currentCell.type !== 'start' && currentCell.type !== 'goal') {
      const specialAchievements = AchievementService.onSpecialCellLanded(currentCell.type);
      if (specialAchievements.length > 0) {
        setAchievementNotifications(prev => [...prev, ...specialAchievements]);
      }
    }
    
    // メッセージ表示と読み上げ
    if (currentCell.message) {
      setShowMessage(currentCell.message);
      SoundService.speakText(currentCell.message);
      setTimeout(() => setShowMessage(''), 3000);
    }

    // ゲーム終了時の効果音・実績チェック
    if (newGameState.gameEnded && newGameState.winner) {
      setTimeout(() => {
        SoundService.playVictorySound();
        SoundService.speakText(`${newGameState.winner!.name}の勝ち！おめでとう！`);
      }, 1000);
      
      // ゲーム終了実績
      const endAchievements = AchievementService.onGameEnd(newGameState, moveCount);
      if (endAchievements.length > 0) {
        setTimeout(() => {
          setAchievementNotifications(prev => [...prev, ...endAchievements]);
        }, 2000);
      }
    }
    
    setIsRolling(false);
  };

  const resetGame = () => {
    setGameState(null);
    setGameSetup(true);
    setShowMessage('');
  };

  const addPlayer = () => {
    if (playerNames.length < 4) {
      setPlayerNames([...playerNames, `プレイヤー${playerNames.length + 1}`]);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  if (showDifficultySelector) {
    return (
      <DifficultySelector
        onSelect={handleDifficultySelect}
        onCancel={cancelDifficultySelect}
        currentSettings={gameSettings}
      />
    );
  }

  if (showPokemonSelector) {
    return (
      <PokemonSelector
        onSelect={handlePokemonSelect}
        onCancel={cancelPokemonSelect}
        title={`${playerNames[currentPlayerForAvatar || 0]}のアバターを選んでね！`}
        selectedPokemon={currentPlayerForAvatar !== null ? playerAvatars[currentPlayerForAvatar] : undefined}
      />
    );
  }

  if (editMode) {
    return useImprovedEditor ? (
      <ImprovedMapEditor
        onSave={saveCustomBoard}
        onCancel={cancelMapEditor}
        initialBoard={customBoard || undefined}
      />
    ) : (
      <MapEditor
        onSave={saveCustomBoard}
        onCancel={cancelMapEditor}
        initialBoard={customBoard || undefined}
      />
    );
  }

  if (gameSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">
            🎲 ポケモンすごろく 🎲
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">プレイヤー設定</h2>
              {playerNames.map((name, index) => (
                <div key={index} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
                      placeholder={`プレイヤー${index + 1}の名前`}
                    />
                    {playerNames.length > 2 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-lg font-semibold"
                      >
                        削除
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {playerAvatars[index] ? (
                        <Image
                          src={PokeApiService.getPokemonImageUrl(playerAvatars[index])}
                          alt={playerAvatars[index].name}
                          width={48}
                          height={48}
                          className="rounded-full bg-white p-1 border-2 border-gray-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-pokemon.svg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                          👤
                        </div>
                      )}
                      <span className="text-sm text-gray-600">
                        {playerAvatars[index] ? playerAvatars[index].name : 'アバター未設定'}
                      </span>
                    </div>
                    <button
                      onClick={() => openPokemonSelector(index)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
                    >
                      {playerAvatars[index] ? '変更' : '選択'}
                    </button>
                  </div>
                </div>
              ))}
              
              {playerNames.length < 4 && (
                <button
                  onClick={addPlayer}
                  className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-lg font-semibold"
                >
                  + プレイヤーを追加
                </button>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowDifficultySelector(true)}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 text-xl font-bold shadow-lg"
              >
                🎯 難易度設定
              </button>
              
              <div className="text-center bg-gray-100 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">現在の設定:</div>
                <div className="space-y-1 text-sm">
                  <div>難易度: <span className="font-semibold">{
                    gameSettings.difficulty === 'easy' ? 'かんたん' :
                    gameSettings.difficulty === 'normal' ? 'ふつう' :
                    gameSettings.difficulty === 'hard' ? 'むずかしい' : 'カスタム'
                  }</span></div>
                  <div>サイコロ: <span className="font-semibold">{gameSettings.diceMin}-{gameSettings.diceMax}</span></div>
                  <div>コース: <span className="font-semibold">{gameSettings.boardSize}マス</span></div>
                </div>
              </div>
              
              <button
                onClick={openMapEditor}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105 text-xl font-bold shadow-lg"
              >
                🎨 マップを編集する
              </button>
              
              {customBoard && (
                <div className="text-center text-green-600 font-semibold">
                  ✅ カスタムマップが設定されています
                </div>
              )}
              
              <button
                onClick={startNewGame}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 text-xl font-bold shadow-lg"
              >
                ゲームスタート！ 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl">ゲームを準備中...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-2 md:p-4">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-800">
            🎲 ポケモンすごろく
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAchievementPanel(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-semibold"
            >
              🏆
            </button>
            <button
              onClick={toggleMute}
              className={`px-4 py-2 rounded-xl transition-colors font-semibold ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={openMapEditor}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
            >
              マップ編集
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              新しいゲーム
            </button>
          </div>
        </div>
      </div>

      {/* ゲーム盤面 */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
        {useCurvedBoard ? (
          <CurvedGameBoard gameState={gameState} />
        ) : (
          <GameBoard gameState={gameState} />
        )}
      </div>

      {/* プレイヤー情報とコントロール */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 現在のプレイヤー */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
            <h3 className="text-xl font-bold mb-2">現在のプレイヤー</h3>
            <div className="flex items-center gap-4">
              {currentPlayer.avatar && (
                <Image
                  src={PokeApiService.getPokemonImageUrl(currentPlayer.avatar)}
                  alt={currentPlayer.avatar.name}
                  width={60}
                  height={60}
                  className="rounded-full bg-white p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-pokemon.svg';
                  }}
                />
              )}
              <div>
                <div className="text-2xl font-bold">{currentPlayer.name}</div>
                <div className="text-lg">位置: {currentPlayer.position + 1}</div>
                {currentPlayer.skipTurns > 0 && (
                  <div className="text-lg text-red-200">
                    {currentPlayer.skipTurns}回休み
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* サイコロとメッセージ */}
          <div className="space-y-4">
            <div className="text-center">
              <DiceRoll 
                isRolling={diceRollState.isRolling}
                finalValue={diceRollState.finalValue}
              />
            </div>
            
            <button
              onClick={rollDice}
              disabled={isRolling || gameState.gameEnded}
              className={`
                w-full py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg
                ${isRolling || gameState.gameEnded
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                }
              `}
            >
              {isRolling ? 'サイコロを振っています...' : 'サイコロを振る！'}
            </button>
          </div>
        </div>

        {/* プレイヤー一覧 */}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">プレイヤー一覧</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${player.id === currentPlayer.id 
                    ? 'border-yellow-400 bg-yellow-50 transform scale-105' 
                    : 'border-gray-300 bg-gray-50'
                  }
                `}
              >
                <div className="text-center">
                  {player.avatar && (
                    <Image
                      src={PokeApiService.getPokemonImageUrl(player.avatar, 'sprite')}
                      alt={player.avatar.name}
                      width={40}
                      height={40}
                      className="mx-auto mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-pokemon.svg';
                      }}
                    />
                  )}
                  <div className="font-semibold text-gray-800">{player.name}</div>
                  <div className="text-sm text-gray-600">位置: {player.position + 1}</div>
                  {player.skipTurns > 0 && (
                    <div className="text-xs text-red-600">
                      {player.skipTurns}回休み
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ゲーム終了時の表示 */}
        {gameState.gameEnded && gameState.winner && (
          <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🎉 ゲーム終了！ 🎉</div>
            <div className="text-2xl font-bold text-white mb-4">
              勝者: {gameState.winner.name}
            </div>
            {gameState.winner.avatar && (
              <Image
                src={PokeApiService.getPokemonImageUrl(gameState.winner.avatar)}
                alt={gameState.winner.avatar.name}
                width={100}
                height={100}
                className="mx-auto rounded-full bg-white p-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-pokemon.svg';
                }}
              />
            )}
          </div>
        )}

        {/* メッセージ表示 */}
        {showMessage && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white p-6 rounded-xl text-center text-xl font-bold z-50 animate-pulse">
            {showMessage}
          </div>
        )}

        {/* 実績パネル */}
        {showAchievementPanel && (
          <AchievementPanel onClose={() => setShowAchievementPanel(false)} />
        )}

        {/* 実績通知 */}
        {achievementNotifications.map((achievement, index) => (
          <AchievementNotification
            key={`${achievement.id}-${index}`}
            achievement={achievement}
            onClose={() => {
              setAchievementNotifications(prev => 
                prev.filter((_, i) => i !== index)
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}