import type { Metadata } from 'next';
import { Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { getAllProducts } from '@/lib/content/products';
import { ProductCard } from '@/components/products/ProductCard';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Products',
  description:
    `Workflow templates, discovery toolkits, and the full ${site.name} playbook — the exact assets behind the channel.`,
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <Marble as="main">
      <Section rhythm="md">
        <Container>
          <header className="max-w-prose">
            <span className="label">Storefront</span>
            <h1 className="display-1 mt-(--space-3)">Products</h1>
            <p className="body-1 mt-(--space-5) text-(--color-muted)">
              Every asset the {site.name} channel and case studies are built with —
              bundled, documented, and licensed for solo consultants and agencies.
            </p>
          </header>
          {products.length === 0 ? (
            <p className="body-2 mt-(--space-7) text-(--color-muted)">
              No products yet — check back soon.
            </p>
          ) : (
            <ul className="mt-(--space-7) grid gap-(--space-4) md:grid-cols-2">
              {products.map((entry) => (
                <li key={entry.meta.id}>
                  <ProductCard product={entry.meta} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </Marble>
  );
}
