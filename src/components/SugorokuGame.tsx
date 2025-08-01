'use client';

import { useState, useEffect } from 'react';
import { GameState, Player, Cell } from '@/types/game';
import { GameEngine } from '@/services/gameEngine';
import { GameBoard } from './GameBoard';
import { CurvedGameBoard } from './CurvedGameBoard';
import { FreeFormGameBoard } from './FreeFormGameBoard';
import { MapEditor } from './MapEditor';
import { ImprovedMapEditor } from './ImprovedMapEditor';
import { FreeFormMapEditor } from './FreeFormMapEditor';
import { UnifiedMapEditor } from './UnifiedMapEditor';
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
  const [useFreeFormEditor, setUseFreeFormEditor] = useState(false);
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
    return (
      <UnifiedMapEditor
        onSave={saveCustomBoard}
        onCancel={cancelMapEditor}
        initialBoard={customBoard || undefined}
      />
    );
  }

  if (gameSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 p-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl shadow-2xl p-10 border-8 border-white">
          <h1 className="text-6xl font-black text-center mb-10 text-purple-800 drop-shadow-lg">
            🎲 ポケモンすごろく 🎲
          </h1>
          <div className="text-center mb-8">
            <p className="text-2xl font-bold text-orange-700">みんなで たのしく あそぼう！</p>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black mb-6 text-center bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl">👥 だれが あそぶ？</h2>
              {playerNames.map((name, index) => (
                <div key={index} className="space-y-4 mb-6 p-6 bg-white rounded-2xl shadow-xl border-4 border-blue-300">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-blue-600 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      className="flex-1 px-6 py-4 border-4 border-purple-300 rounded-2xl text-2xl font-bold focus:border-yellow-400 focus:outline-none bg-gradient-to-r from-purple-100 to-pink-100"
                      placeholder={`${index + 1}ばんめの ひとの なまえ`}
                    />
                    {playerNames.length > 2 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="px-6 py-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-2xl hover:from-red-500 hover:to-red-700 transition-all font-black text-lg shadow-xl transform hover:scale-105"
                      >
                        🗑️ けす
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                      {playerAvatars[index] ? (
                        <Image
                          src={PokeApiService.getPokemonImageUrl(playerAvatars[index])}
                          alt={playerAvatars[index].name}
                          width={80}
                          height={80}
                          className="rounded-full bg-white p-2 border-4 border-yellow-400 shadow-xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-pokemon.svg';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl border-4 border-gray-300">
                          👤
                        </div>
                      )}
                      <div>
                        <div className="text-lg font-bold text-blue-700">
                          {playerAvatars[index] ? playerAvatars[index].name : 'ポケモンを えらんでね！'}
                        </div>
                        <div className="text-sm text-blue-600">あなたの ポケモン</div>
                      </div>
                    </div>
                    <button
                      onClick={() => openPokemonSelector(index)}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl hover:from-yellow-500 hover:to-orange-600 transition-all font-black text-lg shadow-xl transform hover:scale-105"
                    >
                      {playerAvatars[index] ? '🔄 かえる' : '🎮 えらぶ'}
                    </button>
                  </div>
                </div>
              ))}
              
              {playerNames.length < 4 && (
                <button
                  onClick={addPlayer}
                  className="w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-2xl hover:from-green-500 hover:to-blue-600 transition-all text-2xl font-black shadow-xl transform hover:scale-105"
                >
                  ➕ もっと なかまを ふやす
                </button>
              )}
            </div>

            <div className="space-y-6">
              <button
                onClick={() => setShowDifficultySelector(true)}
                className="w-full py-6 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-2xl hover:from-orange-500 hover:to-red-600 transition-all transform hover:scale-105 text-2xl font-black shadow-xl"
              >
                🎯 むずかしさを きめよう
              </button>
              
              <div className="text-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-4 border-purple-300">
                <div className="text-xl font-bold text-purple-700 mb-4">いまの せってい:</div>
                <div className="space-y-2 text-lg font-bold">
                  <div className="bg-white rounded-xl p-2">むずかしさ: <span className="text-purple-600">{
                    gameSettings.difficulty === 'easy' ? '🟢 かんたん' :
                    gameSettings.difficulty === 'normal' ? '🔵 ふつう' :
                    gameSettings.difficulty === 'hard' ? '🔴 むずかしい' : '⭐ とくべつ'
                  }</span></div>
                  <div className="bg-white rounded-xl p-2">サイコロ: <span className="text-blue-600">{gameSettings.diceMin}～{gameSettings.diceMax}</span></div>
                  <div className="bg-white rounded-xl p-2">コース: <span className="text-green-600">{gameSettings.boardSize}マス</span></div>
                </div>
              </div>
              
              <button
                onClick={openMapEditor}
                className="w-full py-6 bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-2xl hover:from-green-500 hover:to-teal-600 transition-all transform hover:scale-105 text-2xl font-black shadow-xl"
              >
                🎨 じぶんだけの すごろくを つくろう
              </button>
              
              {customBoard && (
                <div className="text-center bg-green-100 rounded-2xl p-4 border-4 border-green-400">
                  <div className="text-2xl font-black text-green-700">
                    ✅ あなただけの すごろくが できたよ！
                  </div>
                </div>
              )}
              
              <button
                onClick={startNewGame}
                className="w-full py-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-3xl hover:from-purple-500 hover:via-pink-600 hover:to-red-600 transition-all transform hover:scale-110 text-4xl font-black shadow-2xl border-4 border-white animate-pulse"
              >
                🚀 すごろく スタート！ 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 flex items-center justify-center">
        <div className="text-white text-4xl font-black animate-bounce">🎲 すごろくの じゅんびちゅう... 🎲</div>
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
              className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-2xl hover:from-green-500 hover:to-green-700 transition-all font-bold text-lg shadow-xl transform hover:scale-105"
            >
              🎨 すごろくをつくる
            </button>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-2xl hover:from-blue-500 hover:to-blue-700 transition-all font-bold text-lg shadow-xl transform hover:scale-105"
            >
              🆕 あたらしいゲーム
            </button>
          </div>
        </div>
      </div>

      {/* ゲーム盤面 */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
        {customBoard && customBoard.some(cell => cell.position) ? (
          <FreeFormGameBoard gameState={gameState} />
        ) : useCurvedBoard ? (
          <CurvedGameBoard gameState={gameState} />
        ) : (
          <GameBoard gameState={gameState} />
        )}
      </div>

      {/* プレイヤー情報とコントロール */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 現在のプレイヤー */}
          <div className="bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 rounded-2xl p-6 text-white shadow-2xl border-4 border-white">
            <h3 className="text-2xl font-black mb-4 text-center">🎯 いまのプレイヤー</h3>
            <div className="flex items-center gap-6">
              {currentPlayer.avatar && (
                <div className="relative">
                  <Image
                    src={PokeApiService.getPokemonImageUrl(currentPlayer.avatar)}
                    alt={currentPlayer.avatar.name}
                    width={80}
                    height={80}
                    className="rounded-full bg-white p-2 shadow-xl ring-4 ring-yellow-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-pokemon.svg';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                    {currentPlayer.avatar.name}
                  </div>
                </div>
              )}
              <div className="flex-1">
                <div className="text-3xl font-black mb-2 drop-shadow-lg">{currentPlayer.name}</div>
                <div className="text-xl font-bold bg-white bg-opacity-20 rounded-xl px-3 py-1 mb-2">
                  📍 {currentPlayer.position + 1}ばんめ
                </div>
                {currentPlayer.skipTurns > 0 && (
                  <div className="text-lg font-bold bg-red-500 bg-opacity-80 rounded-xl px-3 py-1 animate-pulse">
                    😴 あと{currentPlayer.skipTurns}かいおやすみ
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
                w-full py-6 rounded-2xl text-2xl font-black transition-all transform shadow-2xl border-4
                ${isRolling || gameState.gameEnded
                  ? 'bg-gray-300 border-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white border-white hover:scale-110 hover:rotate-2 animate-pulse'
                }
              `}
            >
              {isRolling ? '🎲 サイコロがまわってるよ...' : '🎲 サイコロをふろう！'}
            </button>
          </div>
        </div>

        {/* プレイヤー一覧 */}
        <div className="mt-8">
          <h3 className="text-2xl font-black mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl">👥 みんなのようす</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`
                  p-5 rounded-2xl border-4 transition-all shadow-xl
                  ${player.id === currentPlayer.id 
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-100 transform scale-110 shadow-2xl animate-pulse' 
                    : 'border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 hover:scale-105'
                  }
                `}
              >
                <div className="text-center">
                  {player.avatar && (
                    <div className="relative mb-3">
                      <Image
                        src={PokeApiService.getPokemonImageUrl(player.avatar, 'sprite')}
                        alt={player.avatar.name}
                        width={60}
                        height={60}
                        className="mx-auto rounded-full bg-white p-1 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-pokemon.svg';
                        }}
                      />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {player.avatar.name}
                      </div>
                    </div>
                  )}
                  <div className="font-black text-lg text-gray-800 mb-2">{player.name}</div>
                  <div className="text-base font-bold bg-white bg-opacity-60 rounded-lg px-2 py-1 text-blue-700">
                    📍 {player.position + 1}ばんめ
                  </div>
                  {player.skipTurns > 0 && (
                    <div className="text-sm font-bold text-red-600 bg-red-100 rounded-lg px-2 py-1 mt-2 animate-bounce">
                      😴 あと{player.skipTurns}かい おやすみ
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ゲーム終了時の表示 */}
        {gameState.gameEnded && gameState.winner && (
          <div className="mt-8 bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 rounded-3xl p-8 text-center border-8 border-white shadow-2xl">
            <div className="text-6xl mb-6 animate-bounce">🎉 おつかれさま！ 🎉</div>
            <div className="text-4xl font-black text-white mb-6 drop-shadow-lg">
              🏆 かったのは {gameState.winner.name} だよ！
            </div>
            {gameState.winner.avatar && (
              <Image
                src={PokeApiService.getPokemonImageUrl(gameState.winner.avatar)}
                alt={gameState.winner.avatar.name}
                width={150}
                height={150}
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