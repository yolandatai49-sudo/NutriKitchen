import type { ImageSourcePropType } from 'react-native';
import mushroomChicken from '../../assets/recipes/mushroom-chicken.jpg';
import scallionNoodles from '../../assets/recipes/scallion-noodles.jpg';
import steamedTofu from '../../assets/recipes/steamed-tofu.jpg';
import tomatoEggs from '../../assets/recipes/tomato-eggs.jpg';

const recipeCovers = new Map<string, ImageSourcePropType>([
  ['tomato-eggs', tomatoEggs],
  ['scallion-noodles', scallionNoodles],
  ['steamed-tofu', steamedTofu],
  ['mushroom-chicken', mushroomChicken],
]);

export function recipeCover(key: string | undefined) {
  return key === undefined ? undefined : recipeCovers.get(key);
}
