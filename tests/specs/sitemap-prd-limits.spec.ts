import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { MAX_URLS_PER_SITEMAP } from '../data/sitemap.config';

const MAX_BYTES_PER_SITEMAP = 20 * 1024 * 1024;

test.describe('PRD Limits: Sitemap URL and file-size caps', () => {
  test.setTimeout(180000);

  test('all listed child sitemaps stay within 10k URLs and 20MB size', async ({ request }) => {
    const sitemapPage = new SitemapPage(request);
    const root = await sitemapPage.fetchRootSitemap();

    expect(root.statusCode).toBe(200);
    expect(root.entries.length).toBeGreaterThan(0);

    const tooManyUrls: string[] = [];
    const tooLargeFiles: string[] = [];

    for (const child of root.entries.map(entry => entry.loc)) {
      const childResult = await sitemapPage.fetchChildSitemap(child);
      if (childResult.statusCode !== 200) continue;

      if (childResult.entries.length > MAX_URLS_PER_SITEMAP) {
        tooManyUrls.push(`${child} (${childResult.entries.length})`);
      }

      const xmlBytes = Buffer.byteLength(childResult.xml, 'utf-8');
      if (xmlBytes > MAX_BYTES_PER_SITEMAP) {
        tooLargeFiles.push(`${child} (${xmlBytes} bytes)`);
      }
    }

    expect(
      tooManyUrls.length,
      `Expected all child sitemaps to stay <= ${MAX_URLS_PER_SITEMAP} URLs.\nViolations:\n${tooManyUrls.join('\n')}`
    ).toBe(0);

    expect(
      tooLargeFiles.length,
      `Expected all child sitemap files to stay <= ${MAX_BYTES_PER_SITEMAP} bytes.\nViolations:\n${tooLargeFiles.join('\n')}`
    ).toBe(0);
  });
});
