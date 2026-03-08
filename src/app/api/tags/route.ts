import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const tags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, userId));

  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const now = new Date();

  const tag = {
    id: createId(),
    userId,
    name: body.name,
    color: body.color ?? null,
    createdAt: now,
  };

  await db.insert(schema.tags).values(tag);

  return NextResponse.json(tag, { status: 201 });
}
