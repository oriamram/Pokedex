import { PokemonData } from "./pokemon";

const SMALL_WIDTH = 600;
const POKEDEX_IMG = "../images/pokedex.png";
const POKEDEX_SMALL_IMG = "../images/pokedex-small.jpg";

const dataElements = document.querySelectorAll(".pokemon-data");
const typesContainer = document.querySelector(".types") as HTMLElement;
const prevPage = document.getElementById("prev-page");
const nextPage = document.getElementById("next-page");
const homePage = document.getElementById("home");

let currentPokemon: PokemonData;
let smallPokedex = false;

loadPage();

// Initializes the page.
async function loadPage(): Promise<void> {
	const currentId = +new URLSearchParams(window.location.search).get("id");
	currentPokemon = await fetch(`/api/pokemon/${currentId}`).then((res) => res.json());
	onResize();
	window.onresize = onResize;
	addPokemonData();
	currentId !== 1 ? prevPage.addEventListener("click", () => (window.location.href = `/pokemon.html?id=${currentId - 1}`)) : prevPage.remove();
	currentId !== 151 ? nextPage.addEventListener("click", () => (window.location.href = `/pokemon.html?id=${currentId + 1}`)) : nextPage.remove();
	homePage.addEventListener("click", () => (window.location.href = "/"));
}

// Fills the page with the current pokemon's data.
function addPokemonData(): void {
	// Add pokemon image
	(document.getElementById("image") as HTMLImageElement).src = currentPokemon.image;
	// Add pokemon data
	dataElements.forEach((element) => {
		const dataObject = element.id in currentPokemon ? currentPokemon : currentPokemon.specs;
		element.innerHTML = dataObject[element.id];
	});
	// Add pokemon types
	currentPokemon.specs.types.forEach((type) => {
		const typeElement = `<span class="type ${type}">${type}</span>`;
		typesContainer.innerHTML += typeElement;
	});
}

// If the window's width reaches a certain threshold, the pokedex image changes.
function onResize(): void {
	if (window.innerWidth <= SMALL_WIDTH && !smallPokedex) {
		(document.getElementById("pokedex-image") as HTMLImageElement).src = POKEDEX_SMALL_IMG;
		smallPokedex = true;
	} else if (window.innerWidth > SMALL_WIDTH && smallPokedex) {
		(document.getElementById("pokedex-image") as HTMLImageElement).src = POKEDEX_IMG;
		smallPokedex = false;
	}
}
