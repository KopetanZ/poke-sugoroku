import { Pokemon, PokemonResponse } from '@/types/pokemon';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export class PokeApiService {
  static async getPokemon(id: number): Promise<Pokemon | null> {
    try {
      const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon ${id}`);
      }
      const data: PokemonResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
      return null;
    }
  }

  static async getRandomPokemon(): Promise<Pokemon | null> {
    const randomId = Math.floor(Math.random() * 1010) + 1; // Gen 1-9 Pokemon
    return this.getPokemon(randomId);
  }

  static async getMultiplePokemon(count: number): Promise<Pokemon[]> {
    const promises = Array.from({ length: count }, () => this.getRandomPokemon());
    const results = await Promise.all(promises);
    return results.filter((pokemon): pokemon is Pokemon => pokemon !== null);
  }

  static getPokemonImageUrl(pokemon: Pokemon, type: 'artwork' | 'sprite' = 'artwork'): string {
    if (type === 'artwork') {
      return pokemon.sprites.other['official-artwork'].front_default;
    }
    return pokemon.sprites.front_default;
  }

  static getPokemonCryUrl(pokemon: Pokemon): string | null {
    return pokemon.cries?.latest || pokemon.cries?.legacy || null;
  }
}