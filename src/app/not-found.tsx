import Link from 'next/link';
import { Marble, Section, DropAccent } from '@/components/brand';
import { Container } from '@/components/site/Container';

export default function NotFound() {
  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose" className="text-center">
          <span className="label">404</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="✕">No entry by that name</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            The page you asked for isn&apos;t in the library.
          </p>
          <div className="mt-(--space-6) flex flex-wrap justify-center gap-(--space-5)">
            <Link
              href="/"
              className="label text-(--color-oxblood) inline-block border-b border-(--color-oxblood) pb-(--space-1)"
            >
              Return home →
            </Link>
            <Link
              href="/writing"
              className="label text-(--color-oxblood) inline-block border-b border-(--color-oxblood) pb-(--space-1)"
            >
              Read the essays →
            </Link>
          </div>
        </Container>
      </Section>
    </Marble>
  );
}
