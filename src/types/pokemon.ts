export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    front_shiny?: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  cries?: {
    latest?: string;
    legacy?: string;
  };
}

export interface PokemonResponse {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    front_shiny?: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  cries?: {
    latest?: string;
    legacy?: string;
  };
}