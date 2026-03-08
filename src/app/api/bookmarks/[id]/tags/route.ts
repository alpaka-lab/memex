import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: bookmarkId } = await params;

  // Verify bookmark belongs to user
  const bookmark = await db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, bookmarkId), eq(schema.bookmarks.userId, userId)))
    .limit(1);

  if (bookmark.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const tags = await db
    .select({ tag: schema.tags })
    .from(schema.bookmarkTags)
    .innerJoin(schema.tags, eq(schema.bookmarkTags.tagId, schema.tags.id))
    .where(eq(schema.bookmarkTags.bookmarkId, bookmarkId));

  return NextResponse.json(tags.map((r) => r.tag));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: bookmarkId } = await params;

  // Verify bookmark belongs to user
  const bookmark = await db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, bookmarkId), eq(schema.bookmarks.userId, userId)))
    .limit(1);

  if (bookmark.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { tagId } = body;

  // Verify tag belongs to user
  const tag = await db
    .select()
    .from(schema.tags)
    .where(and(eq(schema.tags.id, tagId), eq(schema.tags.userId, userId)))
    .limit(1);

  if (tag.length === 0) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  await db
    .insert(schema.bookmarkTags)
    .values({ bookmarkId, tagId })
    .onConflictDoNothing();

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: bookmarkId } = await params;

  // Verify bookmark belongs to user
  const bookmark = await db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, bookmarkId), eq(schema.bookmarks.userId, userId)))
    .limit(1);

  if (bookmark.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { tagId } = body;

  await db
    .delete(schema.bookmarkTags)
    .where(
      and(
        eq(schema.bookmarkTags.bookmarkId, bookmarkId),
        eq(schema.bookmarkTags.tagId, tagId)
      )
    );

  return NextResponse.json({ success: true });
}
