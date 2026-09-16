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
