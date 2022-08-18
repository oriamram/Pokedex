import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

export class DbManager {
	client: Pool;

	constructor() {
		this.client = new Pool({
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false },
			idleTimeoutMillis: 72000000,
			connectionTimeoutMillis: 72000000,
			keepAlive: true,
			port: 5432,
		});
	}

	// Connects to the database
	async connect(): Promise<void> {
		await this.client.connect();
	}

	// Gets pokemons by given filters, adding the user's favorite pokemons if they match the filters (usable when favorites are not in the first 100 results)
	async getPokemonsByFilter(
		token: string,
		searchTerm: string,
		types: string[],
		combinedTypes: boolean,
		sortType: string,
		sortDirection: number,
		start: number
	): Promise<any[]> {
		let sql = "SELECT * FROM pokemons WHERE ";
		const values = [];
		if (!isNaN(+searchTerm)) {
			sql += `(name LIKE $${values.length + 1} OR id = $${values.length + 2}) `;
			values.push(`%${searchTerm}%`, +searchTerm);
		} else {
			sql += `name LIKE $${values.length + 1} `;
			values.push(`%${searchTerm}%`);
		}
		const stringifiedTypes = `[${types.map((type) => `"${type}"`).join(",")}]`;
		if (types.length > 0) {
			if (combinedTypes) {
				sql += `AND specs->'types' @> $${values.length + 1} `;
				values.push(stringifiedTypes);
			} else {
				sql += `AND ($${values.length + 1} @> (specs->'types')[0] OR $${values.length + 2} @> (specs->'types')[1]) `;
				values.push(stringifiedTypes, stringifiedTypes);
			}
		}
		sql += `ORDER BY $${values.length + 1} ${sortDirection === 1 ? "ASC" : " DESC"} OFFSET $${values.length + 2} LIMIT 100`;
		values.push(sortType, start);
		let matchingPokemons = (await this.client.query(sql, values)).rows;
		if (start === 0) {
			const favoritePokemons = await this.getFavoritePokemonsByFilters(token, searchTerm, types, combinedTypes, sortType, sortDirection);
			matchingPokemons = favoritePokemons.concat(this.removeFavoritesInMatchingPokemons(matchingPokemons, favoritePokemons));
		}
		return matchingPokemons;
	}

	// Gets the user's favorite pokemons by given filters
	private async getFavoritePokemonsByFilters(
		token: string,
		searchTerm: string,
		types: string[],
		combinedTypes: boolean,
		sortType: string,
		sortDirection: number
	): Promise<any[]> {
		const favoritePokemons = await this.getUserFavoritePokemons(token);
		const filteredFavoritePokemons = favoritePokemons.filter((pokemon) => {
			const checkSearchTerm = pokemon.name.includes(searchTerm) || pokemon.id === +searchTerm;
			let checkTypes = true;
			if (types.length > 0) {
				if (combinedTypes) {
					checkTypes = pokemon.specs.types.every((type) => types.includes(type));
				} else {
					checkTypes = pokemon.specs.types.some((type) => types.includes(type));
				}
			}
			return checkSearchTerm && checkTypes;
		});
		filteredFavoritePokemons.sort((a, b) => (a[sortType] > b[sortType] ? sortDirection : sortDirection * -1));
		return filteredFavoritePokemons;
	}

	// Removes the favorite pokemons instances in matching pokemons array (to avoid duplicates)
	private removeFavoritesInMatchingPokemons(matchingPokemons: any[], favoritePokemons: any[]): any[] {
		for (const favoritePokemon of favoritePokemons) {
			for (const matchingPokemon of matchingPokemons) {
				if (matchingPokemon.id === favoritePokemon.id) {
					matchingPokemons.splice(matchingPokemons.indexOf(matchingPokemon), 1);
					break;
				}
			}
		}
		return matchingPokemons;
	}

	// Gets a pokemon by its id
	async getPokemonById(id: number): Promise<any> {
		return (await this.client.query("SELECT * FROM pokemons WHERE id = $1", [id])).rows[0];
	}

	// Create a user with a generated token and returns the token
	async createUser(): Promise<string> {
		const token = uuidv4();
		await this.client.query("INSERT INTO users (token) VALUES ($1)", [token]);
		return token;
	}

	// Gets all the favorite pokemons of a user by his token
	async getUserFavoritePokemons(token: string): Promise<any> {
		const sql = `SELECT favorite_pokemons
		FROM users
		WHERE token = $1`;
		return (await this.client.query(sql, [token])).rows[0]["favorite_pokemons"];
	}

	// Add a favorite pokemons to a user by his token
	async addFavoriteToUser(token: string, pokemonId: number): Promise<void> {
		const pokemonJson = await this.getPokemonById(pokemonId);
		const sql = `UPDATE users
		SET favorite_pokemons = ARRAY_APPEND(favorite_pokemons, '${JSON.stringify(pokemonJson)}')
		WHERE token = $1`;
		await this.client.query(sql, [token]);
	}

	// Deletes a favorite pokemons from a user by his token
	async removeFavoriteFromUser(token: string, pokemonId: number): Promise<void> {
		const pokemonJson = await this.getPokemonById(pokemonId);
		const sql = `UPDATE users
		SET favorite_pokemons = ARRAY_REMOVE(favorite_pokemons,'${JSON.stringify(pokemonJson)}')
		WHERE token = $1`;
		await this.client.query(sql, [token]);
	}
}
