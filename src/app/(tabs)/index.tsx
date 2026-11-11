import { appName } from '../../domain/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoViewer } from '../../components/photo-viewer';
import { recipeCover } from '../../components/recipe-covers';
import { Action, Body, palette, typeStyles, ui, useTask, type IconName } from '../../components/ui';
import { sidebarWidth, useDesktopLayout } from '../../components/workspace-layout';
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
  const desktop = useDesktopLayout();
  const columns = width - (desktop ? sidebarWidth : 0) >= 1040 ? 4 : width - (desktop ? sidebarWidth : 0) >= 680 ? 3 : 2;
  const contentStyle = [styles.content, desktop && styles.desktopContent];
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

  const search = (
    <View style={[styles.search, desktop && styles.desktopSearch]}>
      <Ionicons name="search-outline" size={17} color={palette.muted} accessible={false} />
      <TextInput accessibilityLabel={t('搜索菜谱')} placeholder={t('菜名、分类或食材')} placeholderTextColor={palette.muted}
        value={query} onChangeText={setQuery} returnKeyType="search" style={styles.searchField} />
      {!!query && <IconButton label={t('清空搜索')} icon="close-circle" onPress={() => { setQuery(''); Keyboard.dismiss(); }} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={[contentStyle, styles.masthead, desktop && styles.desktopMasthead]}>
          <Text accessibilityRole="header" numberOfLines={1} style={desktop ? typeStyles.title : styles.wordmark}>
            {desktop ? t('菜谱') : appName}
          </Text>
          <View style={styles.tools}>
            {desktop ? (
              <>
                {search}
                <Action label={t('新增菜谱')} icon="add" onPress={() => router.push('/recipes/form')} />
              </>
            ) : (
              <>
                {setLanguage && <IconButton label={t('语言')} icon="globe-outline" selected={showLanguage}
                  onPress={() => setShowLanguage(!showLanguage)} />}
                <IconButton label={t('新增菜谱')} icon="add" onPress={() => router.push('/recipes/form')} />
              </>
            )}
          </View>
        </View>
        {!desktop && showLanguage && setLanguage && (
          <View style={[contentStyle, styles.language]}>
            <Filter label="中文" selected={!english} onPress={() => { setLanguage('zh'); setShowLanguage(false); }} />
            <Filter label="English" selected={english} onPress={() => { setLanguage('en'); setShowLanguage(false); }} />
          </View>
        )}
        {!desktop && <View style={contentStyle}>{search}</View>}
        <View style={[contentStyle, styles.tabs]}>
          <Tab label={t('找灵感')} selected={shelf === 'browse'} onPress={() => setShelf('browse')} />
          <Tab label={t('我的菜谱')} selected={shelf === 'mine'} onPress={() => setShelf('mine')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets>
        <View style={contentStyle}>
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
                <RecipeGallery items={suggestions} columns={columns} savedRecipes={savedRecipes} busy={busy}
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

function RecipeGallery({ items, columns, savedRecipes, busy, onOpen, onBookmark }: {
  items: readonly CollectionRecipe[];
  columns: 2 | 3 | 4;
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
          <View key={item.key} style={[styles.tile, columns === 3 && styles.thirdTile, columns === 4 && styles.quarterTile]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('查看{0}', item.recipe.title)}
              onPress={() => onOpen(item.key)} style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.photoFrame}>
                <Image source={recipeCover(item.key)} style={styles.photo} resizeMode="contain" accessible={false} />
              </View>
              <View style={styles.coverCaption}>
                <Text numberOfLines={2} style={styles.coverTitle}>{item.recipe.title}</Text>
                <Text numberOfLines={1} style={styles.caption}>{item.recipe.category} · {item.minutes} {t('分钟')}</Text>
              </View>
            </Pressable>
            <View style={styles.bookmark}>
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
  content: { width: '100%', maxWidth: 800, alignSelf: 'center', paddingHorizontal: 16 },
  desktopContent: { maxWidth: 1180, alignSelf: 'flex-start', paddingHorizontal: 36 },
  masthead: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  desktopMasthead: { minHeight: 77 },
  wordmark: { ...typeStyles.section, flexShrink: 1, fontSize: 18 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  language: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 6, paddingBottom: 6 },
  search: { flexDirection: 'row', alignItems: 'center', paddingLeft: 11, gap: 7, backgroundColor: palette.soft, borderRadius: 6 },
  desktopSearch: { width: 255, marginRight: 6 },
  searchField: { ...typeStyles.label, fontWeight: '400', flex: 1, minWidth: 0, minHeight: 43, outlineColor: palette.accent },
  tabs: { flexDirection: 'row', gap: 23 },
  tab: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: palette.accent },
  tabText: { ...typeStyles.body, fontSize: 14 },
  activeTabText: { color: palette.ink, fontWeight: '600' },
  page: { paddingTop: 10, paddingBottom: 26 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filter: { minHeight: 40, paddingHorizontal: 11, borderRadius: 5, justifyContent: 'center' },
  selectedFilter: { backgroundColor: palette.soft },
  filterText: { ...typeStyles.body, fontSize: 14 },
  selectedFilterText: { color: palette.ink, fontWeight: '500' },
  indexHeader: { flexDirection: 'row', minHeight: 44, justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  caption: typeStyles.caption,
  photoMode: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoModeText: { ...typeStyles.label, fontSize: 13 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '1.8%', rowGap: 16 },
  tile: { width: '49%' },
  thirdTile: { width: '32%' },
  quarterTile: { width: '23.6%' },
  photoFrame: { width: '100%', aspectRatio: 4 / 5, borderRadius: 6, overflow: 'hidden', backgroundColor: palette.soft },
  photo: { width: '100%', height: '100%' },
  coverCaption: { paddingTop: 7, paddingLeft: 1, paddingRight: 45, minHeight: 52 },
  coverTitle: typeStyles.label,
  bookmark: { position: 'absolute', bottom: 4, right: 0 },
  indexRow: { minHeight: 70, paddingVertical: 9, gap: 12, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: rule, borderColor: palette.line },
  thumb: { width: 48, height: 56, borderRadius: 6, backgroundColor: palette.soft },
  empty: { gap: 8, paddingVertical: 26 },
});
