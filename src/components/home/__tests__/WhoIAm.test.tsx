import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { site } from '@/lib/site';
import { PROFILE_LINKS, WhoIAm } from '../WhoIAm';

describe('WhoIAm', () => {
  it('unit_renders_kicker_heading_and_name', () => {
    render(<WhoIAm />);
    expect(screen.getByText('Who I am').className).toMatch(/\blabel\b/);
    const h2 = screen.getByRole('heading', { level: 2, name: site.name });
    expect(h2.className).toMatch(/\bdisplay-3\b/);
  });

  it('unit_headshot_uses_site_path_and_brand_edge', () => {
    render(<WhoIAm />);
    const img = screen.getByAltText(`${site.name} headshot`);
    expect(img.getAttribute('src')).toContain(encodeURIComponent(site.headshotPath));
    expect(img.className).toMatch(/rounded-full/);
    expect(img.className).toMatch(/border-\(--color-oxblood\)/);
  });

  it('unit_profile_links_all_present_and_external_safe', () => {
    render(<WhoIAm />);
    expect(PROFILE_LINKS).toHaveLength(5);
    for (const { label, href } of PROFILE_LINKS) {
      const a = screen.getByRole('link', { name: label });
      expect(a).toHaveAttribute('href', href);
      expect(a).toHaveAttribute('target', '_blank');
      expect(a.getAttribute('rel')).toMatch(/noreferrer/);
    }
  });

  it('unit_profile_links_come_from_site_constants_not_literals', () => {
    const hrefs = PROFILE_LINKS.map((l) => l.href);
    expect(hrefs).toEqual([
      site.githubProfileUrl,
      site.xUrl,
      site.linkedinUrl,
      site.youtubeUrl,
      site.substackProfileUrl,
    ]);
  });

  it('unit_resume_is_a_download_link_to_site_resume_path', () => {
    render(<WhoIAm />);
    const a = screen.getByRole('link', { name: /download resume/i });
    expect(a).toHaveAttribute('href', site.resumePath);
    expect(a).toHaveAttribute('download');
  });

  it('a11y_section_labelled_by_heading', () => {
    render(<WhoIAm />);
    const section = screen.getByTestId('who-i-am');
    expect(section.getAttribute('aria-labelledby')).toBe('who-i-am-heading');
    expect(document.getElementById('who-i-am-heading')).not.toBeNull();
  });

  it('security_no_hardcoded_phone_or_email', () => {
    const { container } = render(<WhoIAm />);
    expect(container.textContent).not.toMatch(/\d{3}-\d{3}-\d{4}/);
    expect(container.textContent).not.toMatch(/@\w+\.\w+/);
  });
});
