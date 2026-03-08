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

  const updateData: Record<string, unknown> = {};
  if ('name' in body) updateData.name = body.name;
  if ('color' in body) updateData.color = body.color;

  const result = await db
    .update(schema.tags)
    .set(updateData)
    .where(and(eq(schema.tags.id, id), eq(schema.tags.userId, userId)));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
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

  // Remove tag associations first
  await db
    .delete(schema.bookmarkTags)
    .where(eq(schema.bookmarkTags.tagId, id));

  const result = await db
    .delete(schema.tags)
    .where(and(eq(schema.tags.id, id), eq(schema.tags.userId, userId)));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
