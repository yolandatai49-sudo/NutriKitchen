import type { CollectionRecipe } from './recipe-collection.ts';

type IngredientRow = [name: string, quantity: number, unit?: string];
type Step = [zh: string, en: string];

function dish(key: string, title: string, english: string, category: string, minutes: number,
  ingredients: IngredientRow[], steps: Step[], region: CollectionRecipe['region'] = 'chinese'): CollectionRecipe {
  return {
    key, minutes, servings: 2, region,
    english: { title: english, steps: steps.map(([, en]) => en) },
    recipe: {
      title, category, sourceUrl: null, pending: false,
      ingredients: ingredients.map(([name, quantity, unit = '克']) => ({ name, quantity, unit })),
      steps: steps.map(([zh]) => zh),
    },
  };
}

export const moreRecipes = [
  dish('garlic-broccoli', '蒜蓉西兰花', 'Garlic Broccoli', '素菜', 15,
    [['西兰花', 320], ['蒜', 12], ['食用油', 10, '毫升'], ['盐', 2]], [
      ['西兰花切成大小相近的小朵，粗梗去皮切片。蒜切碎。', 'Cut the broccoli into even florets. Peel and slice the thick stem. Mince the garlic.'],
      ['烧开一锅水，下西兰花焯约 1 分钟，颜色变亮后捞出沥干。', 'Blanch the broccoli in boiling water for about 1 minute, until bright green. Drain well.'],
      ['中火热油，蒜末炒到有香味便倒入西兰花，加盐翻炒约 1 分钟，保留一点脆度。', 'Heat the oil over medium heat. Stir the garlic until fragrant, add broccoli and salt, and stir-fry for about 1 minute. Keep a little crunch.'],
    ]),
  dish('hot-sour-potatoes', '酸辣土豆丝', 'Hot and Sour Shredded Potatoes', '素菜', 20,
    [['土豆', 350], ['干辣椒', 3], ['小葱', 8], ['食用油', 15, '毫升'], ['米醋', 20, '毫升'], ['盐', 2]], [
      ['土豆切细丝，冷水淘两遍洗去表面淀粉，再充分沥水。辣椒剪段，小葱切段。', 'Julienne the potatoes, rinse twice in cold water to remove surface starch, and drain well. Cut the chiles and scallions into short pieces.'],
      ['热锅下油，中火炒香干辣椒，倒入土豆丝转大火，炒约 2 分钟至断生。', 'Heat the oil and briefly fry the dried chiles over medium heat. Add the potatoes, turn up the heat, and stir-fry for about 2 minutes, until just cooked.'],
      ['沿锅边加米醋，撒盐和葱段，快速炒匀。土豆丝透亮而有脆感就可以盛出。', 'Pour the rice vinegar around the edge of the pan. Add salt and scallions and toss briefly. Serve when the shreds look translucent but still have a bite.'],
    ]),
  dish('steamed-sea-bass', '清蒸鲈鱼', 'Steamed Sea Bass', '荤菜', 25,
    [['鲈鱼', 500], ['姜', 15], ['小葱', 25], ['蒸鱼豉油', 20, '毫升'], ['食用油', 12, '毫升']], [
      ['让鱼贩去鳞、去内脏。擦干鱼，鱼腹放几片姜，盘底用葱段略垫高。其余葱姜切细丝。', 'Ask for the fish scaled and cleaned. Pat it dry, tuck a few ginger slices inside, and prop it up on scallion pieces in a plate. Julienne the remaining ginger and scallions.'],
      ['水沸后把盘子放入蒸锅，盖盖蒸约 9–12 分钟，厚肉处达到 63°C 就出锅。', 'Set the plate over boiling water and steam, covered, for about 9–12 minutes. The thickest part should reach 145°F (63°C).'],
      ['倒掉盘中多余的水，铺葱姜丝，沿盘边淋蒸鱼豉油。另把油加热至流动顺滑，浇在葱姜上。', 'Drain excess liquid, top with the shredded aromatics, and pour the seasoned soy around the plate. Heat the oil separately and drizzle it over the scallions and ginger.'],
    ]),
  dish('tomato-beef-stew', '西红柿炖牛腩', 'Tomato and Beef Brisket Stew', '荤菜', 110,
    [['牛腩', 420], ['番茄', 400], ['土豆', 200], ['姜', 12], ['生抽', 18, '毫升'], ['食用油', 10, '毫升'], ['盐', 2]], [
      ['牛腩切块，冷水入锅，煮开撇去浮沫后捞出。番茄切块，土豆去皮切块。', 'Cut the brisket into chunks. Bring it to a boil in cold water, skim the foam, and drain. Chop the tomatoes and peeled potatoes.'],
      ['油炒姜片和半份番茄，番茄软成酱后放牛腩和生抽，加约 650 毫升热水。盖盖小火炖 65–75 分钟。', 'Fry the ginger and half the tomatoes in oil until saucy. Add brisket, soy sauce, and about 2¾ cups hot water. Cover and simmer for 65–75 minutes.'],
      ['牛腩开始变软后放土豆和余下番茄，再炖约 20 分钟。筷子能扎透牛腩时加盐调味。', 'When the beef begins to soften, add potatoes and remaining tomatoes. Simmer for about 20 minutes more, until the beef is fork-tender. Season with salt.'],
    ]),
  dish('shrimp-eggs', '虾仁滑蛋', 'Shrimp and Soft Scrambled Eggs', '家常菜', 15,
    [['虾仁', 160], ['鸡蛋', 4, '个'], ['小葱', 10], ['淀粉', 3], ['食用油', 15, '毫升'], ['盐', 2]], [
      ['虾仁擦干，拌一半盐和淀粉。鸡蛋打散，加葱花和余下的盐。', 'Pat the shrimp dry and toss with the starch and half the salt. Beat the eggs with the scallions and remaining salt.'],
      ['用约一半油把虾仁炒至不透明、完全熟透，盛出。', 'Cook the shrimp in about half the oil until opaque and cooked through. Transfer to a plate.'],
      ['转中小火放余下的油，下蛋液和虾仁。从锅边向中间缓慢推拢，蛋液完全凝固便离火。', 'Reduce to medium-low, add the remaining oil, then add eggs and shrimp. Gently sweep toward the center and take off the heat as soon as the eggs are set.'],
    ]),
  dish('mapo-tofu', '麻婆豆腐', 'Mapo Tofu', '家常菜', 25,
    [['嫩豆腐', 350], ['猪肉末', 100], ['郫县豆瓣酱', 22], ['花椒', 2], ['蒜', 8], ['小葱', 10], ['淀粉', 5], ['食用油', 12, '毫升']], [
      ['豆腐切块，用微沸的水焯 1 分钟后沥干。花椒干炒出香后碾碎。', 'Cut tofu into cubes, blanch in gently boiling water for 1 minute, and drain. Toast and crush the Sichuan peppercorns.'],
      ['锅里下油，把猪肉末炒散炒熟。加蒜末和豆瓣酱，小火炒出红油。', 'Cook the ground pork in oil, breaking it up until cooked through. Add minced garlic and chile bean paste and fry over low heat until the oil reddens.'],
      ['加约 180 毫升水和豆腐，小火煮 5 分钟。淀粉用 20 毫升冷水调开，倒入锅里煮到酱汁薄薄挂住豆腐。撒葱花和花椒粉。', 'Add about ¾ cup water and the tofu; simmer 5 minutes. Mix the starch with 1½ tbsp cold water, stir it into the pan, and simmer until the sauce coats the tofu. Top with scallions and peppercorn.'],
    ]),
  dish('cabbage-tofu-soup', '白菜豆腐汤', 'Napa Cabbage and Tofu Soup', '汤', 20,
    [['大白菜', 260], ['嫩豆腐', 220], ['姜', 6], ['小葱', 8], ['无盐鸡汤', 600, '毫升'], ['盐', 2]], [
      ['白菜梗和叶分别切段，豆腐切方块，姜切细丝。', 'Separate the cabbage stems and leaves and chop both. Cube the tofu and finely slice the ginger.'],
      ['鸡汤加姜丝烧开，先煮白菜梗约 4 分钟，再放豆腐和菜叶，煮约 5 分钟。', 'Bring the stock and ginger to a boil. Cook the cabbage stems for about 4 minutes, then add tofu and leaves and simmer for another 5 minutes.'],
      ['白菜梗变软，豆腐热透后加盐和葱花，盛出。', 'When the stems are tender and the tofu is hot throughout, season with salt and scallions and serve.'],
    ]),
  dish('garlic-eggplant', '蒜蓉茄子', 'Steamed Eggplant with Garlic', '素菜', 25,
    [['茄子', 360], ['蒜', 20], ['小葱', 10], ['生抽', 15, '毫升'], ['米醋', 8, '毫升'], ['食用油', 12, '毫升']], [
      ['茄子切手指粗的条，皮朝上排盘。水开后上锅蒸约 10 分钟，蒸到筷子能轻松扎透。', 'Cut eggplant into finger-thick batons and arrange skin-side up. Steam over boiling water for about 10 minutes, until easily pierced.'],
      ['蒜切末，用油小火炒到刚变金黄，关火后拌入生抽和米醋。', 'Mince the garlic and fry it gently in oil until just golden. Turn off the heat and stir in soy sauce and rice vinegar.'],
      ['茄子倒掉盘里的水，淋蒜汁，撒葱花后轻轻拌开。', 'Drain excess water from the eggplant. Spoon on the garlic dressing, add scallions, and toss gently.'],
    ]),
  dish('teriyaki-chicken-rice', '照烧鸡腿饭', 'Teriyaki Chicken Rice Bowls', '主食', 35,
    [['去骨鸡腿肉', 320], ['大米', 150], ['西兰花', 180], ['生抽', 25, '毫升'], ['味醂', 25, '毫升'], ['白糖', 8], ['食用油', 8, '毫升']], [
      ['先煮米饭，西兰花切小朵后焯熟沥干。生抽、味醂、糖和 30 毫升水混成照烧汁。', 'Start the rice. Cut the broccoli into florets, blanch until tender, and drain. Mix soy sauce, mirin, sugar, and 2 tbsp water for the glaze.'],
      ['鸡腿肉擦干，用油中火煎，两面金黄后倒入照烧汁。翻面让两面都裹上汁，最厚处达到 74°C。', 'Pat the chicken dry and pan-sear in oil over medium heat. When golden on both sides, add the glaze and turn to coat. Cook to 165°F (74°C) at the thickest part.'],
      ['鸡肉切条，铺在米饭上，加西兰花，淋少量锅里剩下的汁。', 'Slice the chicken and serve over rice with broccoli. Spoon a little of the pan glaze over the top.'],
    ], 'american'),
  dish('garlic-salmon', '蒜香烤三文鱼', 'Lemon Garlic Salmon', '荤菜', 25,
    [['三文鱼', 320], ['芦笋', 220], ['柠檬', 1, '个'], ['蒜', 10], ['橄榄油', 18, '毫升'], ['盐', 2], ['黑胡椒', 1]], [
      ['烤箱预热到 205°C。芦笋切去老根，与一半橄榄油和少量盐拌匀。', 'Heat the oven to 400°F (205°C). Trim the asparagus and toss it with half the olive oil and a little salt.'],
      ['三文鱼擦干，抹剩余的油、蒜末、盐和胡椒。把鱼和芦笋放同一个烤盘，鱼上铺薄柠檬片。', 'Pat the salmon dry and rub with the remaining oil, garlic, salt, and pepper. Set it on a sheet pan with the asparagus and top the fish with thin lemon slices.'],
      ['烤约 12–16 分钟，以鱼最厚处达到 63°C 为准。出炉后再挤几滴柠檬汁。', 'Roast for about 12–16 minutes, until the thickest part reaches 145°F (63°C). Finish with a squeeze of lemon.'],
    ], 'american'),
  dish('lemon-chicken', '烤柠檬鸡腿', 'Sheet-Pan Lemon Chicken', '荤菜', 50,
    [['带骨鸡腿', 450], ['土豆', 300], ['柠檬', 1, '个'], ['蒜', 12], ['橄榄油', 20, '毫升'], ['盐', 4], ['黑胡椒', 1]], [
      ['烤箱预热到 220°C。土豆切小块，柠檬一半挤汁，另一半切角。', 'Heat the oven to 425°F (220°C). Chop the potatoes. Juice half the lemon and cut the other half into wedges.'],
      ['鸡腿、土豆分别用橄榄油、盐、黑胡椒、蒜末和柠檬汁拌匀。鸡皮朝上摆在烤盘，土豆铺在旁边，不堆叠。', 'Toss the chicken and potatoes separately with olive oil, salt, pepper, minced garlic, and lemon juice. Spread them out on one sheet pan with the chicken skin facing up.'],
      ['烤约 35–40 分钟，鸡腿最厚处达到 74°C、土豆边缘金黄即可。配柠檬角上桌。', 'Roast for about 35–40 minutes, until the thickest part of the chicken reaches 165°F (74°C) and the potato edges are golden. Serve with lemon wedges.'],
    ], 'american'),
  dish('tomato-pasta', '番茄意面', 'Weeknight Tomato Pasta', '主食', 25,
    [['短意面', 180], ['罐装碎番茄', 300], ['洋葱', 70], ['蒜', 8], ['橄榄油', 15, '毫升'], ['帕玛森奶酪', 25], ['盐', 2]], [
      ['按包装说明煮意面，比建议时间少 1 分钟捞出，保留约半杯煮面水。', 'Cook the pasta until 1 minute shy of the package time. Reserve about ½ cup of pasta water before draining.'],
      ['橄榄油中火炒软洋葱丁，放蒜末和碎番茄，加盐煮约 10 分钟，酱汁变稠即可。', 'Soften diced onion in olive oil over medium heat. Add garlic, crushed tomatoes, and salt and simmer about 10 minutes, until slightly thick.'],
      ['意面倒进酱里拌匀，少量加入煮面水煮 1 分钟。盛出擦上帕玛森。', 'Toss the pasta in the sauce and cook for 1 minute, adding a little reserved water as needed. Finish with grated Parmesan.'],
    ], 'american'),
  dish('turkey-sandwich', '火鸡芝士三明治', 'Turkey and Cheddar Sandwiches', '主食', 10,
    [['全麦吐司', 4, '片'], ['熟火鸡肉片', 120], ['切达奶酪', 45], ['生菜', 30], ['番茄', 80], ['第戎芥末酱', 12]], [
      ['吐司稍微烤脆。番茄切薄片并吸去表面水分，生菜洗净沥干。', 'Lightly toast the bread. Thinly slice and blot the tomato; wash and dry the lettuce.'],
      ['两片面包抹芥末酱，铺生菜、火鸡肉、奶酪和番茄，盖上另一片。', 'Spread mustard on two slices. Layer with lettuce, turkey, cheddar, and tomato, then add the top slices.'],
      ['轻压后对切。如果要带出门，先包好冷藏，吃之前再取出。', 'Press gently and cut in half. If packing ahead, wrap and refrigerate until serving.'],
    ], 'american'),
  dish('chicken-black-bean-wrap', '黑豆鸡肉卷', 'Chicken and Black Bean Wraps', '主食', 20,
    [['熟鸡肉', 170], ['罐装黑豆', 140], ['面粉卷饼', 2, '张'], ['生菜', 40], ['切达奶酪', 40], ['莎莎酱', 45]], [
      ['黑豆冲洗沥干。熟鸡肉撕成条，和黑豆、莎莎酱一起用平底锅炒到热透。', 'Rinse and drain the beans. Shred the cooked chicken and warm it thoroughly in a skillet with the beans and salsa.'],
      ['卷饼在干锅里两面各加热几秒。铺上生菜、鸡肉黑豆和奶酪，左右留出边。', 'Warm the tortillas for a few seconds on each side in a dry skillet. Add lettuce, chicken and beans, and cheddar, leaving space at both sides.'],
      ['两边向内折，底边包住馅料后卷紧。对半斜切。', 'Fold the sides inward, tuck the bottom edge over the filling, and roll firmly. Slice on the diagonal.'],
    ], 'american'),
  dish('grilled-cheese', '芝士烤三明治', 'Grilled Cheese Sandwiches', '主食', 15,
    [['吐司', 4, '片'], ['切达奶酪', 90], ['无盐黄油', 18]], [
      ['吐司朝外的一面薄抹软化的黄油，两片之间夹切薄或擦碎的切达奶酪。', 'Spread softened butter on the outer faces of the bread. Sandwich thinly sliced or grated cheddar between them.'],
      ['平底锅用中小火，放入三明治，每面煎约 3 分钟。', 'Heat a skillet over medium-low. Cook the sandwiches for about 3 minutes per side.'],
      ['两面金黄、奶酪融化就可以取出。如果面包先上色，转小火加盖约 30 秒。', 'Remove when both sides are golden and the cheese has melted. If the bread browns first, lower the heat and cover for about 30 seconds.'],
    ], 'american'),
  dish('apple-oatmeal', '苹果肉桂燕麦', 'Apple Cinnamon Oatmeal', '早餐', 15,
    [['燕麦片', 85], ['苹果', 160], ['牛奶', 240, '毫升'], ['肉桂粉', 2], ['核桃', 20]], [
      ['苹果去核切小丁，核桃掰碎。', 'Core and dice the apple. Break the walnuts into small pieces.'],
      ['锅中加牛奶、200 毫升水、燕麦、苹果和肉桂。煮开后转小火，搅拌煮约 6 分钟。', 'Add milk, about ¾ cup plus 1 tbsp water, oats, apple, and cinnamon to a saucepan. Bring to a simmer and cook over low heat, stirring, for about 6 minutes.'],
      ['燕麦软糯后关火，静置 1 分钟，分碗撒核桃碎。太稠就再加一小口牛奶。', 'Once the oats are soft, turn off the heat and let stand 1 minute. Divide into bowls and top with walnuts. Add a splash of milk if too thick.'],
    ], 'american'),
  dish('quinoa-bowl', '烤蔬菜藜麦碗', 'Roasted Vegetable Quinoa Bowls', '主食', 35,
    [['藜麦', 120], ['红薯', 230], ['西兰花', 180], ['罐装鹰嘴豆', 150], ['橄榄油', 20, '毫升'], ['柠檬', 1, '个'], ['盐', 3]], [
      ['烤箱预热到 220°C。红薯切约 2 厘米的丁，拌一半油和少量盐，先烤 12 分钟。', 'Heat the oven to 425°F (220°C). Dice the sweet potato into ¾-inch pieces, toss with half the oil and a pinch of salt, and roast for 12 minutes.'],
      ['藜麦淘净，按包装说明煮熟，关火焖约 5 分钟。鹰嘴豆沥水，与西兰花拌余下的油，加入红薯烤盘再烤约 15 分钟。', 'Rinse and cook the quinoa according to the package, then rest it off the heat for 5 minutes. Drain the chickpeas and toss with broccoli and the remaining oil. Add to the pan and roast for about 15 minutes more.'],
      ['藜麦拨松后分碗，铺烤好的蔬菜和鹰嘴豆。挤柠檬汁，尝味补盐。', 'Fluff the quinoa and divide into bowls. Top with the roasted vegetables and chickpeas, squeeze over lemon, and adjust the salt.'],
    ], 'american'),
  dish('skillet-burger', '牛肉芝士汉堡', 'Skillet Cheeseburgers', '主食', 25,
    [['牛肉末', 300], ['汉堡面包', 2, '个'], ['切达奶酪', 40], ['番茄', 80], ['生菜', 30], ['盐', 3], ['黑胡椒', 1]], [
      ['牛肉末轻轻压成两块略大于面包的肉饼，中间压浅凹。下锅前两面撒盐和黑胡椒。', 'Gently shape the beef into two patties slightly wider than the buns and make a shallow dimple in each. Season both sides just before cooking.'],
      ['热平底锅，中大火煎肉饼。翻面后放切达奶酪，煎到肉饼中心达到 71°C。', 'Sear the patties in a hot skillet over medium-high. After flipping, add the cheddar and cook until the centers reach 160°F (71°C).'],
      ['面包切面烤香，夹入生菜、番茄和肉饼，趁热吃。', 'Toast the cut sides of the buns. Add lettuce, tomato, and the hot patties and serve.'],
    ], 'american'),
  dish('mac-and-cheese', '奶酪通心粉', 'Stovetop Mac and Cheese', '主食', 25,
    [['肘形通心粉', 170], ['切达奶酪', 100], ['牛奶', 280, '毫升'], ['无盐黄油', 18], ['面粉', 15], ['盐', 2], ['黑胡椒', 1]], [
      ['通心粉按包装说明煮到有一点嚼劲后沥干。奶酪擦丝。', 'Cook the macaroni until al dente according to the package and drain. Grate the cheese.'],
      ['锅里小火融黄油，加入面粉搅 1 分钟。牛奶分次加入，边倒边搅，小火煮到酱汁能挂住勺背。', 'Melt the butter over low heat. Whisk in flour for 1 minute, then gradually whisk in the milk. Simmer gently until it coats the back of a spoon.'],
      ['关火后搅入奶酪至融化。倒入通心粉拌匀，加盐和黑胡椒，趁热吃。', 'Remove from the heat and stir in the cheddar until smooth. Fold in macaroni, season with salt and pepper, and serve hot.'],
    ], 'american'),
] as const;
