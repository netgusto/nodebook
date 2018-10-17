import { getRecipes, getRecipeForMainFilename, getRecipeByKey } from '../../recipes';

export default class RecipeRegistry {
    getRecipes() {
        return getRecipes();
    }

    getRecipeForMainFilename(filename) {
        return getRecipeForMainFilename(filename);
    }

    getAllRecipesMainFiles() {
        return this.getRecipes().reduce((carry, recipe) => carry = [...carry, ...recipe.mainfile], []);
    }

    getRecipeByKey(key) {
        return getRecipeByKey(key);
    }
}
