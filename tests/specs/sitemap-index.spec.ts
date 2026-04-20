import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { EXPECTED_CHILD_SITEMAP_URLS } from '../data/sitemap.config';
import { batchCheckHttpStatus } from '../helpers/sitemap.http';

test.describe('Root Sitemap Index', () => {
  let sitemapPage: SitemapPage;
  let rootResult: any;

  test.beforeAll(async ({ request }) => {
    sitemapPage = new SitemapPage(request);
    rootResult = await sitemapPage.fetchRootSitemap();
  });

  test('should return HTTP 200 @smoke', async () => {
    expect(rootResult.statusCode).toBe(200);
  });

  test('should be a valid XML sitemap containing child URLs @smoke', async () => {
    // The dev root sitemap uses <urlset> instead of <sitemapindex>
    expect(rootResult.entries.length).toBeGreaterThan(0);
  });

  test('should contain all expected child sitemaps @smoke', async () => {
    const urls = rootResult.entries.map((e: any) => e.loc);
    const foundUrls = new Set(urls);
    const missing = EXPECTED_CHILD_SITEMAP_URLS.filter(url => !foundUrls.has(url));
    expect(missing.length, `Expected 0 missing child sitemaps, Actual: ${missing.length}\nMissing sitemaps:\n${missing.join('\n')}`).toBe(0);
  });

  test('should not contain unexpected child sitemaps', async () => {
    const urls = rootResult.entries.map((e: any) => e.loc);
    const expected = new Set(EXPECTED_CHILD_SITEMAP_URLS);
    const unexpected = urls.filter((url: string) => !expected.has(url));
    expect(unexpected.length, `Expected 0 unexpected child sitemaps, Actual: ${unexpected.length}\nUnexpected sitemaps found:\n${unexpected.join('\n')}`).toBe(0);
  });

  test('all child sitemaps must be accessible (HTTP 200)', async ({ request }) => {
    const urls = rootResult.entries.map((e: any) => e.loc);
    const results = await batchCheckHttpStatus(urls, request, 10);
    const failed: string[] = [];
    results.forEach((status, url) => {
      if (status !== 200) failed.push(`${status} → ${url}`);
    });
    expect(failed.length, `Expected 0 failed child sitemaps, Actual: ${failed.length}\nFailed sitemaps:\n${failed.join('\n')}`).toBe(0);
  });
});
