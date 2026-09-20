import { NextRequest, NextResponse } from 'next/server';

const IMGUR_PAGE_HOSTS = new Set(['imgur.com', 'www.imgur.com', 'm.imgur.com']);
const IMGUR_IMAGE_HOST = 'i.imgur.com';

function safeUrl(value: string) {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Invalid URL');
  }
  return parsed;
}

function metaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const propertyFirst = new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)`, 'i');
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, 'i');
  return (html.match(propertyFirst) || html.match(contentFirst))?.[1]?.replaceAll('&amp;', '&') || '';
}

export async function GET(request: NextRequest) {
  try {
    const source = safeUrl(request.nextUrl.searchParams.get('url') || '');

    if (source.hostname.toLowerCase() === IMGUR_IMAGE_HOST) {
      return NextResponse.redirect(source, 307);
    }

    if (!IMGUR_PAGE_HOSTS.has(source.hostname.toLowerCase())) {
      return NextResponse.json({ error: 'Proveedor no permitido.' }, { status: 400 });
    }

    const response = await fetch(source, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElReyDelCerro/1.0)' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error('Imgur request failed');

    const resolved = safeUrl(metaContent(await response.text(), 'og:image'));
    if (resolved.hostname.toLowerCase() !== IMGUR_IMAGE_HOST) throw new Error('Invalid image host');

    const redirect = NextResponse.redirect(resolved, 307);
    redirect.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return redirect;
  } catch {
    return NextResponse.json({ error: 'No se pudo cargar la imagen de Imgur.' }, { status: 404 });
  }
}
