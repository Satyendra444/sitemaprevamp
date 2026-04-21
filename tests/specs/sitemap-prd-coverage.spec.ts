import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS, DEV_BASE } from '../data/sitemap.config';
import { fetchAndParseSitemap } from '../helpers/sitemap.parser';

const CATEGORIES = ['trucks', 'buses', 'auto-rickshaws'] as const;
const REQUIRED_STATIC_PATHS = [
  '/tyres',
  '/electric',
  '/truck-dealers',
  '/service-centers',
  '/news',
  '/blog',
  '/web-stories',
  '/store',
  '/new-launch',
  '/privacy-policy',
  '/terms',
];

function normalizePath(url: string): string {
  return url
    .replace(DEV_BASE, '')
    .replace(/^\/en(?=\/|$)/, '')
    .replace(/^\/hi(?=\/|$)/, '');
}

test.describe('PRD Coverage & completeness checks', () => {
  test.setTimeout(240000);

  test('top-level sitemap XML entries are valid and nested sitemap XMLs are accessible', async ({ request }) => {
    const sitemapPage = new SitemapPage(request);
    const root = await sitemapPage.fetchRootSitemap();
    expect(root.statusCode).toBe(200);
    expect(root.entries.length).toBeGreaterThan(0);

    const nestedFailures: string[] = [];

    for (const topUrl of root.entries.map(e => e.loc)) {
      expect(topUrl.endsWith('.xml'), `Top-level sitemap must end with .xml: ${topUrl}`).toBeTruthy();
      const topResult = await fetchAndParseSitemap(topUrl, request);
      if (topResult.statusCode !== 200) {
        nestedFailures.push(`${topResult.statusCode} -> ${topUrl}`);
        continue;
      }

      if (topResult.isIndex) {
        expect(topResult.childUrls.length, `Nested index must contain child XML URLs: ${topUrl}`).toBeGreaterThan(0);
        for (const nestedUrl of topResult.childUrls) {
          expect(nestedUrl.endsWith('.xml'), `Nested sitemap must end with .xml: ${nestedUrl}`).toBeTruthy();
          const nestedResult = await fetchAndParseSitemap(nestedUrl, request);
          if (nestedResult.statusCode !== 200) {
            nestedFailures.push(`${nestedResult.statusCode} -> ${nestedUrl}`);
          }
        }
      }
    }

    expect(
      nestedFailures.length,
      `Expected all nested sitemap XMLs to be accessible.\nFailures:\n${nestedFailures.join('\n')}`
    ).toBe(0);
  });

  test('required static pages are present in static sitemap', async ({ request }) => {
    const staticDesc = CHILD_SITEMAPS.find(d => d.group === 'static');
    test.skip(!staticDesc, 'Static sitemap descriptor not configured');
    const desc = staticDesc!;

    const sitemapPage = new SitemapPage(request);
    const result = await sitemapPage.fetchChildSitemapResolved(desc.url);
    expect(result.statusCode).toBe(200);

    const paths = new Set(result.entries.map(entry => normalizePath(entry.loc)));
    const missing: string[] = [];

    for (const path of REQUIRED_STATIC_PATHS) {
      if (!paths.has(path)) missing.push(path);
    }

    for (const category of CATEGORIES) {
      const categoryPaths = [
        `/${category}`,
        `/${category}/videos`,
        `/compare-${category}`,
        `/popular-${category}`,
        `/${category}/onroad`,
      ];
      for (const path of categoryPaths) {
        if (!paths.has(path)) missing.push(path);
      }
    }

    // Accept legacy footer variants as fallback during migration.
    const footerFallbacks: string[][] = [
      ['/about-us', '/about'],
      ['/contact-us', '/contact'],
      ['/connect-with-us'],
    ];
    for (const fallbackGroup of footerFallbacks) {
      if (!fallbackGroup.some(path => paths.has(path))) {
        missing.push(fallbackGroup.join(' OR '));
      }
    }

    expect(
      missing.length,
      `Expected all required static PRD pages in static sitemap.\nMissing:\n${missing.join('\n')}`
    ).toBe(0);
  });

  test('filter sitemaps do not include auto-generated plus URLs or query strings', async ({ request }) => {
    const sitemapPage = new SitemapPage(request);
    const filterGroups = CHILD_SITEMAPS.filter(d => d.group.includes('filters'));

    const plusViolations: string[] = [];
    const queryViolations: string[] = [];

    for (const desc of filterGroups) {
      const result = await sitemapPage.fetchChildSitemapResolved(desc.url);
      if (result.statusCode !== 200) continue;

      for (const entry of result.entries) {
        const path = normalizePath(entry.loc);
        if (path.includes('+')) plusViolations.push(entry.loc);
        if (entry.loc.includes('?')) queryViolations.push(entry.loc);
      }
    }

    expect(
      plusViolations.length,
      `Expected 0 auto-generated '+' filter URLs in filter sitemap.\nFound:\n${plusViolations.slice(0, 20).join('\n')}`
    ).toBe(0);
    expect(
      queryViolations.length,
      `Expected 0 filter URLs with query strings.\nFound:\n${queryViolations.slice(0, 20).join('\n')}`
    ).toBe(0);
  });

  test('sampled URLs from every sitemap group return direct 200 (no 3xx/4xx/5xx)', async ({ request }) => {
    const sitemapPage = new SitemapPage(request);
    const failures: string[] = [];
    const samplePerGroup = 20;

    for (const desc of CHILD_SITEMAPS) {
      const result = await sitemapPage.fetchChildSitemapResolved(desc.url);
      if (result.statusCode !== 200 || result.entries.length === 0) continue;

      for (const entry of result.entries.slice(0, samplePerGroup)) {
        const response = await request.get(entry.loc, { maxRedirects: 0 });
        const status = response.status();
        if (status !== 200) {
          failures.push(`[${desc.label}] ${status} -> ${entry.loc}`);
        }
      }
    }

    expect(
      failures.length,
      `Expected all sampled URLs to return direct 200 without redirect.\nFailures:\n${failures.slice(0, 50).join('\n')}`
    ).toBe(0);
  });
});
