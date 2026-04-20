import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS } from '../data/sitemap.config';
import { assertSitemapStructure } from '../helpers/sitemap.validator';

test.describe('Models, Variants, Reviews, and Prices Sitemaps', () => {
  const modelGroups = CHILD_SITEMAPS.filter(d => 
    d.group.includes('models') || 
    d.group.includes('variants') || 
    d.group.includes('reviews') || 
    d.group.includes('prices')
  );

  for (const desc of modelGroups) {
    test(`Structure and patterns for ${desc.label}`, async ({ request }) => {
      const sitemapPage = new SitemapPage(request);
      const result = await sitemapPage.fetchChildSitemap(desc.url);
      
      expect(result.statusCode).toBe(200);
      assertSitemapStructure(result.entries, desc.urlPattern, desc.label);
    });
  }
});
