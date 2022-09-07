const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv").config();
const { Client } = require("pg");

const DB_ROWS_LIMIT = 8000;

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

client.connect().then(async () => {
	try {
		console.log("drop tables");
		await dropTables();
		console.log("create pokemons");
		await createPokemonsTable();
		console.log("create users");
		await createUsersTable();
		console.log("insert pokemons");
		await insertPokemons();
		console.log("done successfully");
		client.end();
	} catch (e) {
		console.log(e.message);
		client.end();
	}
});

async function dropTables() {
	await client.query("DROP TABLE IF EXISTS pokemons");
	await client.query("DROP TABLE IF EXISTS users");
}

async function createPokemonsTable() {
	await client.query(`CREATE TABLE IF NOT EXISTS pokemons (
		id INT PRIMARY KEY,
		name VARCHAR(50) NOT NULL,
		image TEXT NOT NULL,
		specs JSONB NOT NULL
	)`);
}

async function createUsersTable() {
	await client.query(`CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		"token" text NOT NULL,
		favorite_pokemons _jsonb NULL DEFAULT '{}'::jsonb[])`);
}

async function insertPokemons() {
	const allPokemonsPath = path.join(__dirname, "allPokemons.json");
	const allPokemons = JSON.parse(fs.readFileSync(allPokemonsPath, "utf8")).slice(0, DB_ROWS_LIMIT);
	let sql = "INSERT INTO pokemons (name, id, image, specs) VALUES ";
	for (let i = 0; i < allPokemons.length; i++) {
		const offset = i * 4;
		sql += `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4}),`;
	}
	sql = sql.slice(0, -1);
	const pokemonValues = allPokemons.map((pokemon) => Object.values(pokemon));
	await client.query(sql, pokemonValues.flat());
}
