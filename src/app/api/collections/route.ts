import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const collections = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.userId, userId))
    .orderBy(asc(schema.collections.sortOrder));

  return NextResponse.json(collections);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const now = new Date();

  const collection = {
    id: createId(),
    userId,
    name: body.name,
    description: body.description ?? null,
    icon: body.icon ?? null,
    parentId: body.parentId ?? null,
    sortOrder: body.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.collections).values(collection);

  return NextResponse.json(collection, { status: 201 });
}
