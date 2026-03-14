import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const { ids, action, data } = body as {
    ids: string[];
    action: 'delete' | 'archive' | 'unarchive' | 'star' | 'unstar' | 'move';
    data?: { collectionId?: string | null };
  };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No bookmark IDs provided' }, { status: 400 });
  }

  if (!action) {
    return NextResponse.json({ error: 'No action provided' }, { status: 400 });
  }

  // Verify all bookmarks belong to user
  const userBookmarks = await db
    .select({ id: schema.bookmarks.id })
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, ids)));

  const validIds = userBookmarks.map((b) => b.id);
  if (validIds.length === 0) {
    return NextResponse.json({ error: 'No valid bookmarks found' }, { status: 404 });
  }

  const now = new Date();

  switch (action) {
    case 'delete':
      // Delete associated tags first
      await db
        .delete(schema.bookmarkTags)
        .where(inArray(schema.bookmarkTags.bookmarkId, validIds));
      await db
        .delete(schema.bookmarks)
        .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, validIds)));
      break;

    case 'archive':
      await db
        .update(schema.bookmarks)
        .set({ isArchived: 1, updatedAt: now })
        .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, validIds)));
      break;

    case 'unarchive':
      await db
        .update(schema.bookmarks)
        .set({ isArchived: 0, updatedAt: now })
        .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, validIds)));
      break;

    case 'star':
      await db
        .update(schema.bookmarks)
        .set({ isStarred: 1, updatedAt: now })
        .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, validIds)));
      break;

    case 'unstar':
      await db
        .update(schema.bookmarks)
        .set({ isStarred: 0, updatedAt: now })
        .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, validIds)));
      break;

    case 'move':
      await db
        .update(schema.bookmarks)
        .set({ collectionId: data?.collectionId ?? null, updatedAt: now })
        .where(and(eq(schema.bookmarks.userId, userId), inArray(schema.bookmarks.id, validIds)));
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ success: true, affected: validIds.length });
}
