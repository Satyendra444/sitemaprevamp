import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAP_MAP } from '../data/sitemap.config';
import { assertSitemapStructure } from '../helpers/sitemap.validator';

test.describe('Static Sitemap', () => {
  const desc = CHILD_SITEMAP_MAP.get('https://dev.91trucks.com/sitemap/static-sitemap/static-sitemap.xml');
  
  test(`Structure and patterns for ${desc?.label}`, async ({ request }) => {
    test.skip(!desc, 'Sitemap descriptor not found');
    const staticDesc = desc!;
    const sitemapPage = new SitemapPage(request);
    const result = await sitemapPage.fetchChildSitemapResolved(staticDesc.url);
    
    expect(result.statusCode).toBe(200);
    assertSitemapStructure(result.entries, staticDesc.urlPattern, staticDesc.label);
  });
});
