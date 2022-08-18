const { DbManager } = require("../dist/server/dataBase.js");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv").config();

const db = new DbManager();

async function createPokemonsTable() {
	await db.client.query(`CREATE TABLE IF NOT EXISTS pokemons (
		id INT PRIMARY KEY,
		name VARCHAR(50) NOT NULL,
		img TEXT NOT NULL,
		specs JSONB NOT NULL
	)`);
}

async function addAllPokemons() {
	const allPokemonsPath = path.join(__dirname, "allPokemons.json");
	const allPokemons = JSON.parse(fs.readFileSync(allPokemonsPath, "utf8")).slice(0, 8000);
	let sql = "INSERT INTO pokemons (name, id, img, specs) VALUES ";
	for (let i = 0; i < allPokemons.length; i++) {
		const offset = i * 4;
		sql += `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4}),`;
	}
	sql = sql.slice(0, -1);
	const pokemonValues = allPokemons.map((pokemon) => Object.values(pokemon));
	await db.client.query(sql, pokemonValues.flat());
}

db.init()
	.then(async () => {
		await createPokemonsTable();
		await addAllPokemons();
		db.client.end();
	})
	.catch((err) => {
		console.log(err.message);
		db.client.end();
	});
