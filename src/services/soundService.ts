import { Pokemon } from '@/types/pokemon';
import { PokeApiService } from './pokeapi';

export class SoundService {
  private static audioContext: AudioContext | null = null;
  private static isMuted = false;

  static async initialize() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
  }

  static setMute(muted: boolean) {
    this.isMuted = muted;
  }

  static isMutedState(): boolean {
    return this.isMuted;
  }

  // ポケモンの鳴き声を再生
  static async playPokemonCry(pokemon: Pokemon): Promise<void> {
    if (this.isMuted) return;
    
    const cryUrl = PokeApiService.getPokemonCryUrl(pokemon);
    if (!cryUrl) return;

    try {
      const audio = new Audio(cryUrl);
      audio.volume = 0.5;
      await audio.play();
    } catch (error) {
      console.warn('Failed to play Pokemon cry:', error);
    }
  }

  // サイコロ音効果
  static async playDiceRoll(): Promise<void> {
    if (this.isMuted) return;
    this.playBeep(440, 0.1); // A4音程で短いビープ
  }

  // 効果音：進む
  static async playAdvanceSound(): Promise<void> {
    if (this.isMuted) return;
    this.playBeep(523, 0.2); // C5音程
  }

  // 効果音：戻る
  static async playBackSound(): Promise<void> {
    if (this.isMuted) return;
    this.playBeep(262, 0.3); // C4音程
  }

  // 効果音：休み
  static async playSkipSound(): Promise<void> {
    if (this.isMuted) return;
    this.playBeep(220, 0.5); // A3音程
  }

  // 効果音：ワープ
  static async playWarpSound(): Promise<void> {
    if (this.isMuted) return;
    // ワープ音：周波数が上がっていく音
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playBeep(200 + (i * 100), 0.1);
      }, i * 50);
    }
  }

  // 勝利音
  static async playVictorySound(): Promise<void> {
    if (this.isMuted) return;
    const notes = [523, 659, 784, 1047]; // C-E-G-C
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => {
        this.playBeep(notes[i], 0.3);
      }, i * 200);
    }
  }

  // 基本的なビープ音
  private static playBeep(frequency: number, duration: number): void {
    if (!this.audioContext) {
      this.initialize();
    }
    
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // テキスト読み上げ機能
  static speakText(text: string, lang: string = 'ja-JP'): void {
    if (this.isMuted) return;
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      utterance.volume = 0.7;

      window.speechSynthesis.speak(utterance);
    }
  }

  // ランダムな応援メッセージを読み上げ
  static speakEncouragement(): void {
    const messages = [
      'がんばって！',
      'いいぞ！',
      'すごいね！',
      'ナイス！',
      'やったね！',
      'がんばれ〜！'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    this.speakText(randomMessage);
  }

  // BGM機能（将来の拡張用）
  static async playBackgroundMusic(url: string, loop: boolean = true): Promise<HTMLAudioElement | null> {
    if (this.isMuted) return null;

    try {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.volume = 0.3;
      await audio.play();
      return audio;
    } catch (error) {
      console.warn('Failed to play background music:', error);
      return null;
    }
  }

  // 音量調整
  static adjustVolume(audio: HTMLAudioElement, volume: number): void {
    audio.volume = Math.max(0, Math.min(1, volume));
  }
}