import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Badge, Body, Card, Chip, Empty, Field, Page, Row, ui } from '../../components/ui';
import { useKitchen } from '../../data/kitchen';
import { filterRecipes } from '../../domain/recipes';

export default function RecipesScreen() {
  const router = useRouter();
  const { data: { recipes } } = useKitchen();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const categories = [...new Set(recipes.map((recipe) => recipe.category))].sort((a, b) => a.localeCompare(b, 'zh'));
  const activeCategory = category !== null && categories.includes(category) ? category : null;
  const visible = filterRecipes(recipes, query, activeCategory, favoritesOnly);

  return (
    <Page title="今天吃什么" subtitle="你的私人菜谱" headerAction={
      <Action label="新增菜谱" icon="add" onPress={() => router.push('/recipes/form')} />
    }>
      <Field label="搜索菜谱" placeholder="菜名、分类或食材" value={query} onChangeText={setQuery} returnKeyType="search" clearButtonMode="while-editing" />
      <Row wrap>
        <Chip label="全部分类" selected={activeCategory === null} onPress={() => setCategory(null)} />
        {categories.map((item) => (
          <Chip key={item} label={item} selected={activeCategory === item} onPress={() => setCategory(item)} />
        ))}
      </Row>
      <Row>
        <Chip label="只看收藏" selected={favoritesOnly} onPress={() => setFavoritesOnly(!favoritesOnly)} />
        <Body>{visible.length} 道菜</Body>
      </Row>
      {visible.length === 0 && (
        <Empty icon="book-outline" title={recipes.length ? '没有符合条件的菜谱' : '还没有菜谱'}
          description={recipes.length ? '试试其他关键词或分类。' : '添加一道拿手菜，或粘贴小红书链接留待整理。'} />
      )}
      {visible.map((recipe) => (
        <Card key={recipe.id}>
          <Row>
            <View style={[ui.grow, ui.stack]}>
              <Text style={ui.itemTitle}>{recipe.title}</Text>
              <Row wrap>
                <Badge>{recipe.category}</Badge>
                {recipe.favorite && <Badge>已收藏</Badge>}
                {recipe.pending && <Badge warm>待整理</Badge>}
              </Row>
            </View>
            <Action label="查看" variant="quiet" icon="chevron-forward" onPress={() => router.push({
              pathname: '/recipes/[id]', params: { id: String(recipe.id) },
            })} />
          </Row>
          {!!recipe.ingredients.length && <Body>{recipe.ingredients.map((item) => item.name).join(' · ')}</Body>}
        </Card>
      ))}
    </Page>
  );
}
