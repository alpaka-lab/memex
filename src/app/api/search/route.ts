import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { sqlite } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 });
  }

  const stmt = sqlite.prepare(`
    SELECT
      b.id,
      b.url,
      b.title,
      b.description,
      b.note,
      b.ogImage,
      b.favicon,
      b.domain,
      b.createdAt,
      snippet(bookmarks_fts, 0, '<mark>', '</mark>', '...', 32) AS titleSnippet,
      snippet(bookmarks_fts, 1, '<mark>', '</mark>', '...', 32) AS descriptionSnippet,
      snippet(bookmarks_fts, 2, '<mark>', '</mark>', '...', 32) AS noteSnippet
    FROM bookmarks_fts fts
    INNER JOIN bookmarks b ON b.rowid = fts.rowid
    WHERE bookmarks_fts MATCH ?
      AND b.userId = ?
    ORDER BY rank
    LIMIT 50
  `);

  const results = stmt.all(q, userId);

  return NextResponse.json(results);
}
