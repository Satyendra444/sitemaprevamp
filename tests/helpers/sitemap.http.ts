import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import robotsParser from 'robots-parser';
import { DEV_BASE, HTTP_CONCURRENCY, HTTP_SAMPLE_SIZE } from '../data/sitemap.config';
import type { SitemapEntryWithLang, LangVariant } from '../types/sitemap.types';

export interface HttpCheckResult {
  url: string;
  status: number;
  lang: LangVariant;
  ok: boolean;
  isNoindex: boolean;
  canonical: string | null;
  isRobotsBlocked: boolean;
}

let robotsCache: any = null;

async function checkRobotsTxt(url: string, request: APIRequestContext): Promise<boolean> {
  if (!robotsCache) {
    try {
      const res = await request.get(`https://www.91trucks.com/robots.txt`);
      const text = await res.text();
      robotsCache = robotsParser(`https://www.91trucks.com/robots.txt`, text);
    } catch {
      // If robots.txt fails to load, assume allowed
      robotsCache = robotsParser(`https://www.91trucks.com/robots.txt`, '');
    }
  }
  return robotsCache.isDisallowed(url, 'Googlebot') ?? false;
}

async function checkSeoHygiene(request: APIRequestContext, url: string): Promise<Omit<HttpCheckResult, 'url' | 'lang'>> {
  let status = -1;
  let isNoindex = false;
  let canonical: string | null = null;
  let isRobotsBlocked = false;

  try {
    isRobotsBlocked = await checkRobotsTxt(url, request);

    // Perform GET request without following redirects to catch 301/302
    const response = await request.get(url, { maxRedirects: 0 });
    status = response.status();

    if (status === 200) {
      const html = await response.text();

      // Check for <meta name="robots" content="...noindex...">
      const noindexRe = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["'][^>]*>/i;
      isNoindex = noindexRe.test(html);

      // Check for <link rel="canonical" href="...">
      const canonicalRe = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
      const match = canonicalRe.exec(html);
      if (match) {
        canonical = match[1];
      }
    }
  } catch (e) {
    status = -1;
  }

  return { status, ok: status === 200, isNoindex, canonical, isRobotsBlocked };
}

async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

export async function batchCheckHttpStatus(urls: string[], request: APIRequestContext, concurrency = HTTP_CONCURRENCY): Promise<Map<string, number>> {
  const tasks = urls.map(url => async () => {
    // Just simple HEAD check for non-sampled bulk validation
    try {
      const res = await request.head(url, { maxRedirects: 5 });
      return { url, status: res.status() };
    } catch {
      return { url, status: -1 };
    }
  });

  const results = await pLimit(tasks, concurrency);
  const map = new Map<string, number>();
  for (const { url, status } of results) {
    map.set(url, status);
  }
  return map;
}

export async function batchCheckEntries(entries: SitemapEntryWithLang[], request: APIRequestContext, sampleSize = HTTP_SAMPLE_SIZE, concurrency = HTTP_CONCURRENCY): Promise<HttpCheckResult[]> {
  const baseEntries = entries.filter(e => e.lang === 'base').slice(0, sampleSize);
  const hiEntries = entries.filter(e => e.lang === 'hi').slice(0, sampleSize);
  const sampled = [...baseEntries, ...hiEntries];

  const tasks = sampled.map(entry => async (): Promise<HttpCheckResult> => {
    const seoData = await checkSeoHygiene(request, entry.loc);
    return {
      url: entry.loc,
      lang: entry.lang,
      ...seoData
    };
  });

  return pLimit(tasks, concurrency);
}

export function assertAllReturn200(results: HttpCheckResult[], label: string): void {
  const failures = results.filter(r => !r.ok);
  const baseFailures = failures.filter(r => r.lang === 'base');
  const hiFailures = failures.filter(r => r.lang === 'hi');

  if (failures.length === 0) return;

  const lines: string[] = [`[${label}] Expected 0 URLs failing HTTP 200, Actual: ${failures.length}`];

  if (baseFailures.length > 0) {
    lines.push(`  [base] ${baseFailures.length} failures:`);
    baseFailures.slice(0, 5).forEach(r => lines.push(`    ${r.status} → ${r.url}`));
  }
  if (hiFailures.length > 0) {
    lines.push(`  [hi]   ${hiFailures.length} failures:`);
    hiFailures.slice(0, 5).forEach(r => lines.push(`    ${r.status} → ${r.url}`));
  }

  expect(failures.length, lines.join('\n')).toBe(0);
}

export function assertNoRedirects(results: HttpCheckResult[], label: string): void {
  const redirects = results.filter(r => r.status >= 300 && r.status < 400);
  const lines = redirects.slice(0, 10).map(r => `  [${r.lang}] ${r.status} → ${r.url}`);
  expect(redirects.length, `[${label}] Expected 0 redirect URLs, Actual: ${redirects.length}\nRedirect URLs found:\n${lines.join('\n')}`).toBe(0);
}

export function assertNoGoneOrNotFound(results: HttpCheckResult[], label: string): void {
  const dead = results.filter(r => r.status === 404 || r.status === 410);
  const lines = dead.slice(0, 10).map(r => `  [${r.lang}] ${r.status} → ${r.url}`);
  expect(dead.length, `[${label}] Expected 0 dead (404/410) URLs, Actual: ${dead.length}\nDead URLs found:\n${lines.join('\n')}`).toBe(0);
}

export function assertNoNoindex(results: HttpCheckResult[], label: string): void {
  const noindexed = results.filter(r => r.isNoindex);
  const lines = noindexed.slice(0, 10).map(r => `  [${r.lang}] ${r.url}`);
  expect(noindexed.length, `[${label}] Expected 0 noindex URLs, Actual: ${noindexed.length}\nNoindex URLs found:\n${lines.join('\n')}`).toBe(0);
}

export function assertCanonicalMatch(results: HttpCheckResult[], label: string): void {
  // Only check URLs that successfully loaded
  const mismatched = results.filter(r => r.ok && r.canonical && r.canonical !== r.url);
  const lines = mismatched.slice(0, 10).map(r => `  [${r.lang}] URL: ${r.url}\n         Canonical: ${r.canonical}`);
  expect(mismatched.length, `[${label}] Expected 0 canonical mismatches, Actual: ${mismatched.length}\nMismatches found:\n${lines.join('\n')}`).toBe(0);
}

export function assertNotBlockedByRobots(results: HttpCheckResult[], label: string): void {
  const blocked = results.filter(r => r.isRobotsBlocked);
  const lines = blocked.slice(0, 10).map(r => `  [${r.lang}] ${r.url}`);
  expect(blocked.length, `[${label}] Expected 0 URLs blocked by robots.txt, Actual: ${blocked.length}\nBlocked URLs found:\n${lines.join('\n')}`).toBe(0);
}

export function buildHttpSummary(results: HttpCheckResult[]): string {
  const base = results.filter(r => r.lang === 'base');
  const hi = results.filter(r => r.lang === 'hi');
  const ok = results.filter(r => r.ok).length;
  return `Checked ${results.length} URLs (${base.length} base + ${hi.length} hi). ${ok} OK, ${results.length - ok} non-200.`;
}
