'use client';

import { useState, useEffect } from 'react';
import { Pokemon } from '@/types/pokemon';
import { PokeApiService } from '@/services/pokeapi';
import Image from 'next/image';

interface PokemonSelectorProps {
  onSelect: (pokemon: Pokemon) => void;
  onCancel: () => void;
  selectedPokemon?: Pokemon;
  title?: string;
}

export function PokemonSelector({ onSelect, onCancel, selectedPokemon, title = "ポケモンを選んでね！" }: PokemonSelectorProps) {
  const [popularPokemon, setPopularPokemon] = useState<Pokemon[]>([]);
  const [randomPokemon, setRandomPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'popular' | 'random'>('popular');

  // 人気のポケモンID（子供に人気の定番ポケモン）
  const popularIds = [25, 1, 4, 7, 39, 52, 104, 133, 143, 144, 145, 146, 150, 151, 155, 158, 161, 172, 179, 183, 196, 197, 246, 249, 250, 255, 258, 261, 280, 302];

  useEffect(() => {
    loadPokemon();
  }, []);

  const loadPokemon = async () => {
    setLoading(true);
    try {
      // 人気ポケモンを読み込み（最初の15匹）
      const popularPromises = popularIds.slice(0, 15).map(id => PokeApiService.getPokemon(id));
      const popularResults = await Promise.all(popularPromises);
      setPopularPokemon(popularResults.filter((p): p is Pokemon => p !== null));

      // ランダムポケモンを読み込み
      const randomResults = await PokeApiService.getMultiplePokemon(15);
      setRandomPokemon(randomResults);
    } catch (error) {
      console.error('Failed to load Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRandom = async () => {
    setLoading(true);
    try {
      const randomResults = await PokeApiService.getMultiplePokemon(15);
      setRandomPokemon(randomResults);
    } catch (error) {
      console.error('Failed to load random Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePokemonClick = (pokemon: Pokemon) => {
    onSelect(pokemon);
  };

  const currentPokemonList = activeTab === 'popular' ? popularPokemon : randomPokemon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          
          {selectedPokemon && (
            <div className="mt-4 flex items-center gap-4 bg-white bg-opacity-20 rounded-xl p-3">
              <Image
                src={PokeApiService.getPokemonImageUrl(selectedPokemon, 'sprite')}
                alt={selectedPokemon.name}
                width={48}
                height={48}
              />
              <span className="text-lg font-semibold">選択中: {selectedPokemon.name}</span>
            </div>
          )}
        </div>

        {/* タブ */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors ${
              activeTab === 'popular'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            🌟 人気のポケモン
          </button>
          <button
            onClick={() => setActiveTab('random')}
            className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors ${
              activeTab === 'random'
                ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-purple-500'
            }`}
          >
            🎲 ランダム
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-lg font-semibold text-gray-600">ポケモンを探しています...</span>
            </div>
          ) : (
            <>
              {activeTab === 'random' && (
                <div className="mb-4 text-center">
                  <button
                    onClick={refreshRandom}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-semibold"
                  >
                    🎲 他のポケモンを見る
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {currentPokemonList.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    onClick={() => handlePokemonClick(pokemon)}
                    className={`
                      bg-white border-2 rounded-xl p-4 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg
                      ${selectedPokemon?.id === pokemon.id 
                        ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-lg' 
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <Image
                          src={PokeApiService.getPokemonImageUrl(pokemon)}
                          alt={pokemon.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-800 capitalize truncate">
                        {pokemon.name}
                      </h3>
                      <p className="text-xs text-gray-500">#{pokemon.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
          >
            キャンセル
          </button>
          {selectedPokemon && (
            <button
              onClick={() => onSelect(selectedPokemon)}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
            >
              決定！
            </button>
          )}
        </div>
      </div>
    </div>
  );
}