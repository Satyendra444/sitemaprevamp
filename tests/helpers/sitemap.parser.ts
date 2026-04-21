import type { APIRequestContext } from '@playwright/test';
import type { SitemapEntry, SitemapEntryWithLang, LangVariant } from '../types/sitemap.types';
import { DEV_BASE } from '../data/sitemap.config';

function extractTagContent(xml: string, tag: string): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

function extractSingleTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(block);
  return m ? m[1].trim() : undefined;
}

export function detectLang(loc: string): LangVariant {
  const path = loc.replace(DEV_BASE, '');
  return path.startsWith('/hi/') || path === '/hi' ? 'hi' : 'base';
}

export function toBasePath(loc: string): string {
  const path = loc.replace(DEV_BASE, '');
  return path.startsWith('/hi/') ? path.slice(3) : path;
}

function parseUrlEntry(block: string): SitemapEntry | null {
  const loc = extractSingleTag(block, 'loc');
  if (!loc) return null;
  return {
    loc,
    lastmod: extractSingleTag(block, 'lastmod'),
    changefreq: extractSingleTag(block, 'changefreq'),
    priority: extractSingleTag(block, 'priority'),
  };
}

function enrichEntry(entry: SitemapEntry): SitemapEntryWithLang {
  return {
    ...entry,
    lang: detectLang(entry.loc),
    basePath: toBasePath(entry.loc),
  };
}

export interface FetchResult {
  xml: string;
  statusCode: number;
  entries: SitemapEntryWithLang[];
  isIndex: boolean;
  childUrls: string[];
}

export async function fetchAndParseSitemap(url: string, request: APIRequestContext): Promise<FetchResult> {
  const response = await request.get(url, { maxRedirects: 5 });
  const statusCode = response.status();
  const xml = await response.text();
  const isIndex = /<sitemapindex/i.test(xml);
  let entries: SitemapEntryWithLang[] = [];
  let childUrls: string[] = [];

  if (isIndex) {
    const sitemapBlocks = extractTagContent(xml, 'sitemap');
    childUrls = sitemapBlocks
      .map(b => extractSingleTag(b, 'loc'))
      .filter((l): l is string => Boolean(l));
  } else {
    const urlBlocks = extractTagContent(xml, 'url');
    entries = urlBlocks
      .map(parseUrlEntry)
      .filter((e): e is SitemapEntry => e !== null)
      .map(enrichEntry);
  }

  return { xml, statusCode, entries, isIndex, childUrls };
}

export async function fetchAndParseSitemapResolved(
  url: string,
  request: APIRequestContext,
  visited = new Set<string>()
): Promise<FetchResult> {
  const current = await fetchAndParseSitemap(url, request);
  if (!current.isIndex || current.childUrls.length === 0 || current.statusCode !== 200) {
    return current;
  }

  const aggregated: SitemapEntryWithLang[] = [];
  const discoveredChildUrls = new Set<string>(current.childUrls);
  const queued = [...current.childUrls];
  visited.add(url);

  while (queued.length > 0) {
    const nextUrl = queued.shift()!;
    if (visited.has(nextUrl)) continue;
    visited.add(nextUrl);

    const next = await fetchAndParseSitemap(nextUrl, request);
    if (next.statusCode !== 200) continue;

    if (next.isIndex) {
      for (const nested of next.childUrls) {
        discoveredChildUrls.add(nested);
        if (!visited.has(nested)) queued.push(nested);
      }
    } else {
      aggregated.push(...next.entries);
    }
  }

  const uniqueByLoc = new Map<string, SitemapEntryWithLang>();
  for (const entry of aggregated) {
    uniqueByLoc.set(entry.loc, entry);
  }

  return {
    ...current,
    entries: [...uniqueByLoc.values()],
    childUrls: [...discoveredChildUrls],
  };
}

export function parseSitemapXml(xml: string): SitemapEntryWithLang[] {
  const urlBlocks = extractTagContent(xml, 'url');
  return urlBlocks
    .map(parseUrlEntry)
    .filter((e): e is SitemapEntry => e !== null)
    .map(enrichEntry);
}

export function partitionByLang(entries: SitemapEntryWithLang[]): { base: SitemapEntryWithLang[]; hi: SitemapEntryWithLang[] } {
  const base: SitemapEntryWithLang[] = [];
  const hi: SitemapEntryWithLang[] = [];
  for (const e of entries) {
    if (e.lang === 'hi') hi.push(e);
    else base.push(e);
  }
  return { base, hi };
}
