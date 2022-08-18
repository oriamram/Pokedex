export interface PokemonData {
	name: string;
	id: number;
	image: string;
	specs: PokemonSpecs;
}

export interface PokemonSpecs {
	types: string[];
	height: number;
	weight: number;
}
