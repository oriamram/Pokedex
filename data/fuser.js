"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ORIGINAL_POKEMONS_PATH = path_1.default.join(__dirname, "originalPokemons.json");
const FUSED_POKEMONS_PATH = path_1.default.join(__dirname, "fusedPokemons.json");
const ALL_POKEMONS_PATH = path_1.default.join(__dirname, "allPokemons.json");
const fusedImage = (id1, id2) => `https://images.alexonsager.net/pokemon/fused/${id1}/${id1}.${id2}.png`;
const originalPokemons = JSON.parse(fs_1.default.readFileSync(ORIGINAL_POKEMONS_PATH, "utf8"));
const fusedPokemons = [];
fuseAllPokemons();
fs_1.default.writeFileSync(FUSED_POKEMONS_PATH, JSON.stringify(fusedPokemons));
fs_1.default.writeFileSync(ALL_POKEMONS_PATH, JSON.stringify(originalPokemons.concat(fusedPokemons)));
function fuseAllPokemons() {
    for (let i = 0; i < originalPokemons.length; i++) {
        for (let j = i + 1; j < originalPokemons.length; j++) {
            const newId = originalPokemons.length + fusedPokemons.length + 1;
            fusedPokemons.push(fuseTwoPokemons(originalPokemons[i], originalPokemons[j], newId));
        }
    }
}
function fuseTwoPokemons(pokemon1, pokemon2, newId) {
    const newName = pokemon1.name.slice(0, Math.floor(pokemon1.name.length / 2)) + pokemon2.name.slice(Math.floor(pokemon2.name.length / 2), pokemon2.name.length);
    const pokemon1Types = pokemon1.specs.types;
    const pokemon2Types = pokemon2.specs.types;
    const newTypes = [pokemon1Types[0]];
    if (pokemon2Types.every((type) => type === newTypes[0])) {
        if (pokemon1Types[1] && !pokemon2Types.every((type) => type === pokemon1Types[1])) {
            newTypes[0] = pokemon1Types[1];
            newTypes[1] = pokemon2Types[0] !== newTypes[0] ? pokemon2Types[0] : pokemon2Types[1];
        }
    }
    else {
        newTypes.push(pokemon2Types[0] !== newTypes[0] ? pokemon2Types[0] : pokemon2Types[1]);
    }
    const fusedPokemon = {
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
