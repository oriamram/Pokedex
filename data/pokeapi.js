"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const GET_POKEMON_URL = "https://pokeapi.co/api/v2/pokemon/";
const POKEMON_IMG_URL = "https://assets.pokemon.com/assets/cms2/img/pokedex/detail/";
const ORIGINAL_POKEMONS_PATH = path_1.default.join(__dirname, "originalPokemons.json");
const POKEMONS_AMOUNT = 151;
writePokemons();
function writePokemons() {
    return __awaiter(this, void 0, void 0, function* () {
        const pokemons = yield getAllPokemons();
        fs_1.default.writeFileSync(ORIGINAL_POKEMONS_PATH, JSON.stringify(pokemons));
    });
}
function getAllPokemons() {
    return __awaiter(this, void 0, void 0, function* () {
        const pokemons = [];
        for (let i = 1; i <= POKEMONS_AMOUNT; i++) {
            pokemons.push(yield getPokemon(i));
        }
        return pokemons;
    });
}
function getPokemon(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const pokemon = yield axios_1.default.get(GET_POKEMON_URL + id).then((res) => res.data);
        const pokemonSpecs = {
            types: pokemon.types.map((type) => type.type.name),
            height: pokemon.height / 10,
            weight: pokemon.weight / 10,
        };
        const pokemonData = {
            name: pokemon.species.name,
            id: pokemon.id,
            image: `${POKEMON_IMG_URL + "0".repeat(3 - String(id).length) + id}.png`,
            specs: pokemonSpecs,
        };
        return pokemonData;
    });
}
