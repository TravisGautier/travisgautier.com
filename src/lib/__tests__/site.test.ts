import { describe, it, expect } from 'vitest';
import { site, publisherJsonLd } from '@/lib/site';

describe('site config', () => {
  it('unit_name_is_travis_gautier', () => {
    expect(site.name).toBe('Travis Gautier');
    expect(site.legalName).toBe('Travis Gautier');
  });

  it('unit_domain_and_url_agree', () => {
    expect(site.domain).toBe('travisgautier.com');
    expect(site.url).toBe('https://travisgautier.com');
    expect(site.url).toBe(`https://${site.domain}`);
    expect(site.url.endsWith('/')).toBe(false);
  });

  it('unit_title_template_uses_name', () => {
    expect(site.titleTemplate).toBe('%s · Travis Gautier');
    expect(site.titleTemplate).toContain('%s');
  });

  it('unit_email_identity', () => {
    expect(site.emailFromAddress).toBe('no-reply@travisgautier.com');
    expect(site.emailFrom).toContain(site.emailFromAddress);
    expect(site.emailFrom).toContain(site.name);
    expect(site.emailSignature).toContain(site.name);
  });

  it('unit_social_handles', () => {
    expect(site.twitterHandle).toBe('@TravisGautier');
    expect(site.substackProfileUrl).toMatch(/^https:\/\/substack\.com\/@/);
    expect(site.githubUrl).toBe('https://github.com/TravisGautier/travisgautier.com');
  });

  it('unit_former_name_is_isolated', () => {
    expect(site.formerName).toBe('Fabled10X');
    const rendered = Object.entries(site)
      .filter(([k]) => k !== 'formerName')
      .map(([, v]) => v)
      .join('\n');
    expect(rendered).not.toMatch(/fabled ?10 ?x/i);
  });

  it('unit_publisher_jsonld_shape', () => {
    expect(publisherJsonLd()).toEqual({
      '@type': 'Organization',
      name: 'Travis Gautier',
      url: 'https://travisgautier.com',
    });
  });
});
