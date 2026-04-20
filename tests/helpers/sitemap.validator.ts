import { expect } from '@playwright/test';
import type { SitemapEntryWithLang } from '../types/sitemap.types';
import { MAX_URLS_PER_SITEMAP, LASTMOD_RE } from '../data/sitemap.config';
import { partitionByLang } from './sitemap.parser';

export function assertNoEmptyLoc(entries: SitemapEntryWithLang[], label: string): void {
  const empty = entries.filter(e => !e.loc || e.loc.trim() === '');
  expect(empty.length, `[${label}] Expected 0 empty <loc> entries, Actual: ${empty.length}`).toBe(0);
}

export function assertLastmodFormat(entries: SitemapEntryWithLang[], label: string): void {
  const invalid = entries.filter(e => e.lastmod && !LASTMOD_RE.test(e.lastmod));
  expect(
    invalid.length,
    `[${label}] Expected 0 invalid <lastmod> formats, Actual: ${invalid.length}\nInvalid entries:\n` + invalid.slice(0, 5).map(e => `  ${e.loc} → "${e.lastmod}"`).join('\n')
  ).toBe(0);
}

export function assertNoDuplicates(entries: SitemapEntryWithLang[], label: string): void {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const e of entries) {
    if (seen.has(e.loc)) dupes.push(e.loc);
    else seen.add(e.loc);
  }
  expect(
    dupes.length,
    `[${label}] Expected 0 duplicate <loc> values, Actual: ${dupes.length}\nDuplicates found:\n` + dupes.slice(0, 10).map(u => `  ${u}`).join('\n')
  ).toBe(0);
}

export function assertUrlCount(entries: SitemapEntryWithLang[], label: string, max = MAX_URLS_PER_SITEMAP): void {
  expect(entries.length, `[${label}] Expected URL count <= ${max}, Actual: ${entries.length}`).toBeLessThanOrEqual(max);
}

export function assertNotEmpty(entries: SitemapEntryWithLang[], label: string): void {
  expect(entries.length, `[${label}] Expected > 0 <url> entries, Actual: ${entries.length}`).toBeGreaterThan(0);
}

export function assertUrlPattern(entries: SitemapEntryWithLang[], pattern: RegExp, label: string): void {
  const violations = entries.filter(e => !pattern.test(e.loc));
  expect(
    violations.length,
    `[${label}] Expected 0 URLs failing pattern ${pattern}, Actual: ${violations.length}\nViolations:\n` + violations.slice(0, 10).map(e => `  [${e.lang}] ${e.loc}`).join('\n')
  ).toBe(0);
}

export function assertBothLangsPresent(entries: SitemapEntryWithLang[], label: string): void {
  const { base, hi } = partitionByLang(entries);
  expect(base.length, `[${label}] Expected > 0 base (EN) URLs, Actual: ${base.length}`).toBeGreaterThan(0);
  expect(hi.length, `[${label}] Expected > 0 /hi/ URLs, Actual: ${hi.length}`).toBeGreaterThan(0);
}

export function assertHiVariantCoverage(entries: SitemapEntryWithLang[], label: string): void {
  const { base, hi } = partitionByLang(entries);
  const hiBasePaths = new Set(hi.map(e => e.basePath));
  const missingHi = base.filter(e => !hiBasePaths.has(e.basePath));
  expect(
    missingHi.length,
    `[${label}] Expected 0 base URLs missing a /hi/ counterpart, Actual: ${missingHi.length}\nMissing /hi/ variants for:\n` + missingHi.slice(0, 10).map(e => `  ${e.loc}`).join('\n')
  ).toBe(0);
}

export function assertLangBalance(entries: SitemapEntryWithLang[], label: string, tolerancePct = 5): void {
  const { base, hi } = partitionByLang(entries);
  if (base.length === 0 && hi.length === 0) return;
  const diff = Math.abs(base.length - hi.length);
  const pct = (diff / Math.max(base.length, hi.length)) * 100;
  expect(
    pct,
    `[${label}] Expected language imbalance <= ${tolerancePct}%, Actual: ${pct.toFixed(1)}% (base=${base.length}, hi=${hi.length})`
  ).toBeLessThanOrEqual(tolerancePct);
}

export function assertSitemapStructure(entries: SitemapEntryWithLang[], pattern: RegExp, label: string, checkLang = true): void {
  assertNotEmpty(entries, label);
  assertNoEmptyLoc(entries, label);
  assertLastmodFormat(entries, label);
  assertNoDuplicates(entries, label);
  assertUrlCount(entries, label);
  assertUrlPattern(entries, pattern, label);
  if (checkLang) {
    assertBothLangsPresent(entries, label);
    assertLangBalance(entries, label);
  }
}
