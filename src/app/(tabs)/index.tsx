import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoViewer } from '../../components/photo-viewer';
import { recipeCover } from '../../components/recipe-covers';
import { Action, Body, palette, ui, useTask, type IconName } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { useLanguage } from '../../data/language';
import { categoryEnglish, localizeCollection, presentSavedRecipe, recipeCollection, type CollectionRecipe } from '../../domain/recipe-collection';
import { filterRecipes, matchesRecipeSearch, normalizeName } from '../../domain/recipes';

type Region = 'all' | 'chinese' | 'american';

export default function RecipesScreen() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const { data: { recipes }, write } = useKitchen();
  const { busy, run } = useTask();
  const { width } = useWindowDimensions();
  const english = language === 'en';
  const [shelf, setShelf] = useState<'browse' | 'mine'>('browse');
  const [showLanguage, setShowLanguage] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
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
  const savedRecipes = new Map(recipes.flatMap((recipe) => recipe.collectionKey ? [[recipe.collectionKey, recipe.id] as const] : []));
  const current = photoIndex === null ? undefined : suggestions[photoIndex];
  const photo = recipeCover(current?.key);

  function openSuggestion(key: string) {
    setPhotoIndex(null);
    router.push({ pathname: '/recipes/collection/[key]', params: { key } });
  }

  function openSaved(id: number) {
    router.push({ pathname: '/recipes/[id]', params: { id: String(id) } });
  }

  function bookmark(key: string) {
    const savedId = savedRecipes.get(key);
    if (savedId !== undefined) {
      openSaved(savedId);
      return;
    }
    const original = recipeCollection.find((entry) => entry.key === key);
    if (original) void run(() => write((actions) => actions.importRecipe(original.recipe, key)));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={[styles.content, styles.masthead]}>
          <View style={styles.brand}>
            <View style={styles.mark}><Ionicons name="restaurant" size={17} color="#fff" accessible={false} /></View>
            <Text accessibilityRole="header" numberOfLines={1} style={styles.wordmark}>{t('今天吃什么')}</Text>
          </View>
          <View style={styles.tools}>
            {setLanguage && <IconButton label={t('语言')} icon="globe-outline" selected={showLanguage}
              onPress={() => setShowLanguage(!showLanguage)} />}
            <IconButton label={t('新增菜谱')} icon="add-circle-outline" onPress={() => router.push('/recipes/form')} />
          </View>
        </View>
        {showLanguage && setLanguage && (
          <View style={[styles.content, styles.language]}>
            <Filter label="中文" selected={!english} onPress={() => { setLanguage('zh'); setShowLanguage(false); }} />
            <Filter label="English" selected={english} onPress={() => { setLanguage('en'); setShowLanguage(false); }} />
          </View>
        )}
        <View style={[styles.content, styles.search]}>
          <Ionicons name="search-outline" size={18} color={palette.muted} accessible={false} />
          <TextInput accessibilityLabel={t('搜索菜谱')} placeholder={t('菜名、分类或食材')} placeholderTextColor={palette.muted}
            value={query} onChangeText={setQuery} returnKeyType="search" style={styles.searchField} />
          {!!query && <IconButton label={t('清空搜索')} icon="close-circle" onPress={() => { setQuery(''); Keyboard.dismiss(); }} />}
        </View>
        <View style={[styles.content, styles.tabs]}>
          <Tab label={t('找灵感')} selected={shelf === 'browse'} onPress={() => setShelf('browse')} />
          <Tab label={t('我的菜谱')} selected={shelf === 'mine'} onPress={() => setShelf('mine')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          {shelf === 'browse' ? (
            <>
              <View style={styles.filters}>
                <Filter label={t('全部')} selected={region === 'all'} onPress={() => setRegion('all')} />
                <Filter label={t('中式家常')} selected={region === 'chinese'} onPress={() => setRegion('chinese')} />
                <Filter label={t('美国日常')} selected={region === 'american'} onPress={() => setRegion('american')} />
              </View>
              <View style={styles.indexHeader}>
                <Text style={styles.caption}>{suggestions.length} {t('道菜')}</Text>
                {suggestions.length > 0 && (
                  <Pressable accessibilityRole="button" accessibilityLabel={t('看大图')} onPress={() => setPhotoIndex(0)} style={styles.photoMode}>
                    <Ionicons name="images-outline" size={18} color={palette.ink} accessible={false} />
                    <Text style={styles.photoModeText}>{t('看大图')}</Text>
                  </Pressable>
                )}
              </View>
              {suggestions.length > 0 ? (
                <RecipeGallery items={suggestions} wide={width >= 850} savedRecipes={savedRecipes} busy={busy}
                  onOpen={openSuggestion} onBookmark={bookmark} />
              ) : <View style={styles.empty}><Body>{t('没有找到符合条件的菜谱。')}</Body></View>}
            </>
          ) : (
            <>
              <View style={styles.filters}>
                <Filter label={t('全部')} selected={activeCategory === null} onPress={() => setCategory(null)} />
                {categories.map((item) => (
                  <Filter key={item} label={english ? categoryEnglish[item] ?? item : item}
                    selected={activeCategory === item} onPress={() => setCategory(item)} />
                ))}
              </View>
              <View style={styles.indexHeader}>
                <Text style={styles.caption}>{visible.length} {t('道菜')}</Text>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: favoritesOnly }}
                  accessibilityLabel={t('只看收藏')} onPress={() => setFavoritesOnly(!favoritesOnly)} style={styles.photoMode}>
                  <Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={19}
                    color={favoritesOnly ? palette.accent : palette.ink} accessible={false} />
                  <Text style={styles.photoModeText}>{t('只看收藏')}</Text>
                </Pressable>
              </View>
              {!visible.length && (
                <View style={styles.empty}>
                  <Text accessibilityRole="header" style={styles.coverTitle}>
                    {recipes.length ? t('没有符合条件的菜谱') : t('还没有菜谱')}
                  </Text>
                  <Body>{recipes.length ? t('试试其他关键词或分类。') : t('收录一道家常菜，或写下自己的做法。')}</Body>
                  {!recipes.length && <Action label={t('找灵感')} variant="quiet" onPress={() => setShelf('browse')} />}
                </View>
              )}
              {visible.map((recipe) => {
                const cover = recipeCover(recipe.collectionKey);
                return (
                  <Pressable key={recipe.id} accessibilityRole="button"
                    accessibilityLabel={[recipe.title, recipe.category, recipe.pending ? t('待整理') : '', recipe.favorite ? t('已收藏') : ''].filter(Boolean).join('，')}
                    onPress={() => openSaved(recipe.id)} style={({ pressed }) => [styles.indexRow, pressed && styles.pressed]}>
                    {cover !== undefined && <Image source={cover} resizeMode="contain" style={styles.thumb} accessible={false} />}
                    <View style={ui.grow}>
                      <Text style={styles.coverTitle}>{recipe.title}</Text>
                      <Text style={styles.caption}>{recipe.category}{recipe.pending ? ' ' + t('· 待整理') : ''}</Text>
                    </View>
                    {recipe.favorite && <Ionicons name="heart" size={17} color={palette.accent} accessible={false} />}
                    <Ionicons name="chevron-forward" size={17} color={palette.muted} accessible={false} />
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
      {current && photo !== undefined && photoIndex !== null && (
        <PhotoViewer photo={photo} title={current.recipe.title} position={`${photoIndex + 1} / ${suggestions.length}`}
          caption={`${current.recipe.category} · ${current.minutes} ${t('分钟')}`}
          onClose={() => setPhotoIndex(null)} onRecipe={() => openSuggestion(current.key)}
          onPrevious={photoIndex > 0 ? () => setPhotoIndex(photoIndex - 1) : undefined}
          onNext={photoIndex + 1 < suggestions.length ? () => setPhotoIndex(photoIndex + 1) : undefined} />
      )}
    </SafeAreaView>
  );
}

function RecipeGallery({ items, wide, savedRecipes, busy, onOpen, onBookmark }: {
  items: readonly CollectionRecipe[];
  wide: boolean;
  savedRecipes: ReadonlyMap<string, number>;
  busy: boolean;
  onOpen: (key: string) => void;
  onBookmark: (key: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.gallery}>
      {items.map((item) => {
        const saved = savedRecipes.has(item.key);
        return (
          <View key={item.key} style={[styles.tile, wide && styles.wideTile]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('查看{0}', item.recipe.title)}
              onPress={() => onOpen(item.key)} style={({ pressed }) => [styles.photoFrame, pressed && styles.pressed]}>
              <Image source={recipeCover(item.key)} style={styles.photo} resizeMode="contain" accessible={false} />
            </Pressable>
            <View style={styles.coverCaption}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('查看{0}的做法', item.recipe.title)}
                onPress={() => onOpen(item.key)} style={ui.grow}>
                <Text numberOfLines={2} style={styles.coverTitle}>{item.recipe.title}</Text>
                <Text numberOfLines={1} style={styles.caption}>{item.recipe.category} · {item.minutes} {t('分钟')}</Text>
              </Pressable>
              <IconButton label={t(saved ? '打开已收录的{0}' : '收录{0}', item.recipe.title)}
                icon={saved ? 'bookmark' : 'bookmark-outline'} selected={saved}
                disabled={busy && !saved} onPress={() => onBookmark(item.key)} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Tab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.tab, selected && styles.activeTab]}>
      <Text style={[styles.tabText, selected && styles.activeTabText]}>{label}</Text>
    </Pressable>
  );
}

function Filter({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.filter, selected && styles.selectedFilter]}>
      <Text style={[styles.filterText, selected && styles.selectedFilterText]}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ label, icon, onPress, selected = false, disabled = false }: {
  label: string; icon: IconName; onPress: () => void; selected?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && styles.pressed]}>
      <Ionicons name={icon} size={22} color={selected ? palette.accent : palette.ink} accessible={false} />
    </Pressable>
  );
}

const rule = StyleSheet.hairlineWidth;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  header: { borderBottomWidth: rule, borderBottomColor: palette.line, backgroundColor: palette.surface },
  content: { width: '100%', maxWidth: 948, alignSelf: 'center', paddingHorizontal: 15 },
  masthead: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 31, height: 31, borderRadius: 10, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  wordmark: { flexShrink: 1, color: palette.ink, fontWeight: '800', fontSize: 23, letterSpacing: -0.7 },
  tools: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  language: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 6, paddingBottom: 6 },
  search: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, width: '92%', maxWidth: 918,
    backgroundColor: palette.soft, borderRadius: 11 },
  searchField: { flex: 1, minHeight: 44, color: palette.ink, fontSize: 15, outlineColor: palette.accent },
  tabs: { flexDirection: 'row', gap: 26 },
  tab: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: palette.accent },
  tabText: { fontSize: 16, color: palette.muted, fontWeight: '500' },
  activeTabText: { color: palette.ink, fontWeight: '800' },
  page: { paddingTop: 10, paddingBottom: 26 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filter: { minHeight: 44, paddingHorizontal: 13, borderRadius: 20, justifyContent: 'center', backgroundColor: palette.soft },
  selectedFilter: { backgroundColor: palette.ink },
  filterText: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  selectedFilterText: { color: '#fff' },
  indexHeader: { flexDirection: 'row', minHeight: 44, justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  caption: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  photoMode: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoModeText: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '1.8%', rowGap: 16 },
  tile: { width: '49%', gap: 4 },
  wideTile: { width: '32%' },
  photoFrame: { width: '100%', aspectRatio: 4 / 5, borderRadius: 9, overflow: 'hidden', backgroundColor: palette.soft },
  photo: { width: '100%', height: '100%' },
  coverCaption: { flexDirection: 'row', alignItems: 'center', paddingLeft: 1 },
  coverTitle: { color: palette.ink, fontSize: 16, fontWeight: '700', lineHeight: 21 },
  indexRow: { minHeight: 70, paddingVertical: 9, gap: 12, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: rule, borderColor: palette.line },
  thumb: { width: 48, height: 56, borderRadius: 6, backgroundColor: palette.soft },
  empty: { gap: 8, paddingVertical: 26 },
});
