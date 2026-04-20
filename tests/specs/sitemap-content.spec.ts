import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS } from '../data/sitemap.config';
import { assertSitemapStructure } from '../helpers/sitemap.validator';

test.describe('Content Sitemaps (News, Blog, Web Stories)', () => {
  const contentGroups = CHILD_SITEMAPS.filter(d => 
    d.group === 'news' || 
    d.group === 'blog' || 
    d.group === 'web-stories'
  );

  for (const desc of contentGroups) {
    test(`Structure and patterns for ${desc.label}`, async ({ request }) => {
      const sitemapPage = new SitemapPage(request);
      const result = await sitemapPage.fetchChildSitemap(desc.url);
      
      expect(result.statusCode).toBe(200);
      assertSitemapStructure(result.entries, desc.urlPattern, desc.label);
    });
  }
});
