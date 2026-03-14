import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookmarkId, tags } = await request.json();
  if (!bookmarkId || !Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: 'bookmarkId and tags[] required' }, { status: 400 });
  }

  const userId = session.user.id;

  // Verify bookmark belongs to user
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, bookmarkId), eq(schema.bookmarks.userId, userId)))
    .limit(1);

  if (!bookmarks.length) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });

  // Get user's existing tags
  const existingTags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, userId));

  const tagMap = new Map(existingTags.map((t) => [t.name.toLowerCase(), t.id]));
  const appliedTagIds: string[] = [];

  for (const tagName of tags as string[]) {
    const normalized = tagName.toLowerCase().trim();
    let tagId = tagMap.get(normalized);

    // Create tag if it doesn't exist
    if (!tagId) {
      tagId = createId();
      await db.insert(schema.tags).values({
        id: tagId,
        userId,
        name: normalized,
        createdAt: new Date(),
      });
      tagMap.set(normalized, tagId);
    }

    // Insert bookmark_tag (ignore if already exists)
    try {
      await db.insert(schema.bookmarkTags).values({
        bookmarkId,
        tagId,
        isAiGenerated: 1,
      });
      appliedTagIds.push(tagId);
    } catch {
      // Already exists — skip
    }
  }

  return NextResponse.json({ applied: appliedTagIds.length });
}
