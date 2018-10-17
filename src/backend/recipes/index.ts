import recipeNodeJS from './nodejs';
import recipeTypescript from './typescript';
import recipeC from './c';
import recipeCpp from './cpp';
import recipeElixir from './elixir';
import recipeGo from './go';
import recipeHaskell from './haskell';
import recipeJava from './java';
import recipeLua from './lua';
import recipeOCaml from './ocaml';
import recipePHP from './php';
import recipePython3 from './python3';
import recipeR from './r';
import recipeRuby from './ruby';
import recipeRust from './rust';
import recipeSwift from './swift';
import recipePlaintext from './plaintext';

const recipes = [
    recipeNodeJS,
    recipeTypescript,
    recipeC,
    recipeCpp,
    recipeElixir,
    recipeGo,
    recipeHaskell,
    recipeJava,
    recipeLua,
    recipeOCaml,
    recipePHP,
    recipePython3,
    recipeR,
    recipeRuby,
    recipeRust,
    recipeSwift,
    recipePlaintext,
];

const recipesByKey = new Map();
const recipesByMainFile = new Map();
recipes.forEach(recipe => {
    recipesByKey.set(recipe.key, recipe);
    recipe.mainfile.forEach(file => recipesByMainFile.set(file, recipe));
});

export {
    getRecipes,
    getRecipeForMainFilename,
    getRecipeByKey,
};

function getRecipeForMainFilename(filename) {
    const recipe = recipesByMainFile.get(filename);
    return recipe ? recipe : undefined;
}

function getRecipeByKey(key) {
    const recipe = recipesByKey.get(key);
    return recipe ? recipe : undefined;
}

function getRecipes() {
    return recipes;
}
