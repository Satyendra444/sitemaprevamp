import type { ChildSitemapDescriptor, SitemapGroup } from '../types/sitemap.types';

export const DEV_BASE = 'https://dev.91trucks.com';
export const SITEMAP_ROOT_URL = `${DEV_BASE}/sitemap/sitemap.xml`;
export const MAX_URLS_PER_SITEMAP = 10_000;
export const LASTMOD_RE = /^\d{4}-\d{2}-\d{2}$/;
export const HTTP_SAMPLE_SIZE = 50;
export const HTTP_CONCURRENCY = 20;
// Dev environment blocks crawl access in robots.txt; keep false on dev and true on prod.
export const ENABLE_ROBOTS_ASSERTIONS = false;

const slug = '[a-z0-9][a-z0-9-]*';
const localeOpt = `(?:(?:hi|en)/)?`;
const CATEGORY_RE = `(?:trucks|buses|auto-rickshaws|three-wheelers)`;

function modelPattern(cat: string): RegExp { return new RegExp(`^${DEV_BASE}/${localeOpt}${cat}/${slug}/${slug}$`); }
function variantPattern(cat: string): RegExp { return new RegExp(`^${DEV_BASE}/${localeOpt}${cat}/${slug}/${slug}/${slug}$`); }
function reviewPattern(cat: string): RegExp { return new RegExp(`^${DEV_BASE}/${localeOpt}${cat}/${slug}/${slug}/reviews$`); }
function pricePattern(cat: string): RegExp { return new RegExp(`^${DEV_BASE}/${localeOpt}${cat}/${slug}/${slug}/price-in-${slug}$`); }
function filterPattern(cat: string): RegExp { return new RegExp(`^${DEV_BASE}/${localeOpt}${cat}/${slug}(?:/${slug})?$`); }
function comparePattern(cat: string): RegExp {
  void cat;
  return new RegExp(`^${DEV_BASE}/${localeOpt}compare/${slug}-vs-${slug}$`);
}
function dealerPattern(cat: string): RegExp {
  const prefix = cat === 'auto-rickshaws' ? 'auto-rickshaws' : cat;
  return new RegExp(`^${DEV_BASE}/${localeOpt}${prefix}-dealers/${slug}(?:/${slug})?$`);
}
function serviceCenterPattern(cat: string): RegExp {
  return new RegExp(`^${DEV_BASE}/${localeOpt}${cat}-service(?:-centers|-center|centers)/${slug}(?:/${slug})?$`);
}

export const STATIC_URL_RE = new RegExp(
  `^${DEV_BASE}/${localeOpt}(?:` +
  [
    `${CATEGORY_RE}`,
    `${CATEGORY_RE}/videos`,
    `${CATEGORY_RE}/onroad`,
    `compare-${CATEGORY_RE}`,
    `popular-${CATEGORY_RE}`,
    `latest-${CATEGORY_RE}`,
    `tyres`,
    `truck-tyres`,
    `bus-tyres`,
    `three-wheeler-tyres`,
    `tractor-tyres`,
    `truck-dealers`,
    `bus-dealers`,
    `auto-rickshaws-dealers`,
    `service-centers`,
    `truck-service-centers`,
    `bus-service-centers`,
    `auto-rickshaws-service-centers`,
    `truck-servicecenter`,
    `truck-servicecenters`,
    `bus-servicecenter`,
    `bus-servicecenters`,
    `auto-rickshaws-servicecenter`,
    `auto-rickshaws-servicecenters`,
    `electric`,
    `news`,
    `blog`,
    `web-stories`,
    `store`,
    `used-trucks`,
    `finance`,
    `finance/banking-partners`,
    `about-us`,
    `contact-us`,
    `connect-with-us`,
    `about`,
    `contact`,
    `privacy-policy`,
    `terms`,
    `advertise`,
    `feedback`,
    `careers`,
    `auto-expo`,
    `upcoming-commercial-vehicle`,
    `new-launch`,
  ].join('|') +
  `)$`
);

function child(group: SitemapGroup, url: string, label: string, urlPattern: RegExp): ChildSitemapDescriptor {
  return { group, url, label, urlPattern };
}

