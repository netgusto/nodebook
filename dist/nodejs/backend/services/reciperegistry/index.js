"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recipes_1 = require("../../recipes");
class RecipeRegistry {
    getRecipes() {
        return recipes_1.getRecipes();
    }
    getRecipeForMainFilename(filename) {
        return recipes_1.getRecipeForMainFilename(filename);
    }
    getAllRecipesMainFiles() {
        return this.getRecipes().reduce((carry, recipe) => carry = [...carry, ...recipe.mainfile], []);
    }
    getRecipeByKey(key) {
        return recipes_1.getRecipeByKey(key);
    }
}
exports.default = RecipeRegistry;
