import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ── Auth tables (better-auth compatible) ──────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
  token: text('token').unique(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
  accountId: text('accountId'),
  providerId: text('providerId'),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('idToken'),
  password: text('password'),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier'),
  value: text('value'),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

// ── App tables ────────────────────────────────────────────────────────

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  parentId: text('parentId').references((): ReturnType<typeof text> => collections.id),
  sortOrder: integer('sortOrder').default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id),
    url: text('url').notNull(),
    title: text('title'),
    description: text('description'),
    ogImage: text('ogImage'),
    favicon: text('favicon'),
    domain: text('domain'),
    note: text('note'),
    summary: text('summary'),
    collectionId: text('collectionId').references(() => collections.id),
    isStarred: integer('isStarred').default(0),
    isArchived: integer('isArchived').default(0),
    createdAt: integer('createdAt', { mode: 'timestamp' }),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }),
  },
  (table) => [
    index('bookmarks_userId_createdAt_idx').on(table.userId, table.createdAt),
    index('bookmarks_userId_isStarred_idx').on(table.userId, table.isStarred),
    index('bookmarks_userId_collectionId_idx').on(table.userId, table.collectionId),
  ]
);

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: integer('createdAt', { mode: 'timestamp' }),
  },
  (table) => [
    uniqueIndex('tags_userId_name_idx').on(table.userId, table.name),
  ]
);

export const bookmarkTags = sqliteTable(
  'bookmark_tags',
  {
    bookmarkId: text('bookmarkId')
      .notNull()
      .references(() => bookmarks.id),
    tagId: text('tagId')
      .notNull()
      .references(() => tags.id),
    isAiGenerated: integer('isAiGenerated').default(0),
  },
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.tagId] }),
  ]
);

export const userAiSettings = sqliteTable('user_ai_settings', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => users.id),
  provider: text('provider'),
  apiKeyEncrypted: text('apiKeyEncrypted'),
  autoTagEnabled: integer('autoTagEnabled').default(0),
  autoSummaryEnabled: integer('autoSummaryEnabled').default(0),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

// ── Type exports ──────────────────────────────────────────────────────

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type UserAiSettings = typeof userAiSettings.$inferSelect;
export type NewUserAiSettings = typeof userAiSettings.$inferInsert;