export const CHILD_SITEMAPS: ChildSitemapDescriptor[] = [
  child('static', `${DEV_BASE}/sitemap/static-sitemap/static-sitemap.xml`, 'Static Pages', STATIC_URL_RE),
  child('trucks-models', `${DEV_BASE}/sitemap/model-sitemap/trucks-model-sitemap.xml`, 'Trucks Model', modelPattern('trucks')),
  child('trucks-variants', `${DEV_BASE}/sitemap/model-sitemap/trucks-variant-sitemap.xml`, 'Trucks Variant', variantPattern('trucks')),
  child('trucks-reviews', `${DEV_BASE}/sitemap/model-sitemap/trucks-review-sitemap.xml`, 'Trucks Review', reviewPattern('trucks')),
  child('trucks-prices', `${DEV_BASE}/sitemap/model-sitemap/parent-trucks-price-sitemap.xml`, 'Trucks Price', pricePattern('trucks')),
  child('trucks-filters', `${DEV_BASE}/sitemap/filter-sitemap/sitemap-trucks-filters.xml`, 'Trucks Filter', filterPattern('trucks')),
  child('trucks-dealers', `${DEV_BASE}/sitemap/dealers-sitemap/sitemap-trucks-dealers.xml`, 'Trucks Dealer', dealerPattern('trucks')),
  child('trucks-servicecenters', `${DEV_BASE}/sitemap/servicecenters-sitemap/sitemap-trucks-servicecenter.xml`, 'Trucks Service Center', serviceCenterPattern('trucks')),
  child('trucks-compare', `${DEV_BASE}/sitemap/similar-model-sitemap/sitemap-trucks-compare.xml`, 'Trucks Compare', comparePattern('trucks')),
  child('buses-models', `${DEV_BASE}/sitemap/model-sitemap/buses-model-sitemap.xml`, 'Buses Model', modelPattern('buses')),
  child('buses-variants', `${DEV_BASE}/sitemap/model-sitemap/buses-variant-sitemap.xml`, 'Buses Variant', variantPattern('buses')),
  child('buses-reviews', `${DEV_BASE}/sitemap/model-sitemap/buses-review-sitemap.xml`, 'Buses Review', reviewPattern('buses')),
  child('buses-prices', `${DEV_BASE}/sitemap/model-sitemap/parent-buses-price-sitemap.xml`, 'Buses Price', pricePattern('buses')),
  child('buses-filters', `${DEV_BASE}/sitemap/filter-sitemap/sitemap-buses-filters.xml`, 'Buses Filter', filterPattern('buses')),
  child('buses-dealers', `${DEV_BASE}/sitemap/dealers-sitemap/sitemap-buses-dealers.xml`, 'Buses Dealer', dealerPattern('buses')),
  child('buses-servicecenters', `${DEV_BASE}/sitemap/servicecenters-sitemap/sitemap-buses-servicecenter.xml`, 'Buses Service Center', serviceCenterPattern('buses')),
  child('buses-compare', `${DEV_BASE}/sitemap/similar-model-sitemap/sitemap-buses-compare.xml`, 'Buses Compare', comparePattern('buses')),
  child('auto-rickshaws-models', `${DEV_BASE}/sitemap/model-sitemap/auto-rickshaws-model-sitemap.xml`, 'Auto-Rickshaws Model', modelPattern('auto-rickshaws')),
  child('auto-rickshaws-variants', `${DEV_BASE}/sitemap/model-sitemap/auto-rickshaws-variant-sitemap.xml`, 'Auto-Rickshaws Variant', variantPattern('auto-rickshaws')),
  child('auto-rickshaws-reviews', `${DEV_BASE}/sitemap/model-sitemap/auto-rickshaws-review-sitemap.xml`, 'Auto-Rickshaws Review', reviewPattern('auto-rickshaws')),
  child('auto-rickshaws-prices', `${DEV_BASE}/sitemap/model-sitemap/parent-auto-rickshaws-price-sitemap.xml`, 'Auto-Rickshaws Price', pricePattern('auto-rickshaws')),
  child('auto-rickshaws-filters', `${DEV_BASE}/sitemap/filter-sitemap/sitemap-auto-rickshaws-filters.xml`, 'Auto-Rickshaws Filter', filterPattern('auto-rickshaws')),
  child('auto-rickshaws-dealers', `${DEV_BASE}/sitemap/dealers-sitemap/sitemap-auto-rickshaws-dealers.xml`, 'Auto-Rickshaws Dealer', dealerPattern('auto-rickshaws')),
  child('auto-rickshaws-servicecenters', `${DEV_BASE}/sitemap/servicecenters-sitemap/sitemap-auto-rickshaws-servicecenter.xml`, 'Auto-Rickshaws Service Center', serviceCenterPattern('auto-rickshaws')),
  child('auto-rickshaws-compare', `${DEV_BASE}/sitemap/similar-model-sitemap/sitemap-auto-rickshaws-compare.xml`, 'Auto-Rickshaws Compare', comparePattern('auto-rickshaws')),
  child('charging', `${DEV_BASE}/sitemap/electric-charging-sitemaps/sitemap-electric-charging-stations.xml`, 'Electric Charging Stations', new RegExp(`^${DEV_BASE}/${localeOpt}electric/charging-stations/${slug}$`)),
  child('news', `${DEV_BASE}/sitemap/news-sitemap/news-sitemap.xml`, 'News', new RegExp(`^${DEV_BASE}/${localeOpt}news/${slug}(?:/${slug})?$`)),
  child('blog', `${DEV_BASE}/sitemap/blog-sitemap/blog-sitemap.xml`, 'Blog', new RegExp(`^${DEV_BASE}/${localeOpt}blog/${slug}(?:/${slug})?$`)),
  child('web-stories', `${DEV_BASE}/sitemap/web-stories-sitemap/web-stories-sitemap.xml`, 'Web Stories', new RegExp(`^${DEV_BASE}/${localeOpt}web-stories/${slug}(?:/${slug})?$`)),
];

export const CHILD_SITEMAP_MAP = new Map(CHILD_SITEMAPS.map(d => [d.url, d]));
export const EXPECTED_CHILD_SITEMAP_URLS = CHILD_SITEMAPS.map(d => d.url);
