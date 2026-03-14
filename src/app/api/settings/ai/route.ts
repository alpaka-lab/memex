import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/crypto';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await db
    .select()
    .from(schema.userAiSettings)
    .where(eq(schema.userAiSettings.userId, session.user.id))
    .limit(1);

  if (settings.length === 0) {
    return NextResponse.json({
      provider: null,
      hasApiKey: false,
      autoTagEnabled: false,
      autoSummaryEnabled: false,
    });
  }

  const s = settings[0];
  return NextResponse.json({
    provider: s.provider,
    hasApiKey: !!s.apiKeyEncrypted,
    autoTagEnabled: !!s.autoTagEnabled,
    autoSummaryEnabled: !!s.autoSummaryEnabled,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { provider, apiKey, autoTagEnabled, autoSummaryEnabled } = body;
  const userId = session.user.id;
  const now = new Date();

  const existing = await db
    .select()
    .from(schema.userAiSettings)
    .where(eq(schema.userAiSettings.userId, userId))
    .limit(1);

  const updateData: Record<string, unknown> = { updatedAt: now };
  if (provider !== undefined) updateData.provider = provider;
  if (apiKey !== undefined) updateData.apiKeyEncrypted = apiKey ? encrypt(apiKey) : null;
  if (autoTagEnabled !== undefined) updateData.autoTagEnabled = autoTagEnabled ? 1 : 0;
  if (autoSummaryEnabled !== undefined) updateData.autoSummaryEnabled = autoSummaryEnabled ? 1 : 0;

  if (existing.length > 0) {
    await db
      .update(schema.userAiSettings)
      .set(updateData)
      .where(eq(schema.userAiSettings.userId, userId));
  } else {
    await db.insert(schema.userAiSettings).values({
      id: createId(),
      userId,
      provider: provider ?? null,
      apiKeyEncrypted: apiKey ? encrypt(apiKey) : null,
      autoTagEnabled: autoTagEnabled ? 1 : 0,
      autoSummaryEnabled: autoSummaryEnabled ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ success: true });
}
