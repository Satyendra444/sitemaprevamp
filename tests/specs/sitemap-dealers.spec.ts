import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS } from '../data/sitemap.config';
import { assertSitemapStructure } from '../helpers/sitemap.validator';

test.describe('Dealers and Service Centers Sitemaps', () => {
  const dealerGroups = CHILD_SITEMAPS.filter(d => 
    d.group.includes('dealers') || 
    d.group.includes('servicecenters')
  );

  for (const desc of dealerGroups) {
    test(`Structure and patterns for ${desc.label}`, async ({ request }) => {
      const sitemapPage = new SitemapPage(request);
      const result = await sitemapPage.fetchChildSitemap(desc.url);
      
      expect(result.statusCode).toBe(200);
      assertSitemapStructure(result.entries, desc.urlPattern, desc.label);
    });
  }
});
