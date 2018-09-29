const { defaultInitNotebook } = require('./defaultInitNotebook');

const recipeNodeJS = require('./nodejs');
const recipeTypescript = require('./typescript');
const recipeC = require('./c');
const recipeCpp = require('./cpp');
const recipeElixir = require('./elixir');
const recipeGo = require('./go');
const recipeHaskell = require('./haskell');
const recipeJava = require('./java');
const recipeLua = require('./lua');
const recipePHP = require('./php');
const recipePython3 = require('./python3');
const recipeR = require('./r');
const recipeRuby = require('./ruby');
const recipeRust = require('./rust');
const recipeSwift = require('./swift');
const recipePlaintext = require('./plaintext');

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

module.exports = {
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
