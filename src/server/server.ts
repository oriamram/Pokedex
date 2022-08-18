import express, { Request, Response, NextFunction } from "express";
import { json, text } from "body-parser";
import path from "path";
import { DbManager } from "./database";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const db = new DbManager();
// Connects to the database and starting the server afterwards
db.connect().then(() => {
	app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
});

app.use(text());
app.use(json());

// Serves static files
app.use(express.static(path.join(__dirname, "../client"), { extensions: ["html"] }));

// Middleware to log the requested URL and send a server error if database is not connected
app.use("*", (req: Request, res: Response, next: NextFunction) => {
	console.log(`${req.method}: ${req.originalUrl}`);
	next();
});

// GET request to get all the pokemons - options are passed in query
app.get("/api/pokemons/:token", async (req: Request, res: Response) => {
	const token = req.params.token;
	let searchTerm = "";
	if (req.query.searchTerm) {
		if (Array.isArray(req.query.searchTerm)) searchTerm = req.query.searchTerm.join("");
		else searchTerm = req.query.searchTerm as string;
	}
	let types = [];
	if (req.query.types) types = (req.query.types as string).split(",");
	const combinedTypes = req.query.combinedTypes === "true";
	let sortType = "id";
	if (req.query.sortType) {
		if (Array.isArray(req.query.sortType)) sortType = req.query.sortType.join("");
		else sortType = req.query.sortType as string;
		if (sortType !== "id" && sortType !== "name") sortType = "id";
	}
	let sortDirection = 1;
	if (req.query.sortDirection && !Array.isArray(req.query.sortDirection)) {
		sortDirection = +(req.query.sortDirection as string);
		if (sortDirection !== 1 && sortDirection !== -1) sortDirection = 1;
	}
	const start = req.query.start ? +req.query.start : 0;
	try {
		const pokemons = await db.getPokemonsByFilter(token, searchTerm, types, combinedTypes, sortType, sortDirection, start);
		res.json(pokemons);
	} catch (err) {
		console.log(err.message);
		res.status(500).send(err.message);
	}
});

// Get request to get a pokemon by id
app.get("/api/pokemon/:id", async (req: Request, res: Response) => {
	const id = +req.params.id;
	const pokemon = await db.getPokemonById(id);
	res.json(pokemon);
});

// GET request to create a new user and receive a token
app.get("/api/register", async (req: Request, res: Response) => {
	db.createUser()
		.then((token) => {
			console.log("User Created");
			res.send(token);
		})
		.catch((err) => {
			console.log(err.message);
			res.status(500).send(err.message);
		});
});

// GET request to get the user's current favorite pokemons
app.get("/api/favorites/:token", async (req: Request, res: Response) => {
	const token = req.params.token;
	const favoritePokemons = await db.getUserFavoritePokemons(token);
	res.json(favoritePokemons);
});

// POST request to add a new pokemon to a user's favorite pokemons
app.post("/api/favorites/:token", async (req: Request, res: Response) => {
	console.log(`Body: ${req.body}`);
	const token = req.params.token;
	const pokemonId = +req.body;
	await db.addFavoriteToUser(token, pokemonId);
	res.sendStatus(201);
});

// DELETE request to remove a pokemon from the user's favorite pokemons list
app.delete("/api/favorites/:token/:pokemonId", async (req: Request, res: Response) => {
	const token = req.params.token;
	const pokemonId = +req.params.pokemonId;
	await db.removeFavoriteFromUser(token, pokemonId);
	res.sendStatus(204);
});
