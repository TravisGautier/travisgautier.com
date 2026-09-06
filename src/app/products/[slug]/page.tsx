import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { BuyButton } from '@/components/products/BuyButton';
import { getAllProducts, getProductBySlug } from '@/lib/content/products';
import { site } from '@/lib/site';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_LICENSE_LABELS,
} from '@/content/schemas';

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) return {};
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: 'website',
      images: meta.heroImageUrl ? [meta.heroImageUrl] : undefined,
    },
  };
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const { meta, Component } = entry;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: meta.title,
    description: meta.summary,
    category: PRODUCT_CATEGORY_LABELS[meta.category],
    ...(meta.heroImageUrl ? { image: meta.heroImageUrl } : {}),
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      price: (meta.priceCents / 100).toFixed(2),
      priceCurrency: meta.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      url: `${site.url}/products/${meta.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Marble as="main">
        <Section rhythm="lg">
          <Container as="article" width="prose">
            <span className="label">
              {PRODUCT_CATEGORY_LABELS[meta.category]}
            </span>
            <h1 className="display-1 mt-(--space-3)">{meta.title}</h1>
            <p className="body-1 mt-(--space-5) text-(--color-muted)">
              {meta.tagline}
            </p>

            <div className="mt-(--space-7) flex flex-wrap items-center justify-between gap-(--space-4) border-t border-b border-(--edge-color) py-(--space-4)">
              <div className="flex items-baseline gap-(--space-3)">
                <span className="mono text-2xl">
                  {formatPrice(meta.priceCents, meta.currency)}
                </span>
                <span className="label">
                  {PRODUCT_LICENSE_LABELS[meta.licenseType]}
                </span>
              </div>
              <BuyButton
                productSlug={meta.slug}
                priceCents={meta.priceCents}
                currency={meta.currency}
              />
            </div>

            <div className="build-log-prose mt-(--space-7)">
              <Component />
            </div>
          </Container>
        </Section>
      </Marble>
    </>
  );
}
