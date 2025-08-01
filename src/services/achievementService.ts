import { Achievement, PlayerStats, DEFAULT_ACHIEVEMENTS, AchievementNotification } from '@/types/achievements';
import { GameState, Player } from '@/types/game';
import { SoundService } from './soundService';

export class AchievementService {
  private static readonly STORAGE_KEY = 'sugoroku_player_stats';
  private static achievementListeners: ((achievement: Achievement) => void)[] = [];

  // 実績達成リスナーを追加
  static addAchievementListener(callback: (achievement: Achievement) => void): void {
    this.achievementListeners.push(callback);
  }

  // 実績達成リスナーを削除
  static removeAchievementListener(callback: (achievement: Achievement) => void): void {
    const index = this.achievementListeners.indexOf(callback);
    if (index > -1) {
      this.achievementListeners.splice(index, 1);
    }
  }

  // 実績達成を通知
  private static notifyAchievement(achievement: Achievement): void {
    this.achievementListeners.forEach(callback => callback(achievement));
    
    // 効果音を再生
    SoundService.playVictorySound();
    
    // 読み上げ
    SoundService.speakText(`実績解除！${achievement.name}`);
  }

  // プレイヤー統計を取得
  static getPlayerStats(): PlayerStats {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Set を復元
        parsed.pokemonEncountered = new Set(parsed.pokemonEncountered || []);
        // 日付を復元
        parsed.lastPlayed = new Date(parsed.lastPlayed);
        parsed.firstPlayDate = new Date(parsed.firstPlayDate);
        // 実績の日付を復元
        parsed.achievements = parsed.achievements.map((ach: Achievement & { unlockedAt?: string }) => ({
          ...ach,
          unlockedAt: ach.unlockedAt ? new Date(ach.unlockedAt) : undefined
        }));
        return parsed;
      } catch (error) {
        console.error('Failed to parse player stats:', error);
      }
    }

    // 初回の場合はデフォルト値を返す
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalMoves: 0,
      specialCellsLanded: 0,
      pokemonEncountered: new Set(),
      longestWinStreak: 0,
      currentWinStreak: 0,
      fastestWin: null,
      achievements: [...DEFAULT_ACHIEVEMENTS],
      lastPlayed: new Date(),
      firstPlayDate: new Date()
    };
  }

  // プレイヤー統計を保存
  static savePlayerStats(stats: PlayerStats): void {
    const toSave = {
      ...stats,
      pokemonEncountered: Array.from(stats.pokemonEncountered),
      achievements: stats.achievements.map(ach => ({
        ...ach,
        unlockedAt: ach.unlockedAt?.toISOString()
      }))
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
  }

  // ゲーム開始時の処理
  static onGameStart(): Achievement[] {
    const stats = this.getPlayerStats();
    const newAchievements: Achievement[] = [];

    // 初回プレイ実績
    if (stats.gamesPlayed === 0) {
      const achievement = stats.achievements.find(a => a.id === 'first_game');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    stats.gamesPlayed++;
    stats.lastPlayed = new Date();

    this.savePlayerStats(stats);

    // 新しい実績を通知
    newAchievements.forEach(achievement => {
      setTimeout(() => this.notifyAchievement(achievement), 1000);
    });

    return newAchievements;
  }

  // ゲーム終了時の処理
  static onGameEnd(gameState: GameState, moves: number): Achievement[] {
    const stats = this.getPlayerStats();
    const newAchievements: Achievement[] = [];
    const winner = gameState.winner;

    stats.totalMoves += moves;

    if (winner) {
      stats.gamesWon++;
      stats.currentWinStreak++;
      
      if (stats.currentWinStreak > stats.longestWinStreak) {
        stats.longestWinStreak = stats.currentWinStreak;
      }

      // 最速勝利記録
      if (!stats.fastestWin || moves < stats.fastestWin) {
        stats.fastestWin = moves;
      }

      // 初勝利実績
      if (stats.gamesWon === 1) {
        const achievement = stats.achievements.find(a => a.id === 'first_win');
        if (achievement && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          newAchievements.push(achievement);
        }
      }

      // 連勝実績
      if (stats.currentWinStreak === 3) {
        const achievement = stats.achievements.find(a => a.id === 'win_streak_3');
        if (achievement && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          newAchievements.push(achievement);
        }
      }

      if (stats.currentWinStreak === 5) {
        const achievement = stats.achievements.find(a => a.id === 'win_streak_5');
        if (achievement && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          newAchievements.push(achievement);
        }
      }

      // スピードラン実績
      if (moves <= 10) {
        const achievement = stats.achievements.find(a => a.id === 'speed_runner');
        if (achievement && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          newAchievements.push(achievement);
        }
      }
    } else {
      stats.currentWinStreak = 0;
    }

    // ポケモンコレクション実績
    if (stats.pokemonEncountered.size >= 50) {
      const achievement = stats.achievements.find(a => a.id === 'pokemon_collector');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    if (stats.pokemonEncountered.size >= 100) {
      const achievement = stats.achievements.find(a => a.id === 'pokemon_master');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    // 熱心なプレイヤー実績
    if (stats.gamesPlayed >= 100) {
      const achievement = stats.achievements.find(a => a.id === 'dedicated_player');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    this.savePlayerStats(stats);

    // 新しい実績を通知
    newAchievements.forEach((achievement, index) => {
      setTimeout(() => this.notifyAchievement(achievement), (index + 1) * 2000);
    });

    return newAchievements;
  }

  // ポケモンに出会った時の処理
  static onPokemonEncounter(pokemonId: number): Achievement[] {
    const stats = this.getPlayerStats();
    const newAchievements: Achievement[] = [];

    stats.pokemonEncountered.add(pokemonId);

    // ポケモンコレクション実績チェック
    if (stats.pokemonEncountered.size === 50) {
      const achievement = stats.achievements.find(a => a.id === 'pokemon_collector');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    if (stats.pokemonEncountered.size === 100) {
      const achievement = stats.achievements.find(a => a.id === 'pokemon_master');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    this.savePlayerStats(stats);

    // 新しい実績を通知
    newAchievements.forEach(achievement => {
      setTimeout(() => this.notifyAchievement(achievement), 1000);
    });

    return newAchievements;
  }

  // カスタムマップ作成時の処理
  static onCustomMapCreated(): Achievement[] {
    const stats = this.getPlayerStats();
    const newAchievements: Achievement[] = [];

    const achievement = stats.achievements.find(a => a.id === 'map_creator');
    if (achievement && !achievement.isUnlocked) {
      achievement.isUnlocked = true;
      achievement.unlockedAt = new Date();
      newAchievements.push(achievement);
    }

    this.savePlayerStats(stats);

    // 新しい実績を通知
    newAchievements.forEach(achievement => {
      setTimeout(() => this.notifyAchievement(achievement), 500);
    });

    return newAchievements;
  }

  // 特殊マスに止まった時の処理
  static onSpecialCellLanded(cellType: string): Achievement[] {
    const stats = this.getPlayerStats();
    const newAchievements: Achievement[] = [];

    stats.specialCellsLanded++;

    // ワープマスター実績（仮のカウント、実際にはワープマス専用のカウントが必要）
    if (cellType === 'warp' && stats.specialCellsLanded >= 10) {
      const achievement = stats.achievements.find(a => a.id === 'warp_master');
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
      }
    }

    this.savePlayerStats(stats);

    // 新しい実績を通知
    newAchievements.forEach(achievement => {
      setTimeout(() => this.notifyAchievement(achievement), 500);
    });

    return newAchievements;
  }

  // 実績の進捗を取得
  static getAchievementProgress(): { [key: string]: number } {
    const stats = this.getPlayerStats();
    return {
      games_played: stats.gamesPlayed,
      games_won: stats.gamesWon,
      win_streak: stats.currentWinStreak,
      longest_win_streak: stats.longestWinStreak,
      pokemon_encountered: stats.pokemonEncountered.size,
      fastest_win: stats.fastestWin || 999
    };
  }

  // 実績をリセット（デバッグ用）
  static resetAchievements(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}