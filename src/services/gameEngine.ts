import { GameState, Player, Cell, CellType, GameSettings, DIFFICULTY_PRESETS, DifficultyLevel } from '@/types/game';
import { PokeApiService } from './pokeapi';

export class GameEngine {
  static createDefaultBoard(size: number = 30, specialCellFrequency: number = 0.25): Cell[] {
    const board: Cell[] = [];
    
    // スタート
    board.push({
      id: 0,
      type: 'start',
      message: 'スタート！がんばって！'
    });

    // 通常マス + 特殊マス
    for (let i = 1; i < size - 1; i++) {
      let type: CellType = 'normal';
      let value: number | undefined;
      let warpTo: number | undefined;
      let message = '';

      // 特殊マスをランダムに配置（難易度に応じて頻度調整）
      const random = Math.random();
      if (random < specialCellFrequency * 0.4) {
        type = 'skip';
        value = Math.floor(Math.random() * 2) + 1; // 1-2回休み
        message = `${value}回休み！`;
      } else if (random < specialCellFrequency * 0.6) {
        type = 'advance';
        value = Math.floor(Math.random() * 3) + 2; // 2-4マス進む
        message = `${value}マス進む！`;
      } else if (random < specialCellFrequency * 0.8) {
        type = 'back';
        value = Math.floor(Math.random() * 3) + 1; // 1-3マス戻る
        message = `${value}マス戻る...`;
      } else if (random < specialCellFrequency && i > 5 && i < size - 5) {
        type = 'warp';
        warpTo = Math.floor(Math.random() * (size - 10)) + 5;
        message = `ワープ！${warpTo}番目のマスへ！`;
      } else {
        message = 'がんばって！';
      }

      board.push({
        id: i,
        type,
        value,
        warpTo,
        message
      });
    }

    // ゴール
    board.push({
      id: size - 1,
      type: 'goal',
      message: 'ゴール！おめでとう！🎉'
    });

    return board;
  }

  static async createGame(playerNames: string[], settings?: Partial<GameSettings>): Promise<GameState> {
    const defaultSettings: GameSettings = {
      boardSize: 30,
      maxPlayers: 4,
      diceMin: 1,
      diceMax: 6,
      usePokemonAvatars: true,
      playSound: true,
      difficulty: 'normal',
      specialCellFrequency: 0.25
    };

    const gameSettings = { ...defaultSettings, ...settings };
    
    // 難易度プリセットを適用
    if (gameSettings.difficulty !== 'custom') {
      Object.assign(gameSettings, DIFFICULTY_PRESETS[gameSettings.difficulty]);
    }
    const players: Player[] = [];
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
    
    // プレイヤーにポケモンアバターを割り当て
    const pokemonAvatars = await PokeApiService.getMultiplePokemon(playerNames.length);
    
    for (let i = 0; i < playerNames.length; i++) {
      players.push({
        id: `player-${i}`,
        name: playerNames[i],
        position: 0,
        skipTurns: 0,
        color: colors[i] || 'bg-gray-500',
        avatar: pokemonAvatars[i]
      });
    }

    const board = await this.populateBoardWithPokemon(
      this.createDefaultBoard(gameSettings.boardSize, gameSettings.specialCellFrequency)
    );

    return {
      id: `game-${Date.now()}`,
      players,
      currentPlayerIndex: 0,
      board,
      gameStarted: false,
      gameEnded: false
    };
  }

  static rollDice(min: number = 1, max: number = 6): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static async makeMove(gameState: GameState, diceValue: number): Promise<GameState> {
    if (gameState.gameEnded) return gameState;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // スキップターンのチェック
    if (currentPlayer.skipTurns > 0) {
      currentPlayer.skipTurns--;
      return {
        ...gameState,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
        diceValue
      };
    }

    const oldPosition = currentPlayer.position;
    let newPosition = oldPosition + diceValue;

    // ゴールを超えた場合の処理
    if (newPosition >= gameState.board.length - 1) {
      newPosition = gameState.board.length - 1;
    }

    currentPlayer.position = newPosition;
    
    const currentCell = gameState.board[newPosition];
    
    // 特殊マスの効果を適用
    const finalPosition = await this.applyCellEffect(gameState, currentPlayer, currentCell);
    currentPlayer.position = finalPosition;

    // ゴールチェック
    const gameEnded = finalPosition >= gameState.board.length - 1;
    const winner = gameEnded ? currentPlayer : undefined;

    return {
      ...gameState,
      currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      gameEnded,
      winner,
      diceValue,
      lastMove: {
        from: oldPosition,
        to: finalPosition,
        player: currentPlayer,
        timestamp: new Date()
      }
    };
  }

  private static async applyCellEffect(gameState: GameState, player: Player, cell: Cell): Promise<number> {
    let newPosition = player.position;

    switch (cell.type) {
      case 'skip':
        player.skipTurns = cell.value || 1;
        break;
      case 'advance':
        newPosition = Math.min(player.position + (cell.value || 2), gameState.board.length - 1);
        break;
      case 'back':
        newPosition = Math.max(player.position - (cell.value || 1), 0);
        break;
      case 'warp':
        if (cell.warpTo !== undefined) {
          newPosition = cell.warpTo;
        }
        break;
      case 'floating_island':
        // 浮島エリアに入った - 特別な処理は特になし
        // プレイヤーは浮島エリア内を移動可能
        break;
      case 'island_exit':
        // 浮島脱出 - 指定された戻り先へ
        if (cell.returnTo !== undefined) {
          newPosition = cell.returnTo;
        }
        break;
    }

    return newPosition;
  }

  private static async populateBoardWithPokemon(board: Cell[]): Promise<Cell[]> {
    const pokemon = await PokeApiService.getMultiplePokemon(Math.floor(board.length / 3));
    
    return board.map((cell, index) => {
      if (index % 3 === 0 && pokemon.length > Math.floor(index / 3)) {
        return {
          ...cell,
          pokemon: pokemon[Math.floor(index / 3)]
        };
      }
      return cell;
    });
  }
}