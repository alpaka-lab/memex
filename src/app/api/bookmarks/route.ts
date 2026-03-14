import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db, sqlite } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, and, desc, asc, lt, gt, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = request.nextUrl;
  const collectionId = searchParams.get('collectionId');
  const tag = searchParams.get('tag');
  const starred = searchParams.get('starred');
  const archived = searchParams.get('archived');
  const search = searchParams.get('search');
  const cursor = searchParams.get('cursor');
  const sort = searchParams.get('sort'); // newest (default), oldest, title-asc, title-desc, domain
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  const conditions = [eq(schema.bookmarks.userId, userId)];

  if (collectionId) {
    conditions.push(eq(schema.bookmarks.collectionId, collectionId));
  }
  if (starred === '1' || starred === 'true') {
    conditions.push(eq(schema.bookmarks.isStarred, 1));
  }
  if (archived === '1' || archived === 'true') {
    conditions.push(eq(schema.bookmarks.isArchived, 1));
  }

  // Determine sort order and cursor direction
  const getOrderBy = () => {
    switch (sort) {
      case 'oldest':
        return asc(schema.bookmarks.createdAt);
      case 'title-asc':
        return asc(schema.bookmarks.title);
      case 'title-desc':
        return desc(schema.bookmarks.title);
      case 'domain':
        return asc(schema.bookmarks.domain);
      default:
        return desc(schema.bookmarks.createdAt);
    }
  };

  if (cursor) {
    if (sort === 'oldest') {
      conditions.push(gt(schema.bookmarks.createdAt, new Date(cursor)));
    } else if (sort === 'title-asc') {
      conditions.push(gt(schema.bookmarks.title, cursor));
    } else if (sort === 'title-desc') {
      conditions.push(lt(schema.bookmarks.title, cursor));
    } else if (sort === 'domain') {
      conditions.push(gt(schema.bookmarks.domain, cursor));
    } else {
      conditions.push(lt(schema.bookmarks.createdAt, new Date(cursor)));
    }
  }

  let query = db
    .select()
    .from(schema.bookmarks)
    .where(and(...conditions))
    .orderBy(getOrderBy())
    .limit(limit + 1);

  // If filtering by tag, join through bookmarkTags
  if (tag) {
    const tagRow = await db
      .select()
      .from(schema.tags)
      .where(and(eq(schema.tags.userId, userId), eq(schema.tags.name, tag)))
      .limit(1);

    if (tagRow.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null });
    }

    const bookmarkIds = await db
      .select({ bookmarkId: schema.bookmarkTags.bookmarkId })
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.tagId, tagRow[0].id));

    if (bookmarkIds.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null });
    }

    const ids = bookmarkIds.map((r) => r.bookmarkId);
    conditions.push(
      sql`${schema.bookmarks.id} IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

    query = db
      .select()
      .from(schema.bookmarks)
      .where(and(...conditions))
      .orderBy(getOrderBy())
      .limit(limit + 1);
  }

  // FTS search filter
  if (search) {
    const stmt = sqlite.prepare(
      `SELECT b.id FROM bookmarks b
       INNER JOIN bookmarks_fts fts ON b.rowid = fts.rowid
       WHERE bookmarks_fts MATCH ? AND b.userId = ?`
    );
    const ftsResults = stmt.all(search, userId) as { id: string }[];

    if (ftsResults.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null });
    }

    const ids = ftsResults.map((r) => r.id);
    conditions.push(
      sql`${schema.bookmarks.id} IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

    query = db
      .select()
      .from(schema.bookmarks)
      .where(and(...conditions))
      .orderBy(getOrderBy())
      .limit(limit + 1);
  }

  const results = await query;

  let nextCursor: string | null = null;
  if (results.length > limit) {
    results.pop();
    const last = results[results.length - 1];
    if (sort === 'title-asc' || sort === 'title-desc') {
      nextCursor = last.title ?? null;
    } else if (sort === 'domain') {
      nextCursor = last.domain ?? null;
    } else {
      nextCursor = last.createdAt?.toISOString() ?? null;
    }
  }

  return NextResponse.json({ data: results, nextCursor });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const now = new Date();

  const bookmark = {
    id: createId(),
    userId,
    url: body.url,
    title: body.title ?? null,
    description: body.description ?? null,
    ogImage: body.ogImage ?? null,
    favicon: body.favicon ?? null,
    domain: body.domain ?? null,
    note: body.note ?? null,
    collectionId: body.collectionId ?? null,
    isStarred: body.isStarred ?? 0,
    isArchived: body.isArchived ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.bookmarks).values(bookmark);

  return NextResponse.json(bookmark, { status: 201 });
}
