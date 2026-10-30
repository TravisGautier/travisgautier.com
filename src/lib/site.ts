export const site = {
  name: 'Travis Gautier',
  legalName: 'Travis Gautier',
  formerName: 'Fabled10X',
  domain: 'travisgautier.com',
  url: 'https://travisgautier.com',
  titleTemplate: '%s · Travis Gautier',
  tagline: 'Teaching freelancers and small teams to run an agent team and win retail clients.',
  heroKicker: 'Travis Gautier · Agentic development for retail',
  twitterHandle: '@TravisGautier',
  emailFromAddress: 'no-reply@travisgautier.com',
  emailFrom: 'Travis Gautier <no-reply@travisgautier.com>',
  emailSignature: '— Travis Gautier',
  sisterProjectUrl: 'https://largelanguagelibrary.ai',
  substackName: 'The Forward Deployed Freelancer',
  substackPublicationUrl: 'https://travisgautier.substack.com',
  substackFeedUrl: 'https://travisgautier.substack.com/feed',
  substackEmbedUrl: 'https://travisgautier.substack.com/embed',
  substackProfileUrl: 'https://substack.com/@travisgautier',
  githubUrl: 'https://github.com/TravisGautier/travisgautier.com',
  githubProfileUrl: 'https://github.com/TravisGautier',
  xUrl: 'https://x.com/travisgautier',
  linkedinUrl: 'https://www.linkedin.com/in/travisgautier/',
  youtubeUrl: 'https://www.youtube.com/@travisgautier',
  headshotPath: '/media/travis-gautier.jpg',
  resumePath: '/resume/Travis-Gautier-Resume-2026-AI.pdf',
} as const;

export function publisherJsonLd() {
  return { '@type': 'Organization', name: site.name, url: site.url } as const;
}

export function personJsonLd() {
  return {
    '@type': 'Person',
    name: site.name,
    url: site.url,
    image: `${site.url}${site.headshotPath}`,
    sameAs: [
      site.substackPublicationUrl,
      site.youtubeUrl,
      site.xUrl,
      site.linkedinUrl,
      site.githubProfileUrl,
    ],
  } as const;
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.tagline,
    publisher: personJsonLd(),
  } as const;
}

interface UtmParams {
  medium: string;
  campaign?: string;
  content?: string;
}

/** Outbound link to the publication tagged so Substack's dashboard attributes it. */
export function substackLink(path: string, utm: UtmParams): string {
  const url = new URL(path, site.substackPublicationUrl);
  url.searchParams.set('utm_source', site.domain);
  url.searchParams.set('utm_medium', utm.medium);
  if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
  if (utm.content) url.searchParams.set('utm_content', utm.content);
  return url.toString();
}
