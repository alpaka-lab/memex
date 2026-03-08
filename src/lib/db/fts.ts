import type Database from 'better-sqlite3';

/**
 * Initialise FTS5 virtual table and sync triggers for bookmark full-text search.
 * Safe to call multiple times — uses IF NOT EXISTS throughout.
 */
export function initFTS(sqlite: Database.Database) {
  // Only init FTS if the bookmarks table already exists (after migrations)
  const tableExists = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'")
    .get();
  if (!tableExists) return;

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS bookmarks_fts USING fts5(
      title,
      description,
      note,
      content='bookmarks',
      content_rowid='rowid'
    );
  `);

  // INSERT trigger
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS bookmarks_fts_insert
    AFTER INSERT ON bookmarks
    BEGIN
      INSERT INTO bookmarks_fts(rowid, title, description, note)
      VALUES (NEW.rowid, NEW.title, NEW.description, NEW.note);
    END;
  `);

  // UPDATE trigger
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS bookmarks_fts_update
    AFTER UPDATE ON bookmarks
    BEGIN
      INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description, note)
      VALUES ('delete', OLD.rowid, OLD.title, OLD.description, OLD.note);
      INSERT INTO bookmarks_fts(rowid, title, description, note)
      VALUES (NEW.rowid, NEW.title, NEW.description, NEW.note);
    END;
  `);

  // DELETE trigger
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS bookmarks_fts_delete
    AFTER DELETE ON bookmarks
    BEGIN
      INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description, note)
      VALUES ('delete', OLD.rowid, OLD.title, OLD.description, OLD.note);
    END;
  `);
}
