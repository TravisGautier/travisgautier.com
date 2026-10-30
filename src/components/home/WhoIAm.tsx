import Image from 'next/image';
import { Bone, Button, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { site } from '@/lib/site';

export const PROFILE_LINKS = [
  { label: 'GitHub', href: site.githubProfileUrl },
  { label: 'X', href: site.xUrl },
  { label: 'LinkedIn', href: site.linkedinUrl },
  { label: 'YouTube', href: site.youtubeUrl },
  { label: 'Substack', href: site.substackPublicationUrl },
] as const;

export function WhoIAm() {
  return (
    <Section rhythm="md" aria-labelledby="who-i-am-heading" data-testid="who-i-am">
      <Container>
        <Bone edge="subtle" className="p-(--space-6) flex flex-col gap-(--space-5) md:flex-row md:items-start md:gap-(--space-7)">
          <Image
            src={site.headshotPath}
            alt={`${site.name} headshot`}
            width={160}
            height={160}
            className="shrink-0 rounded-full border border-(--color-oxblood) object-cover"
          />
          <div className="flex flex-col gap-(--space-4)">
            <span className="label">Who I am</span>
            <h2 id="who-i-am-heading" className="display-3">{site.name}</h2>
            <p className="body-2 text-(--color-muted) max-w-prose">
              I keep a hospital&apos;s computers running during the day and build
              software for small businesses at night. Fifteen years of this
              professionally, five of them teaching web design and A+ to high
              schoolers. Since November 2025 I build with a team of AI coding
              agents. Four agents at once is a normal day. Eight run comfortably.
            </p>
            <ul className="flex flex-wrap gap-x-(--space-5) gap-y-(--space-2)">
              {PROFILE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="label text-(--color-oxblood) border-b border-(--color-oxblood) pb-(--space-1)"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div>
              <Button as="a" href={site.resumePath} download variant="ghost">
                Download resume (PDF)
              </Button>
            </div>
          </div>
        </Bone>
      </Container>
    </Section>
  );
}
