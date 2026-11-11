import type { ImageSourcePropType } from 'react-native';
import mushroomChicken from '../../assets/recipes/mushroom-chicken.jpg';
import scallionNoodles from '../../assets/recipes/scallion-noodles.jpg';
import steamedTofu from '../../assets/recipes/steamed-tofu.jpg';
import tomatoEggs from '../../assets/recipes/tomato-eggs.jpg';
import redBraisedPork from '../../assets/recipes/red-braised-pork.jpg';
import yangchunNoodles from '../../assets/recipes/yangchun-noodles.jpg';
import braisedPorkRice from '../../assets/recipes/braised-pork-rice.jpg';
import kungPaoChicken from '../../assets/recipes/kung-pao-chicken.jpg';
import pepperPorkStrips from '../../assets/recipes/pepper-pork-strips.jpg';
import hunanBeef from '../../assets/recipes/hunan-beef.jpg';
import chaoshanBeefSoup from '../../assets/recipes/chaoshan-beef-soup.jpg';
import garlicBroccoli from '../../assets/recipes/garlic-broccoli.jpg';
import hotSourPotatoes from '../../assets/recipes/hot-sour-potatoes.jpg';
import steamedSeaBass from '../../assets/recipes/steamed-sea-bass.jpg';
import tomatoBeefStew from '../../assets/recipes/tomato-beef-stew.jpg';
import shrimpEggs from '../../assets/recipes/shrimp-eggs.jpg';
import mapoTofu from '../../assets/recipes/mapo-tofu.jpg';
import cabbageTofuSoup from '../../assets/recipes/cabbage-tofu-soup.jpg';
import garlicEggplant from '../../assets/recipes/garlic-eggplant.jpg';
import teriyakiChickenRice from '../../assets/recipes/teriyaki-chicken-rice.jpg';
import garlicSalmon from '../../assets/recipes/garlic-salmon.jpg';
import lemonChicken from '../../assets/recipes/lemon-chicken.jpg';
import tomatoPasta from '../../assets/recipes/tomato-pasta.jpg';
import turkeySandwich from '../../assets/recipes/turkey-sandwich.jpg';
import chickenBlackBeanWrap from '../../assets/recipes/chicken-black-bean-wrap.jpg';
import grilledCheese from '../../assets/recipes/grilled-cheese.jpg';
import appleOatmeal from '../../assets/recipes/apple-oatmeal.jpg';
import quinoaBowl from '../../assets/recipes/quinoa-bowl.jpg';
import skilletBurger from '../../assets/recipes/skillet-burger.jpg';
import macAndCheese from '../../assets/recipes/mac-and-cheese.jpg';

const recipeCovers = new Map<string, ImageSourcePropType>([
  ['tomato-eggs', tomatoEggs],
  ['scallion-noodles', scallionNoodles],
  ['steamed-tofu', steamedTofu],
  ['mushroom-chicken', mushroomChicken],
  ['red-braised-pork', redBraisedPork],
  ['yangchun-noodles', yangchunNoodles],
  ['braised-pork-rice', braisedPorkRice],
  ['kung-pao-chicken', kungPaoChicken],
  ['pepper-pork-strips', pepperPorkStrips],
  ['hunan-beef', hunanBeef],
  ['chaoshan-beef-soup', chaoshanBeefSoup],
  ['garlic-broccoli', garlicBroccoli],
  ['hot-sour-potatoes', hotSourPotatoes],
  ['steamed-sea-bass', steamedSeaBass],
  ['tomato-beef-stew', tomatoBeefStew],
  ['shrimp-eggs', shrimpEggs],
  ['mapo-tofu', mapoTofu],
  ['cabbage-tofu-soup', cabbageTofuSoup],
  ['garlic-eggplant', garlicEggplant],
  ['teriyaki-chicken-rice', teriyakiChickenRice],
  ['garlic-salmon', garlicSalmon],
  ['lemon-chicken', lemonChicken],
  ['tomato-pasta', tomatoPasta],
  ['turkey-sandwich', turkeySandwich],
  ['chicken-black-bean-wrap', chickenBlackBeanWrap],
  ['grilled-cheese', grilledCheese],
  ['apple-oatmeal', appleOatmeal],
  ['quinoa-bowl', quinoaBowl],
  ['skillet-burger', skilletBurger],
  ['mac-and-cheese', macAndCheese],
]);

export function recipeCover(key: string | undefined) {
  return key === undefined ? undefined : recipeCovers.get(key);
}
