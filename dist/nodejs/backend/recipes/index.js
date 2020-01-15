"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodejs_1 = require("./nodejs");
const typescript_1 = require("./typescript");
const c_1 = require("./c");
const clojure_1 = require("./clojure");
const cpp_1 = require("./cpp");
const elixir_1 = require("./elixir");
const go_1 = require("./go");
const haskell_1 = require("./haskell");
const java_1 = require("./java");
const lua_1 = require("./lua");
const ocaml_1 = require("./ocaml");
const php_1 = require("./php");
const python3_1 = require("./python3");
const r_1 = require("./r");
const ruby_1 = require("./ruby");
const rust_1 = require("./rust");
const swift_1 = require("./swift");
const plaintext_1 = require("./plaintext");
const fsharp_1 = require("./fsharp");
const csharp_1 = require("./csharp");
const recipes = [
    nodejs_1.default,
    typescript_1.default,
    c_1.default,
    clojure_1.default,
    cpp_1.default,
    csharp_1.default,
    elixir_1.default,
    fsharp_1.default,
    go_1.default,
    haskell_1.default,
    java_1.default,
    lua_1.default,
    ocaml_1.default,
    php_1.default,
    python3_1.default,
    r_1.default,
    ruby_1.default,
    rust_1.default,
    swift_1.default,
    plaintext_1.default,
];
const recipesByKey = new Map();
const recipesByMainFile = new Map();
recipes.forEach(recipe => {
    recipesByKey.set(recipe.key, recipe);
    recipe.mainfile.forEach(file => recipesByMainFile.set(file, recipe));
});
function getRecipeForMainFilename(filename) {
    const recipe = recipesByMainFile.get(filename);
    return recipe ? recipe : undefined;
}
exports.getRecipeForMainFilename = getRecipeForMainFilename;
function getRecipeByKey(key) {
    const recipe = recipesByKey.get(key);
    return recipe ? recipe : undefined;
}
exports.getRecipeByKey = getRecipeByKey;
function getRecipes() {
    return recipes;
}
exports.getRecipes = getRecipes;
