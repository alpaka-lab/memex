import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

interface ParsedBookmark {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  folder?: string;
  addDate?: number;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const contentType = request.headers.get('content-type') ?? '';
  let bookmarksToImport: ParsedBookmark[] = [];

  if (contentType.includes('application/json')) {
    const body = await request.json();

    // Memex JSON format
    if (body.version && body.bookmarks) {
      return NextResponse.json(
        { error: 'Memex JSON import is not yet supported. Use HTML format.' },
        { status: 400 }
      );
    }

    // Simple JSON array of bookmarks
    if (Array.isArray(body)) {
      bookmarksToImport = body.map((b: Record<string, unknown>) => ({
        url: String(b.url ?? ''),
        title: String(b.title ?? b.url ?? ''),
        description: b.description ? String(b.description) : undefined,
        tags: Array.isArray(b.tags) ? b.tags.map(String) : undefined,
        folder: b.folder ? String(b.folder) : undefined,
      }));
    }
  } else {
    // HTML bookmark format
    const text = await request.text();
    bookmarksToImport = parseNetscapeBookmarks(text);
  }

  // Filter out invalid entries
  bookmarksToImport = bookmarksToImport.filter(
    (b) => b.url && (b.url.startsWith('http://') || b.url.startsWith('https://'))
  );

  if (bookmarksToImport.length === 0) {
    return NextResponse.json({ error: 'No valid bookmarks found' }, { status: 400 });
  }

  // Process imports
  const now = new Date();
  let imported = 0;
  let skipped = 0;

  // Collect unique tags and folders
  const tagNames = new Set<string>();
  const folderNames = new Set<string>();
  for (const b of bookmarksToImport) {
    b.tags?.forEach((t) => tagNames.add(t));
    if (b.folder) folderNames.add(b.folder);
  }

  // Ensure tags exist
  const tagIdMap = new Map<string, string>();
  const existingTags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, userId));

  for (const t of existingTags) {
    tagIdMap.set(t.name, t.id);
  }
  for (const name of tagNames) {
    if (!tagIdMap.has(name)) {
      const id = createId();
      await db.insert(schema.tags).values({ id, userId, name, createdAt: now });
      tagIdMap.set(name, id);
    }
  }

  // Ensure collections exist for folders
  const collectionIdMap = new Map<string, string>();
  const existingCollections = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.userId, userId));

  for (const c of existingCollections) {
    collectionIdMap.set(c.name, c.id);
  }
  for (const name of folderNames) {
    if (!collectionIdMap.has(name)) {
      const id = createId();
      await db.insert(schema.collections).values({
        id,
        userId,
        name,
        sortOrder: existingCollections.length + collectionIdMap.size,
        createdAt: now,
        updatedAt: now,
      });
      collectionIdMap.set(name, id);
    }
  }

  // Get existing bookmark URLs to skip duplicates
  const existingBookmarks = await db
    .select({ url: schema.bookmarks.url })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, userId));
  const existingUrls = new Set(existingBookmarks.map((b) => b.url));

  // Insert bookmarks
  for (const b of bookmarksToImport) {
    if (existingUrls.has(b.url)) {
      skipped++;
      continue;
    }

    let domain = '';
    try {
      domain = new URL(b.url).hostname;
    } catch {
      // ignore
    }

    const bookmarkId = createId();
    const createdAt = b.addDate ? new Date(b.addDate * 1000) : now;

    await db.insert(schema.bookmarks).values({
      id: bookmarkId,
      userId,
      url: b.url,
      title: b.title || b.url,
      description: b.description ?? null,
      domain,
      collectionId: b.folder ? (collectionIdMap.get(b.folder) ?? null) : null,
      isStarred: 0,
      isArchived: 0,
      createdAt,
      updatedAt: now,
    });

    // Add tags
    if (b.tags) {
      for (const tagName of b.tags) {
        const tagId = tagIdMap.get(tagName);
        if (tagId) {
          await db
            .insert(schema.bookmarkTags)
            .values({ bookmarkId, tagId })
            .onConflictDoNothing();
        }
      }
    }

    imported++;
    existingUrls.add(b.url);
  }

  return NextResponse.json({
    imported,
    skipped,
    total: bookmarksToImport.length,
  });
}

function parseNetscapeBookmarks(html: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = [];
  const folderStack: string[] = [];

  const lines = html.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Track folder hierarchy
    const folderMatch = line.match(/<H3[^>]*>(.*?)<\/H3>/i);
    if (folderMatch) {
      folderStack.push(decodeHtmlEntities(folderMatch[1]));
      continue;
    }

    if (line.includes('</DL>')) {
      folderStack.pop();
      continue;
    }

    // Parse bookmark
    const linkMatch = line.match(/<A\s+([^>]*)>(.*?)<\/A>/i);
    if (linkMatch) {
      const attrs = linkMatch[1];
      const title = decodeHtmlEntities(linkMatch[2]);

      const hrefMatch = attrs.match(/HREF="([^"]*)"/i);
      const addDateMatch = attrs.match(/ADD_DATE="(\d+)"/i);
      const tagsMatch = attrs.match(/TAGS="([^"]*)"/i);

      if (hrefMatch) {
        const bookmark: ParsedBookmark = {
          url: hrefMatch[1],
          title,
          folder: folderStack.length > 0 ? folderStack[folderStack.length - 1] : undefined,
          addDate: addDateMatch ? parseInt(addDateMatch[1], 10) : undefined,
          tags: tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        };

        // Check for description on next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const ddMatch = nextLine.match(/<DD>(.*)/i);
          if (ddMatch) {
            bookmark.description = decodeHtmlEntities(ddMatch[1]);
            i++;
          }
        }

        bookmarks.push(bookmark);
      }
    }
  }

  return bookmarks;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
