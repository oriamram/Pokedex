import { Pokemon, PokemonData } from "./pokemon";

const REGISTER_URL = "api/register";
let GET_POKEMONS_URL = "/api/pokemons/<token>";
let GET_FAVORITES_URL = "/api/favorites/<token>";
let ADD_FAVORITE_URL = "api/favorites/<token>";
let DELETE_FAVORITE_URL = "api/favorites/<token>/<pokemonId>";

const cardsContainer = document.getElementById("cards-container");
const searchBox = document.getElementById("search-box") as HTMLInputElement;
const combinedTypes = document.getElementById("combined-types") as HTMLInputElement;
const notFound = document.getElementById("not-found");
const loader = document.getElementById("loader");

let pokemons: Pokemon[] = [];

const pokemonsCollectiveMethods = {
	render: (): void => pokemons.forEach((pokemon) => pokemon.render(cardsContainer)),
	remove: (): void => pokemons.forEach((pokemon) => pokemon.unrender()),
	show: (): void => pokemons.forEach((pokemon) => pokemon.show()),
	hide: (): void => pokemons.forEach((pokemon) => pokemon.hide()),
};

const filters: string[] = [];
let favoritePokemons: PokemonData[] = [];
let lastSort: ["id" | "name", "ascending" | "descending"] = ["id", "ascending"];
let currentPokemonsUrl = GET_POKEMONS_URL;
let noMorePokemons = false;

loadPage();

// Renders all the pokemons, getting the starred pokemon and initializes all the event listeners
async function loadPage(): Promise<void> {
	loader.classList.add("active");
	let pokedexToken: string;
	if (localStorage.getItem("pokedexToken")) {
		pokedexToken = localStorage.getItem("pokedexToken");
	} else {
		pokedexToken = await fetchText(REGISTER_URL);
		localStorage.setItem("pokedexToken", pokedexToken);
	}
	GET_POKEMONS_URL = GET_POKEMONS_URL.replace("<token>", pokedexToken);
	GET_FAVORITES_URL = GET_FAVORITES_URL.replace("<token>", pokedexToken);
	ADD_FAVORITE_URL = ADD_FAVORITE_URL.replace("<token>", pokedexToken);
	DELETE_FAVORITE_URL = DELETE_FAVORITE_URL.replace("<token>", pokedexToken);
	await createPokemons();
	initializeEventListeners();
	loader.classList.remove("active");
	pokemonsCollectiveMethods.render();
	favoritePokemons = await fetchJson(GET_FAVORITES_URL);
	initializeStarListeners();
	markFavoritePokemons();
}

// Initializes the event listeners of the different buttons in the page
function initializeEventListeners(): void {
	// Search button and Enter Key
	const searchButton = document.getElementById("search-button");
	searchButton.addEventListener("click", applyAllFilters);
	document.addEventListener("keydown", (e) => {
		if (e.code === "Enter" && document.activeElement === searchBox) applyAllFilters();
	});
	// Side menu toggler
	const sideMenuToggler = document.getElementById("side-menu-toggler");
	sideMenuToggler.addEventListener("click", () => {
		document.getElementById("side-menu").classList.toggle("active");
	});
	// Sorter
	const sorter = document.getElementById("sorter") as HTMLSelectElement;
	sorter.addEventListener("change", () => {
		const sortRequest = sorter.value.split("-") as ["id" | "name", "ascending" | "descending"];
		lastSort = sortRequest;
		applyAllFilters();
	});
	// Type filters
	document.querySelectorAll(".type-filter").forEach((element) =>
		element.addEventListener("click", () => {
			element.classList.toggle(element.innerHTML);
			if (filters.indexOf(element.innerHTML) === -1) filters.push(element.innerHTML);
			else filters.splice(filters.indexOf(element.innerHTML), 1);
			applyAllFilters();
		})
	);
	// Combined Types
	combinedTypes.addEventListener("click", applyAllFilters);
}

// Gets all the pokemons from the server and saves them
async function createPokemons(): Promise<void> {
	const serverPokemonsData: PokemonData[] = await fetchJson(GET_POKEMONS_URL);
	pokemons = serverPokemonsData.map((pokemonData) => new Pokemon(pokemonData));
}

// Applying all the filters
async function applyAllFilters(): Promise<void> {
	pokemonsCollectiveMethods.remove();
	notFound.classList.remove("active");
	loader.classList.add("active");
	buildUrl();
	const pokemonsData: PokemonData[] = await fetchJson(currentPokemonsUrl);
	pokemons = pokemonsData.map((pokemonData) => new Pokemon(pokemonData));
	loader.classList.remove("active");
	pokemonsCollectiveMethods.render();
	checkIfNotFound();
	initializeStarListeners();
	markFavoritePokemons();
}

