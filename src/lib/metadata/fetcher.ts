export interface PageMetadata {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
  domain: string | null;
}

/**
 * Fetch a URL and extract Open Graph / HTML metadata.
 * 5-second timeout, follows redirects, returns partial data on failure.
 */
export async function fetchMetadata(url: string): Promise<PageMetadata> {
  const result: PageMetadata = {
    title: null,
    description: null,
    ogImage: null,
    favicon: null,
    domain: null,
  };

  try {
    const parsedUrl = new URL(url);
    result.domain = parsedUrl.hostname;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Memex/1.0 (metadata fetcher)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return result;
      }

      const html = await response.text();

      // og:title
      const ogTitle = extractMeta(html, 'og:title');
      const htmlTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
      result.title = ogTitle || htmlTitle || null;

      // og:description
      const ogDesc = extractMeta(html, 'og:description');
      const metaDesc = extractMetaName(html, 'description');
      result.description = ogDesc || metaDesc || null;

      // og:image
      result.ogImage = extractMeta(html, 'og:image') || null;

      // Resolve relative og:image
      if (result.ogImage && !result.ogImage.startsWith('http')) {
        try {
          result.ogImage = new URL(result.ogImage, url).href;
        } catch {
          // leave as-is
        }
      }

      // Favicon
      const faviconMatch = html.match(
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i
      ) || html.match(
        /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i
      );

      if (faviconMatch?.[1]) {
        const faviconHref = faviconMatch[1];
        try {
          result.favicon = new URL(faviconHref, url).href;
        } catch {
          result.favicon = faviconHref;
        }
      } else {
        // Fallback to /favicon.ico
        result.favicon = `${parsedUrl.origin}/favicon.ico`;
      }
    } catch {
      clearTimeout(timeout);
      // Return partial data (domain is already set)
    }
  } catch {
    // Invalid URL — return empty result
  }

  return result;
}

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*property=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  if (match) return match[1];

  // Try reversed attribute order
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${escapeRegex(property)}["']`,
    'i'
  );
  const match2 = html.match(regex2);
  return match2?.[1] ?? null;
}

function extractMetaName(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*name=["']${escapeRegex(name)}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  if (match) return match[1];

  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${escapeRegex(name)}["']`,
    'i'
  );
  const match2 = html.match(regex2);
  return match2?.[1] ?? null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
