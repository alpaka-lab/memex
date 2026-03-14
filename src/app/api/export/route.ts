import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const format = request.nextUrl.searchParams.get('format') ?? 'json';

  const bookmarks = await db
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, userId));

  const collections = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.userId, userId));

  const tags = await db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, userId));

  const bookmarkTags = await db
    .select()
    .from(schema.bookmarkTags);

  // Filter bookmark_tags to only include user's bookmarks
  const userBookmarkIds = new Set(bookmarks.map((b) => b.id));
  const userBookmarkTags = bookmarkTags.filter((bt) => userBookmarkIds.has(bt.bookmarkId));

  if (format === 'html') {
    // Generate Netscape bookmark HTML format (importable by browsers)
    const tagMap = new Map(tags.map((t) => [t.id, t.name]));
    const bookmarkTagMap = new Map<string, string[]>();
    for (const bt of userBookmarkTags) {
      const tagName = tagMap.get(bt.tagId);
      if (tagName) {
        const existing = bookmarkTagMap.get(bt.bookmarkId) ?? [];
        existing.push(tagName);
        bookmarkTagMap.set(bt.bookmarkId, existing);
      }
    }

    const collectionMap = new Map(collections.map((c) => [c.id, c]));

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Memex Bookmarks Export</TITLE>
<H1>Memex Bookmarks</H1>
<DL><p>\n`;

    // Group by collection
    const uncategorized = bookmarks.filter((b) => !b.collectionId);
    const byCollection = new Map<string, typeof bookmarks>();
    for (const b of bookmarks) {
      if (b.collectionId) {
        const existing = byCollection.get(b.collectionId) ?? [];
        existing.push(b);
        byCollection.set(b.collectionId, existing);
      }
    }

    // Uncategorized bookmarks
    for (const b of uncategorized) {
      const tags = bookmarkTagMap.get(b.id)?.join(',') ?? '';
      const addDate = Math.floor(new Date(b.createdAt!).getTime() / 1000);
      html += `    <DT><A HREF="${escapeHtml(b.url!)}" ADD_DATE="${addDate}"${tags ? ` TAGS="${escapeHtml(tags)}"` : ''}>${escapeHtml(b.title ?? b.url!)}</A>\n`;
      if (b.description) {
        html += `    <DD>${escapeHtml(b.description)}\n`;
      }
    }

    // Collection folders
    for (const [collId, colBookmarks] of byCollection) {
      const collection = collectionMap.get(collId);
      const folderName = collection?.name ?? 'Unknown';
      html += `    <DT><H3>${escapeHtml(folderName)}</H3>\n    <DL><p>\n`;
      for (const b of colBookmarks) {
        const tags = bookmarkTagMap.get(b.id)?.join(',') ?? '';
        const addDate = Math.floor(new Date(b.createdAt!).getTime() / 1000);
        html += `        <DT><A HREF="${escapeHtml(b.url!)}" ADD_DATE="${addDate}"${tags ? ` TAGS="${escapeHtml(tags)}"` : ''}>${escapeHtml(b.title ?? b.url!)}</A>\n`;
        if (b.description) {
          html += `        <DD>${escapeHtml(b.description)}\n`;
        }
      }
      html += `    </DL><p>\n`;
    }

    html += `</DL><p>\n`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="memex-bookmarks.html"',
      },
    });
  }

  // JSON export (default)
  const exportData = {
    version: '0.2',
    exportedAt: new Date().toISOString(),
    bookmarks,
    collections,
    tags,
    bookmarkTags: userBookmarkTags,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="memex-export.json"',
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