// Builds the url to fetch the pokemons with the right queries
function buildUrl(start = 0): void {
	currentPokemonsUrl = `${GET_POKEMONS_URL}?start=${start}&`;
	sortPokemons(lastSort[0], lastSort[1]);
	filterPokemons();
	searchPokemons();
	if (currentPokemonsUrl[currentPokemonsUrl.length - 1] === "&") currentPokemonsUrl = currentPokemonsUrl.slice(0, -1);
	noMorePokemons = false;
}

// Adds the sort type and sort direction to the url that fetches pokemons
function sortPokemons(sortType: "id" | "name", direction: "ascending" | "descending"): void {
	const directionNumber = direction === "ascending" ? 1 : -1;
	currentPokemonsUrl += `sortType=${sortType}&sortDirection=${directionNumber}&`;
}

// Adds the active filter types and if combined types is checked to the url that fetches pokemons
function filterPokemons(): void {
	if (filters.length > 0) currentPokemonsUrl += `types=${filters.join(",")}&`;
	if (combinedTypes.checked) currentPokemonsUrl += "combinedTypes=true&";
}

// Adds the search term to the url that fetches pokemons
function searchPokemons(): void {
	const searchTerm = searchBox.value.toLowerCase();
	if (!searchTerm) return;
	else currentPokemonsUrl += `searchTerm=${searchTerm}&`;
}

// Displaying not found message if needed after every filter or search
function checkIfNotFound(): void {
	if (pokemons.length === 0) notFound.classList.add("active");
	else notFound.classList.remove("active");
}

// Sets the event listeners for the star buttons of each pokemon
function initializeStarListeners(): void {
	const stars = [...document.getElementsByClassName("star")];
	stars.forEach((star, index) =>
		star.addEventListener("click", (e) => {
			e.stopPropagation();
			if (star.classList.contains("active")) {
				deleteFavoritePokemon(pokemons[index]);
				favoritePokemons.splice(favoritePokemons.indexOf(pokemons[index].data), 1);
				cardsContainer.insertBefore(pokemons[index].element, pokemons[index + 1].element);
			} else {
				addFavoritePokemon(pokemons[index]);
				favoritePokemons.push(pokemons[index].data);
				pokemons[0].element.before(pokemons[index].element);
				window.scroll({ top: 0, left: 0, behavior: "smooth" });
			}
			star.classList.toggle("active");
		})
	);
}

// Makes the favorite pokemons be visible to the user as favorites
function markFavoritePokemons(): void {
	favoritePokemons.forEach((favoritePokemon) => {
		const matchedPokemon = pokemons.find((pokemon) => pokemon.data.id === favoritePokemon.id);
		if (matchedPokemon) matchedPokemon.element.querySelector(".star").classList.add("active");
	});
}

// Updating the currently starred Pokemon
function addFavoritePokemon(pokemon: Pokemon): void {
	fetch(ADD_FAVORITE_URL, {
		method: "POST",
		body: String(pokemon.data.id),
	});
}

// Deleting the currently starred Pokemon
function deleteFavoritePokemon(pokemon: Pokemon): void {
	const url = DELETE_FAVORITE_URL.replace("<pokemonId>", String(pokemon.data.id));
	fetch(url, { method: "DELETE" });
}

// Getting json from fetch
async function fetchJson(url: string): Promise<any> {
	return await fetch(url).then((res) => res.json());
}

// Getting text from fetch
async function fetchText(url: string): Promise<any> {
	return await fetch(url).then((res) => res.text());
}

// Loads more pokemons when scrolling to bottom
window.onscroll = async function (): Promise<void> {
	if (!noMorePokemons && !loader.classList.contains("active") && window.innerHeight + window.scrollY + 50 >= document.body.scrollHeight) {
		loader.classList.add("active");
		window.scroll({ top: document.body.scrollHeight, left: 0, behavior: "smooth" });
		buildUrl(pokemons.length);
		const newPokemons = await fetchJson(currentPokemonsUrl);
		if (newPokemons.length === 0) noMorePokemons = true;
		loader.classList.remove("active");
		newPokemons.forEach((pokemon) => {
			const pokemonObject = new Pokemon(pokemon);
			pokemonObject.render(cardsContainer);
			pokemons.push(pokemonObject);
		});
		initializeStarListeners();
	}
};
