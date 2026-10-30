import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getVariantData, type Variant } from '@/lib/experiment';
import { LandingContent } from './LandingContent';

export const dynamic = 'force-dynamic';

interface PracticaPageProps {
  searchParams: Promise<{ preview?: string }>;
}

/**
 * Genera metadata en el servidor (SSR).
 * Title y description dependen de la variante.
 * Canonical siempre /practica sin query.
 * Preview lleva noindex.
 */
export async function generateMetadata({ searchParams }: PracticaPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const preview = resolvedSearchParams.preview;

  // Headers que setea el middleware
  const headersList = await headers();
  const variantHeader = headersList.get('x-lab-variant') as Variant | null;
  const isPreview = preview === 'a' || preview === 'b';

  // Determinar variante: preview tiene prioridad para mostrar, pero no para SEO
  // Preview viene en minúscula, convertir a mayúscula
  const previewVariant = preview?.toUpperCase() as Variant | undefined;
  const displayVariant: Variant = previewVariant || variantHeader || 'A';

  const { copy } = getVariantData(displayVariant);

  const metadata: Metadata = {
    title: copy.title,
    description: copy.description,
    metadataBase: new URL('http://localhost:3000'),
    alternates: {
      canonical: '/practica',
    },
    robots: isPreview ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: 'website',
      url: '/practica',
    },
  };

  return metadata;
}

export default async function PracticaPage({ searchParams }: PracticaPageProps) {
  const resolvedSearchParams = await searchParams;
  const preview = resolvedSearchParams.preview;

  // Headers que setea el middleware
  const headersList = await headers();
  const variantHeader = headersList.get('x-lab-variant') as Variant | null;
  const shouldRegisterImpression = headersList.get('x-lab-impression') === '1';

  // Determinar variante a mostrar
  const previewVariant = preview?.toUpperCase() as Variant | undefined;
  const displayVariant: Variant = previewVariant || variantHeader || 'A';
  const isPreview = preview === 'a' || preview === 'b';

  // Registrar impresión si el middleware lo indica (lado servidor via action)
  if (shouldRegisterImpression && !isPreview) {
    // Usamos una acción asíncrona sin await para no bloquear el render
    // La acción se ejecuta en background
    const { registerImpression } = await import('./actions');
    registerImpression().catch(console.error);
  }

  return (
    <LandingContent
      variant={displayVariant}
      isPreview={isPreview}
      canonical="/practica"
    />
  );
}