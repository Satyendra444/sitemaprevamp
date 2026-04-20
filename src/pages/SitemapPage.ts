import type { APIRequestContext } from '@playwright/test';
import { fetchAndParseSitemap } from '../../tests/helpers/sitemap.parser';
import type { FetchResult } from '../../tests/helpers/sitemap.parser';
import { SITEMAP_ROOT_URL } from '../../tests/data/sitemap.config';

export class SitemapPage {
  readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async fetchRootSitemap(): Promise<FetchResult> {
    return fetchAndParseSitemap(SITEMAP_ROOT_URL, this.request);
  }

  async fetchChildSitemap(url: string): Promise<FetchResult> {
    return fetchAndParseSitemap(url, this.request);
  }
}
