import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { generateSummary } from '@/lib/ai/generate-summary';
import type { AiProvider } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookmarkId } = await request.json();
  if (!bookmarkId) return NextResponse.json({ error: 'bookmarkId required' }, { status: 400 });

  const userId = session.user.id;

  // Get AI settings
  const settings = await db
    .select()
    .from(schema.userAiSettings)
    .where(eq(schema.userAiSettings.userId, userId))
    .limit(1);

  if (!settings.length || !settings[0].provider || !settings[0].apiKeyEncrypted) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 400 });
  }

  // Get bookmark
  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.id, bookmarkId), eq(schema.bookmarks.userId, userId)))
    .limit(1);

  if (!bookmarks.length) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });

  const bookmark = bookmarks[0];
  const aiSettings = settings[0];

  try {
    const summary = await generateSummary({
      provider: aiSettings.provider as AiProvider,
      apiKey: decrypt(aiSettings.apiKeyEncrypted!),
      title: bookmark.title,
      description: bookmark.description,
      url: bookmark.url,
      note: bookmark.note,
    });

    // Save summary to bookmark
    await db
      .update(schema.bookmarks)
      .set({ summary, updatedAt: new Date() })
      .where(eq(schema.bookmarks.id, bookmarkId));

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('AI summary generation failed:', err);
    return NextResponse.json(
      { error: 'AI generation failed. Check your API key in Settings.' },
      { status: 502 }
    );
  }
}
