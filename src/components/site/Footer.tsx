import Link from 'next/link';
import { Parchment } from '@/components/brand/Parchment';
import { Logo } from '@/components/brand/Logo';
import { Container } from './Container';
import { site } from '@/lib/site';

export function Footer() {
  return (
    <Parchment as="footer" className="border-t border-(--edge-color)">
      <Container className="py-(--space-6) flex flex-col gap-(--space-4) md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-(--space-2)">
          <Link href="/" className="inline-flex">
            <Logo size="sm" />
          </Link>
          <p className="body-3">
            {site.tagline}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-(--space-1)">
          <span className="label">Sister Project</span>
          <a
            href="https://largelanguagelibrary.ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-(--space-2) bg-(--color-bone) text-(--color-verdigris) border border-(--edge-color-subtle) px-(--space-3) py-(--space-1) transition-colors duration-150 hover:bg-(--color-verdigris) hover:text-(--color-bone)"
          >
            largelanguagelibrary.ai
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </Parchment>
  );
}
