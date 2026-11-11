import assert from 'node:assert/strict';
import test from 'node:test';
import initSqlJs from 'sql.js';
import { initializeDatabase, kitchenActions, loadKitchen } from '../src/data/repository.ts';
import { createSessionDatabase, sessionSnapshot } from '../src/data/session-sqlite.ts';

test('temporary SQLite restores saved rows and keeps foreign keys after a snapshot', async () => {
  const sql = await initSqlJs();
  const connection = new sql.Database();
  try {
    const db = createSessionDatabase(connection);
    await initializeDatabase(db);
    const actions = kitchenActions(db);
    const id = await actions.saveRecipe({ title: '测试菜谱', category: '其他', ingredients: [], steps: [], sourceUrl: null, pending: false });
    await actions.saveMeal({ name: '测试菜单', day: '2026-11-11', recipeIds: [id] });

    const restored = new sql.Database(sessionSnapshot(connection));
    try {
      const restoredDb = createSessionDatabase(restored);
      await initializeDatabase(restoredDb);
      assert.deepEqual((await loadKitchen(restoredDb)).meals[0].recipeIds, [id]);
    } finally {
      restored.close();
    }

    await actions.deleteRecipe(id);
    assert.deepEqual((await loadKitchen(db)).meals[0].recipeIds, []);
  } finally {
    connection.close();
  }
});
