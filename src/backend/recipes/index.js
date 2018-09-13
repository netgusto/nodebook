const { defaultInitNotebook } = require('./defaultInitNotebook');

const recipeNodeJS = require('./nodejs');
const recipeTypescript = require('./typescript');
const recipeC = require('./c');
const recipeCpp = require('./cpp');
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

module.exports = {
    getRecipes,
    getRecipeForMainFilename,
    getRecipeByKey,
};

function getRecipeForMainFilename(filename) {
    const recipes = getRecipes();
    const recipe = recipes.find(recipe => recipe.mainfile.includes(filename));
    if (!recipe) return undefined;

    return recipe;
}

function getRecipeByKey(key) {
    const recipes = getRecipes();
    const recipe = recipes.find(recipe => recipe.key === key);
    if (!recipe) return undefined;
    return recipe;
}

function getRecipes() {
    return [
        recipeNodeJS,
        recipeTypescript,
        recipeC,
        recipeCpp,
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
}
