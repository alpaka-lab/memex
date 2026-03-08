import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { initFTS } from './fts';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/memex.db';
const filePath = databaseUrl.replace(/^file:/, '');

export const sqlite = new Database(filePath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Initialise FTS5 virtual table + triggers
initFTS(sqlite);
