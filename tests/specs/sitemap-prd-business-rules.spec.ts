import { test, expect } from '@playwright/test';
import { SitemapPage } from '../../src/pages/SitemapPage';
import { CHILD_SITEMAPS, DEV_BASE } from '../data/sitemap.config';

const CATEGORIES = ['trucks', 'buses', 'auto-rickshaws'];
const THIN_CONTENT_RE = [
  /coming soon/i,
  /no dealers found/i,
  /no service centers? found/i,
  /0 results/i,
  /no results found/i,
];

function pickByGroup(partial: string) {
  return CHILD_SITEMAPS.filter(d => d.group.includes(partial));
}

test.describe('PRD business-rule sanity checks', () => {
  test.setTimeout(180000);

  test('static sitemap includes category and footer-family URLs', async ({ request }) => {
    const staticDesc = CHILD_SITEMAPS.find(d => d.group === 'static');
    test.skip(!staticDesc, 'Static sitemap descriptor missing');

    const sitemapPage = new SitemapPage(request);
    const result = await sitemapPage.fetchChildSitemap(staticDesc.url);
    expect(result.statusCode).toBe(200);

    const locs = new Set(result.entries.map(e => e.loc.replace(`${DEV_BASE}/en`, DEV_BASE)));

    for (const category of CATEGORIES) {
      expect(locs.has(`${DEV_BASE}/${category}`), `Missing category URL: /${category}`).toBeTruthy();
      expect(locs.has(`${DEV_BASE}/${category}/videos`), `Missing videos URL: /${category}/videos`).toBeTruthy();
    }

    const footerFamilies = [
      [`${DEV_BASE}/about-us`, `${DEV_BASE}/about`],
      [`${DEV_BASE}/contact-us`, `${DEV_BASE}/contact`],
      [`${DEV_BASE}/privacy-policy`],
      [`${DEV_BASE}/terms`],
      [`${DEV_BASE}/connect-with-us`],
    ];
    for (const family of footerFamilies) {
      const found = family.some(url => locs.has(url));
      expect(found, `Missing footer URL family: ${family.join(' OR ')}`).toBeTruthy();
    }
  });

  test('filter and filter-combination URLs stay at max 2 filter segments', async ({ request }) => {
    const sitemapPage = new SitemapPage(request);
    const filterSitemaps = pickByGroup('filters');

    for (const desc of filterSitemaps) {
      const result = await sitemapPage.fetchChildSitemap(desc.url);
      if (result.statusCode !== 200) continue;

      const invalid = result.entries.filter(entry => {
        const path = entry.loc.replace(`${DEV_BASE}/`, '').replace(/^hi\//, '').replace(/^en\//, '');
        const [category, ...rest] = path.split('/');
        if (!CATEGORIES.includes(category)) return false;
        return rest.length > 2;
      });

      expect(
        invalid.length,
        `[${desc.label}] Expected 0 filter URLs deeper than /{category}/{primary}/{secondary}, found ${invalid.length}`
      ).toBe(0);
    }
  });

  test('sampled business pages avoid thin-content signals', async ({ request }) => {
    const sitemapPage = new SitemapPage(request);
    const targetGroups = CHILD_SITEMAPS.filter(d =>
      d.group.includes('prices') ||
      d.group.includes('filters') ||
      d.group.includes('dealers') ||
      d.group.includes('servicecenters') ||
      d.group === 'charging'
    );

    const violations: string[] = [];

    for (const desc of targetGroups) {
      const sitemap = await sitemapPage.fetchChildSitemap(desc.url);
      if (sitemap.statusCode !== 200 || sitemap.entries.length === 0) continue;

      for (const entry of sitemap.entries.slice(0, 20)) {
        const res = await request.get(entry.loc, { maxRedirects: 0 });
        if (res.status() !== 200) continue;
        const html = (await res.text()).toLowerCase();

        for (const pattern of THIN_CONTENT_RE) {
          if (pattern.test(html)) {
            violations.push(`[${desc.label}] ${entry.loc} matched "${pattern}"`);
            break;
          }
        }
      }
    }

    expect(
      violations.length,
      `Expected sampled URLs to avoid thin-page patterns. Violations:\n${violations.slice(0, 20).join('\n')}`
    ).toBe(0);
  });
});
