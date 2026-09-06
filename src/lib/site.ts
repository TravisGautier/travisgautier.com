export const site = {
  name: 'Travis Gautier',
  legalName: 'Travis Gautier',
  formerName: 'Fabled10X',
  domain: 'travisgautier.com',
  url: 'https://travisgautier.com',
  titleTemplate: '%s · Travis Gautier',
  tagline: 'One person. An agent team. Full SaaS delivery.',
  heroKicker: 'Travis Gautier · Solo SaaS delivery',
  twitterHandle: '@TravisGautier',
  emailFromAddress: 'no-reply@travisgautier.com',
  emailFrom: 'Travis Gautier <no-reply@travisgautier.com>',
  emailSignature: '— Travis Gautier',
  sisterProjectUrl: 'https://largelanguagelibrary.ai',
  substackProfileUrl: 'https://substack.com/@travisgautier',
  githubUrl: 'https://github.com/TravisGautier/travisgautier.com',
} as const;

export function publisherJsonLd() {
  return { '@type': 'Organization', name: site.name, url: site.url } as const;
}
