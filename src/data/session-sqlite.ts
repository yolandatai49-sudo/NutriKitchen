import type { Database } from 'sql.js';
import type { KitchenDatabase } from './repository.ts';

export function createSessionDatabase(connection: Database): KitchenDatabase {
  const db: KitchenDatabase = {
    async execAsync(sql) {
      connection.exec(sql);
    },
    async runAsync(sql, ...params) {
      connection.run(sql, params);
      const row = await db.getFirstAsync<{ id: number }>('SELECT last_insert_rowid() AS id');
      return { lastInsertRowId: row?.id ?? 0 };
    },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) {
      const statement = connection.prepare(sql, params);
      try {
        const rows: T[] = [];
        while (statement.step()) rows.push(statement.getAsObject() as T);
        return rows;
      } finally {
        statement.free();
      }
    },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return (await db.getAllAsync<T>(sql, ...params))[0] ?? null;
    },
  };
  return db;
}

export function sessionSnapshot(connection: Database) {
  try {
    return connection.export();
  } finally {
    // sql.js reopens the connection when exporting and resets connection pragmas.
    connection.run('PRAGMA foreign_keys = ON');
  }
}
