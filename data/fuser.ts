import fs from "fs";
import path from "path";
import { PokemonData } from "./interface";

const ORIGINAL_POKEMONS_PATH = path.join(__dirname, "originalPokemons.json");
const FUSED_POKEMONS_PATH = path.join(__dirname, "fusedPokemons.json");
const ALL_POKEMONS_PATH = path.join(__dirname, "allPokemons.json");

const fusedImage = (id1: number, id2: number): string => `https://images.alexonsager.net/pokemon/fused/${id1}/${id1}.${id2}.png`;

const originalPokemons: PokemonData[] = JSON.parse(fs.readFileSync(ORIGINAL_POKEMONS_PATH, "utf8"));
const fusedPokemons: PokemonData[] = [];

fuseAllPokemons();
fs.writeFileSync(FUSED_POKEMONS_PATH, JSON.stringify(fusedPokemons));
fs.writeFileSync(ALL_POKEMONS_PATH, JSON.stringify(originalPokemons.concat(fusedPokemons)));

function fuseAllPokemons(): void {
	for (let i = 0; i < originalPokemons.length; i++) {
		for (let j = i + 1; j < originalPokemons.length; j++) {
			const newId = originalPokemons.length + fusedPokemons.length + 1;
			fusedPokemons.push(fuseTwoPokemons(originalPokemons[i], originalPokemons[j], newId));
		}
	}
}

function fuseTwoPokemons(pokemon1: PokemonData, pokemon2: PokemonData, newId: number): PokemonData {
	const newName = pokemon1.name.slice(0, Math.floor(pokemon1.name.length / 2)) + pokemon2.name.slice(Math.floor(pokemon2.name.length / 2), pokemon2.name.length);
	const pokemon1Types = pokemon1.specs.types;
	const pokemon2Types = pokemon2.specs.types;
	const newTypes = [pokemon1Types[0]];
	if (pokemon2Types.every((type) => type === newTypes[0])) {
		if (pokemon1Types[1] && !pokemon2Types.every((type) => type === pokemon1Types[1])) {
			newTypes[0] = pokemon1Types[1];
			newTypes[1] = pokemon2Types[0] !== newTypes[0] ? pokemon2Types[0] : pokemon2Types[1];
		}
	} else {
		newTypes.push(pokemon2Types[0] !== newTypes[0] ? pokemon2Types[0] : pokemon2Types[1]);
	}
	const fusedPokemon: PokemonData = {
		name: newName,
		id: newId,
		image: fusedImage(pokemon1.id, pokemon2.id),
		specs: {
			types: newTypes,
			height: +((pokemon1.specs.height + pokemon2.specs.height) / 2).toFixed(1),
			weight: +((pokemon1.specs.weight + pokemon2.specs.weight) / 2).toFixed(1),
		},
	};
	return fusedPokemon;
}
