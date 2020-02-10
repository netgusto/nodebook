package service

import (
	"errors"

	"github.com/netgusto/nodebook/src/shared/types"
)

type RecipeRegistry struct {
	recipes []types.Recipe
}

func NewRecipeRegistry() *RecipeRegistry {
	return &RecipeRegistry{
		recipes: []types.Recipe{},
	}
}

func (rr RecipeRegistry) GetRecipes() []types.Recipe {
	return rr.recipes
}

func (rr RecipeRegistry) GetRecipeByKey(key string) *types.Recipe {
	for _, r := range rr.recipes {
		if r.GetKey() == key {
			return &r
		}
	}

	return nil
}

func (rr *RecipeRegistry) AddRecipe(recipe types.Recipe) *RecipeRegistry {
	rr.recipes = append(rr.recipes, recipe)
	return rr
}

func (rr RecipeRegistry) GetRecipeForMainFilename(mainfilename string) (types.Recipe, error) {
	for _, recipe := range rr.recipes {
		if recipe.GetMainfile() == mainfilename {
			return recipe, nil
		}
	}

	return nil, errors.New("Recipe not found (matching " + mainfilename + ")")
}
