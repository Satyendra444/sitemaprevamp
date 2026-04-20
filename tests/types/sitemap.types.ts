/**
 * Sitemap Validation — Shared TypeScript types
 *
 * All types used across the sitemap spec suite.
 * Covers both base (EN) and /hi/ (Hindi) language URL variants.
 */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export type LangVariant = 'base' | 'hi';

export interface SitemapEntryWithLang extends SitemapEntry {
  lang: LangVariant;
  basePath: string;
}

export type SitemapGroup =
  | 'static'
  | 'trucks-models'
  | 'trucks-variants'
  | 'trucks-reviews'
  | 'trucks-prices'
  | 'trucks-filters'
  | 'trucks-dealers'
  | 'trucks-servicecenters'
  | 'trucks-compare'
  | 'buses-models'
  | 'buses-variants'
  | 'buses-reviews'
  | 'buses-prices'
  | 'buses-filters'
  | 'buses-dealers'
  | 'buses-servicecenters'
  | 'buses-compare'
  | 'auto-rickshaws-models'
  | 'auto-rickshaws-variants'
  | 'auto-rickshaws-reviews'
  | 'auto-rickshaws-prices'
  | 'auto-rickshaws-filters'
  | 'auto-rickshaws-dealers'
  | 'auto-rickshaws-servicecenters'
  | 'auto-rickshaws-compare'
  | 'charging'
  | 'news'
  | 'blog'
  | 'web-stories';

export interface ChildSitemapDescriptor {
  group: SitemapGroup;
  url: string;
  label: string;
  urlPattern: RegExp;
}

export interface ValidationResult {
  url: string;
  httpStatus: number;
  issues: string[];
  lang: LangVariant;
}

export interface SitemapHealthReport {
  group: SitemapGroup;
  childSitemapUrl: string;
  totalUrls: number;
  baseUrlCount: number;
  hiUrlCount: number;
  duplicates: string[];
  patternViolations: string[];
  httpIssues: ValidationResult[];
}
