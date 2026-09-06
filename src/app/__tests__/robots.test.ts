import { describe, it, expect } from 'vitest';
import robots from '../robots';
import { site } from '@/lib/site';

describe('robots', () => {
  // --- Unit ---

  it('unit_robots_allows_all', () => {
    const result = robots();
    expect(result.rules).toBeDefined();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const starRule = rules.find((r) => r.userAgent === '*');
    expect(starRule).toBeDefined();
    expect(starRule?.allow).toBe('/');
  });

  it('unit_robots_sitemap_reference', () => {
    const result = robots();
    expect(result.sitemap).toBe(`${site.url}/sitemap.xml`);
  });

  // --- Infrastructure ---

  it('infra_robots_returns_metadataroute_shape', () => {
    const result = robots();
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('sitemap');
  });

  // --- storefront-auth-4.2: Disallow gated routes ---

  it('unit_robots_disallow_gated', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const starRule = rules.find((r) => r.userAgent === '*');
    expect(starRule).toBeDefined();
    const disallow = Array.isArray(starRule?.disallow) ? starRule.disallow : [starRule?.disallow].filter(Boolean);
    expect(disallow).toContain('/products/account');
    expect(disallow).toContain('/api/products/downloads');
    expect(disallow).toContain('/login');
    expect(disallow).toContain('/api/auth');
  });

  // --- cohort-enrollment-4.3: disallow cohort gated subroutes ---

  function getDisallowList() {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const starRule = rules.find((r) => r.userAgent === '*');
    return Array.isArray(starRule?.disallow)
      ? starRule.disallow
      : [starRule?.disallow].filter(Boolean);
  }

  it('unit_robots_disallow_cohort_apply', () => {
    expect(getDisallowList()).toContain('/cohorts/*/apply');
  });

  it('unit_robots_disallow_cohort_checkout', () => {
    expect(getDisallowList()).toContain('/cohorts/*/checkout');
  });

  it('unit_robots_disallow_admin', () => {
    expect(getDisallowList()).toContain('/admin');
  });

  it('unit_robots_disallow_account_cohorts', () => {
    expect(getDisallowList()).toContain('/products/account/cohorts');
  });

  it('perm_anonymous_robots_allow', () => {
    // robots.txt is public — anonymous returns a result with allow rule
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const starRule = rules.find((r) => r.userAgent === '*');
    expect(starRule?.allow).toBe('/');
  });
});
