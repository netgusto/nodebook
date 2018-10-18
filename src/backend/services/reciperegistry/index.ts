import { getRecipes, getRecipeForMainFilename, getRecipeByKey } from '../../recipes';

export default class RecipeRegistry {
    getRecipes() {
        return getRecipes();
    }

    getRecipeForMainFilename(filename: string) {
        return getRecipeForMainFilename(filename);
    }

    getAllRecipesMainFiles(): string[] {
        return this.getRecipes().reduce((carry, recipe) => carry = [...carry, ...recipe.mainfile], []);
    }

    getRecipeByKey(key: string) {
        return getRecipeByKey(key);
    }
}
