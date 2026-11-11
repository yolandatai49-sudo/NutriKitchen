import { useLanguage } from '../../data/language';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoKitchenNotice } from '../../components/demo-kitchen-notice';
import { recipeCover } from '../../components/recipe-covers';
import { Action, Body, Chip, editorialFont, palette, ui, type IconName } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { categoryEnglish, localizeCollection, presentSavedRecipe, recipeCollection, type CollectionRecipe } from '../../domain/recipe-collection';
import { filterRecipes, matchesRecipeSearch, normalizeName } from '../../domain/recipes';

export default function RecipesScreen() {
  const { t, language, setLanguage } = useLanguage();
  const english = language === 'en';
  const router = useRouter();
  const { data: { recipes } } = useKitchen();
  const [shelf, setShelf] = useState<'browse' | 'mine'>('browse');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [region, setRegion] = useState<'all' | 'chinese' | 'american'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const categories = [...new Set(recipes.map((recipe) => recipe.category))].sort((a, b) => a.localeCompare(b, 'zh'));
  const activeCategory = category !== null && categories.includes(category) ? category : null;
  const terms = normalizeName(query).split(' ').filter(Boolean);
  const visible = filterRecipes(recipes, '', activeCategory, favoritesOnly)
    .map((recipe) => ({ original: recipe, display: presentSavedRecipe(recipe, english) }))
    .filter(({ original, display }) => matchesRecipeSearch(original, terms) || matchesRecipeSearch(display, terms))
    .map(({ display }) => display);
  const suggestions = recipeCollection
    .filter((entry) => region === 'all' || (entry.region ?? 'chinese') === region)
    .filter((entry) => matchesRecipeSearch(entry.recipe, terms) || matchesRecipeSearch(localizeCollection(entry, true).recipe, terms))
    .map((entry) => localizeCollection(entry, english));
  const savedKeys = new Set(recipes.map((recipe) => recipe.collectionKey));

  function openSuggestion(item: CollectionRecipe) {
    router.push({ pathname: '/recipes/collection/[key]', params: { key: item.key } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        <View style={styles.book}>
          <View style={[styles.inset, styles.utility]}>
            {setLanguage && (
              <View accessibilityLabel={t('语言')} style={styles.language}>
                <Chip label="中文" selected={!english} onPress={() => setLanguage('zh')} />
                <Chip label="English" selected={english} onPress={() => setLanguage('en')} />
              </View>
            )}
            <DemoKitchenNotice showEntry />
          </View>
          <View style={[styles.inset, styles.masthead]}>
            <Text accessibilityRole="header" style={styles.title}>{t("今天吃什么")}</Text>
            <View style={styles.tools}>
              <IconButton label={searching ? t("关闭搜索") : t("搜索菜谱")} icon={searching ? 'close' : 'search-outline'}
                onPress={() => {
                  if (searching) { setQuery(''); Keyboard.dismiss(); }
                  setSearching(!searching);
                }} />
              <IconButton label={t("新增菜谱")} icon="add" filled onPress={() => router.push('/recipes/form')} />
            </View>
          </View>
          <View style={[styles.inset, styles.tabs]}>
            <TabLabel title={t("找灵感")} selected={shelf === 'browse'} onPress={() => setShelf('browse')} />
            <TabLabel title={t("我的菜谱")} selected={shelf === 'mine'} onPress={() => setShelf('mine')} />
          </View>
          {searching && (
            <View style={[styles.inset, styles.search]}>
              <Ionicons name="search-outline" size={18} color={palette.muted} accessible={false} />
              <TextInput accessibilityLabel={t("搜索菜谱")} placeholder={t("菜名、分类或食材")} placeholderTextColor={palette.muted}
                value={query} onChangeText={setQuery} returnKeyType="search" clearButtonMode="while-editing"
                autoFocus style={styles.searchField} />
            </View>
          )}

          {shelf === 'browse' ? (
            <>
              <View style={[styles.inset, styles.sectionHeader]}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>{t("家常菜谱")}</Text>
                <Text style={styles.caption}>{suggestions.length} {t("道菜")}</Text>
              </View>
              <View style={[styles.inset, styles.regions]}>
                <Chip label={t('全部')} selected={region === 'all'} onPress={() => setRegion('all')} />
                <Chip label={t('中式家常')} selected={region === 'chinese'} onPress={() => setRegion('chinese')} />
                <Chip label={t('美国日常')} selected={region === 'american'} onPress={() => setRegion('american')} />
              </View>
              {suggestions.length > 0 ? (
                <RecipeGallery items={suggestions} savedKeys={savedKeys} onOpen={openSuggestion} />
              ) : (
                <View style={styles.empty}><Body>{t("没有找到符合条件的菜谱。")}</Body></View>
              )}
            </>
          ) : (
            <View style={styles.inset}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
                <TabLabel title={t("全部")} selected={activeCategory === null} onPress={() => setCategory(null)} />
                {categories.map((item) => (
                  <TabLabel key={item} title={english ? categoryEnglish[item] ?? item : item} selected={activeCategory === item} onPress={() => setCategory(item)} />
                ))}
              </ScrollView>
              <View style={styles.indexHeader}>
                <Text style={styles.caption}>{visible.length} {t("道菜")}</Text>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: favoritesOnly }}
                  accessibilityLabel={t("只看收藏")} onPress={() => setFavoritesOnly(!favoritesOnly)} style={styles.favoriteFilter}>
                  <Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={17} color={palette.accent} accessible={false} />
                  <Text style={styles.caption}>{t("只看收藏")}</Text>
                </Pressable>
              </View>
              {visible.length === 0 && (
                <View style={styles.libraryEmpty}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    {recipes.length ? t("没有符合条件的菜谱") : t("还没有菜谱")}
                  </Text>
                  <Body>{recipes.length ? t("试试其他关键词或分类。") : t("收录一道家常菜，或写下自己的做法。")}</Body>
                  {!recipes.length && <View style={styles.tools}>
                    <Action label={t("找灵感")} variant="quiet" onPress={() => setShelf('browse')} />
                    <Action label={t("新增菜谱")} onPress={() => router.push('/recipes/form')} />
                  </View>}
                </View>
              )}
              {visible.map((recipe) => {
                const cover = recipeCover(recipe.collectionKey);
                return (
                  <Pressable key={recipe.id} accessibilityRole="button"
                    accessibilityLabel={[recipe.title, recipe.category, recipe.pending ? t("待整理") : '', recipe.favorite ? t("已收藏") : ''].filter(Boolean).join('，')}
                    onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: String(recipe.id) } })}
                    style={({ pressed }) => [styles.indexRow, pressed && styles.pressed]}>
                    {cover !== undefined && <Image source={cover} resizeMode="contain" style={styles.thumb} accessible={false} />}
                    <View style={ui.grow}>
                      <Text style={styles.indexTitle}>{recipe.title}</Text>
                      <Text style={styles.caption}>{recipe.category}{recipe.pending ? ' ' + t('· 待整理') : ''}</Text>
                    </View>
                    {recipe.favorite && <Ionicons name="heart" size={17} color={palette.accent} accessible={false} />}
                    <Ionicons name="chevron-forward" size={17} color={palette.muted} accessible={false} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecipeGallery({ items, savedKeys, onOpen }: {
  items: readonly CollectionRecipe[];
  savedKeys: ReadonlySet<string | undefined>;
  onOpen: (item: CollectionRecipe) => void;
}) {
  const { t } = useLanguage();
  return (
    <View style={[styles.inset, styles.gallery]}>
      {items.map((item) => (
        <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={t("查看{0}", item.recipe.title)}
          onPress={() => onOpen(item)} style={({ pressed }) => [styles.cover, pressed && styles.pressed]}>
          <Image source={recipeCover(item.key)} style={styles.photo} resizeMode="contain" accessible={false} />
          <View style={styles.coverCaption}>
            <Text style={styles.coverTitle}>{item.recipe.title}</Text>
            <Text style={styles.caption}>
              {item.recipe.category} · {item.minutes} {t("分钟")}{savedKeys.has(item.key) ? ' ' + t('· 已收录') : ''}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function TabLabel({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.tab, selected && styles.activeTab]}>
      <Text style={[styles.tabText, selected && styles.activeTabText]}>{title}</Text>
    </Pressable>
  );
}

function IconButton({ label, icon, onPress, filled = false, disabled = false }: {
  label: string; icon: IconName; onPress: () => void; filled?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress} style={({ pressed }) => [styles.iconButton, filled && styles.filledButton, (pressed || disabled) && styles.pressed]}>
      <Ionicons name={icon} size={22} color={filled ? palette.onAccent : palette.ink} accessible={false} />
    </Pressable>
  );
}

const rule = StyleSheet.hairlineWidth;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  page: { paddingBottom: 22 },
  book: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  inset: { marginHorizontal: 20 },
  utility: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  language: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  regions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  masthead: { paddingTop: 15, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flexShrink: 1, color: palette.ink, fontFamily: editorialFont, fontWeight: '700', fontSize: 36, letterSpacing: -1.1 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { minWidth: 44, minHeight: 44, borderWidth: rule, borderColor: palette.line, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filledButton: { backgroundColor: palette.accent, borderColor: palette.accent },
  pressed: { opacity: 0.5 },
  tabs: { flexDirection: 'row', gap: 26, borderBottomWidth: rule, borderColor: palette.line },
  tab: { minHeight: 46, justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: palette.accent },
  tabText: { fontSize: 15, color: palette.muted, fontWeight: '500' },
  activeTabText: { color: palette.accent, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 17, marginBottom: 10 },
  sectionTitle: { fontFamily: editorialFont, color: palette.ink, fontSize: 23, fontWeight: '700' },
  caption: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  search: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, marginTop: 12, borderWidth: rule, borderColor: palette.line, backgroundColor: palette.surface },
  searchField: { flex: 1, minHeight: 44, color: palette.ink, fontSize: 16 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  cover: { width: '48.5%', overflow: 'hidden', borderRadius: 14, backgroundColor: palette.surface, borderWidth: rule, borderColor: palette.line },
  photo: { width: '100%', aspectRatio: 4 / 5, backgroundColor: palette.soft },
  coverCaption: { paddingHorizontal: 10, paddingVertical: 10 },
  coverTitle: { color: palette.ink, fontFamily: editorialFont, fontSize: 19, fontWeight: '700', marginBottom: 4 },
  filters: { gap: 18, alignItems: 'center' },
  indexHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: rule, borderColor: palette.line },
  favoriteFilter: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  indexRow: { minHeight: 72, paddingVertical: 11, gap: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: rule, borderColor: palette.line },
  indexTitle: { color: palette.ink, fontFamily: editorialFont, fontSize: 22, fontWeight: '700', marginBottom: 3 },
  thumb: { width: 50, height: 50, backgroundColor: palette.soft },
  empty: { paddingHorizontal: 20, paddingVertical: 12 },
  libraryEmpty: { gap: 10, paddingVertical: 25 },
});
