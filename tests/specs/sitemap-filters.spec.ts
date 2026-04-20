import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS } from '../data/sitemap.config';
import { assertSitemapStructure } from '../helpers/sitemap.validator';

test.describe('Filters and Compare Sitemaps', () => {
  const filterGroups = CHILD_SITEMAPS.filter(d => 
    d.group.includes('filters') || 
    d.group.includes('compare')
  );

  for (const desc of filterGroups) {
    test(`Structure and patterns for ${desc.label}`, async ({ request }) => {
      const sitemapPage = new SitemapPage(request);
      const result = await sitemapPage.fetchChildSitemap(desc.url);
      
      expect(result.statusCode).toBe(200);
      assertSitemapStructure(result.entries, desc.urlPattern, desc.label);
    });
  }
});
