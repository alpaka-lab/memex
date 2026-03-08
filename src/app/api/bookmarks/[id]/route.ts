import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const body = await request.json();
  const now = new Date();

  const updateData: Record<string, unknown> = { updatedAt: now };

  const allowedFields = [
    'url', 'title', 'description', 'ogImage', 'favicon',
    'domain', 'note', 'collectionId', 'isStarred', 'isArchived',
  ];
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const result = await db
    .update(schema.bookmarks)
    .set(updateData)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, userId)));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.id, id))
    .limit(1);

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  // Delete associated bookmark_tags first
  await db
    .delete(schema.bookmarkTags)
    .where(eq(schema.bookmarkTags.bookmarkId, id));

  const result = await db
    .delete(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, id), eq(schema.bookmarks.userId, userId)));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
