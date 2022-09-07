# Pokedex

Tired of all the regular pokemones? Looking for something new?  
With up to 8,000 newly fused pokemons, this website is the best to discover your next favorite pokemon.

### <ins>**Technologies used**</ins>:

**Front:** Typescript, SCSS  
**Back:** Node js, Express, PostgreSQL

---

## Live Application:

https://pokedex-oriamram-yuvron.herokuapp.com/

---

## Notes:

- If you experience some kind of an error, please let us know.
- Also, `localStorage.clear()` in the browser console might fix the issue.

---

## To run locally:

1. Get yourself a PostgreSQL database, and make sure you have its connection string.  
   (You can ask us for our own database connection string)

2. Create a ".env" file in the root folder, add the following text:  
   `DATABASE_URL=<connection_string>`

3. Run the following commands:

   ```console
   npm ci
   npm run initDb (Skip this step if you have our database's connection string)
   npm run dev
   ```

### <b>Now your own local pokedex should be up and running!</b>
