import { usePathname } from 'expo-router';
import { appName } from '../domain/brand';
import { recipeCollection } from '../domain/recipe-collection';

export function KitchenStarting() {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  return (
    <main style={{ flex: 1, overflowY: 'auto', background: '#fff', color: '#292824', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <h1>{appName}</h1>
        <p>浏览家常菜谱，管理冰箱食材和购物清单，记录每日营养。</p>
        <h2>找灵感 · {recipeCollection.length} 道菜</h2>
        <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
          {recipeCollection.slice(0, 6).map(({ key, minutes, recipe }) => (
            <li key={key}><a href={`/recipes/collection/${key}`}>{recipe.title}</a> · {minutes} 分钟</li>
          ))}
        </ul>
        <noscript><p>开启 JavaScript 可查看完整菜谱、保存收藏和使用食材管理。</p></noscript>
      </div>
    </main>
  );
}
