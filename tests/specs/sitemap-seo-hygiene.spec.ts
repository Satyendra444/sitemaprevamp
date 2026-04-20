import { test } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS } from '../data/sitemap.config';
import {
  batchCheckEntries,
  assertAllReturn200,
  assertNoRedirects,
  assertNoGoneOrNotFound,
  assertNoNoindex,
  assertCanonicalMatch,
  assertNotBlockedByRobots,
  buildHttpSummary
} from '../helpers/sitemap.http';
import { assertUrlPattern } from '../helpers/sitemap.validator';

test.describe('Comprehensive SEO Hygiene & Pattern Validation (Sampled URLs)', () => {
  // Test timeout needs to be longer as we are hitting multiple endpoints and parsing HTML
  test.setTimeout(180000);

  for (const desc of CHILD_SITEMAPS) {
    test(`Verify strict SEO hygiene and URL structure for: ${desc.label}`, async ({ request }) => {
      const sitemapPage = new SitemapPage(request);
      const result = await sitemapPage.fetchChildSitemap(desc.url);

      // Skip if the sitemap doesn't exist yet (e.g. tyres, new-launch if they aren't on dev)
      test.skip(result.statusCode !== 200, `Child sitemap ${desc.url} returned ${result.statusCode}`);

      const httpResults = await batchCheckEntries(result.entries, request);

      test.info().annotations.push({ type: 'HTTP Summary', description: buildHttpSummary(httpResults) });

      const labelWithUrl = `${desc.label} (${desc.url})`;

      await test.step(`Verify all URLs in ${desc.label} match the correct PRD pattern`, () => {
        assertUrlPattern(result.entries, desc.urlPattern, labelWithUrl);
      });

      await test.step('Verify all URLs return a successful 200 OK status (No 404 Not Found or 410 Gone)', () => {
        // 1. Pages returning 404/410 MUST be excluded
        assertNoGoneOrNotFound(httpResults, labelWithUrl);
        assertAllReturn200(httpResults, labelWithUrl);
      });

      await test.step('Verify URLs are direct links and do not trigger any redirects (No 301 or 302)', () => {
        // 2. Redirected Pages (301/302) MUST be excluded (only final destination 200 allowed)
        assertNoRedirects(httpResults, labelWithUrl);
      });

      await test.step('Verify URLs are indexable by search engines (No meta "noindex" tags found)', () => {
        // 3. Noindex Pages MUST be excluded
        assertNoNoindex(httpResults, labelWithUrl);
      });

      await test.step('Verify URLs are the primary version (Canonical tag matches the actual URL)', () => {
        // 4. Canonicalized URLs (Non-Canonical Versions) MUST be excluded
        assertCanonicalMatch(httpResults, labelWithUrl);
      });

      await test.step('Verify URLs are accessible to crawlers (Not blocked by robots.txt rules)', () => {
        // 5. Pages Blocked by robots.txt MUST be excluded
        assertNotBlockedByRobots(httpResults, labelWithUrl);
      });
    });
  }
});
