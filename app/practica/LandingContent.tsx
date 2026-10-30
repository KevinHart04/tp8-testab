'use client';

import { useActionState } from 'react';
import { registerConversion } from './actions';
import { getVariantData, type Variant } from '@/lib/experiment';

interface LandingContentProps {
  variant: Variant;
  isPreview: boolean;
  canonical: string;
}

/**
 * Componente de la landing con el mensaje según variante.
 * El CTA dispara la server action de conversión.
 */
export function LandingContent({ variant, isPreview, canonical }: LandingContentProps) {
  const { copy, offer } = getVariantData(variant);
  const [, submitConversion, isPending] = useActionState(registerConversion, { ok: false });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitConversion();
  };

  return (
    <html lang="es">
      <head>
        <link rel="canonical" href={canonical} />
        {isPreview && <meta name="robots" content="noindex, nofollow" />}
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {isPreview && (
          <div className="fixed top-4 right-4 z-50 bg-amber-100 border border-amber-400 text-amber-800 px-4 py-2 rounded shadow-lg text-sm font-medium">
            Preview: Variante {variant} (no indexa, no pisa cookie)
          </div>
        )}

        <main className="max-w-3xl mx-auto px-6 py-16">
          {/* Header con info de la oferta (igual en ambas variantes) */}
          <div className="mb-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Inicio</p>
                <p className="text-lg font-medium text-gray-900">{offer.inicio}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Duración</p>
                <p className="text-lg font-medium text-gray-900">{offer.duracion}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cupo</p>
                <p className="text-lg font-medium text-gray-900">{offer.cupo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Oficios</p>
                <p className="text-lg font-medium text-gray-900">{offer.oficios}</p>
              </div>
            </div>
          </div>

          {/* Contenido principal - cambia según variante */}
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <header className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {copy.titular}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {variant === 'A'
                  ? 'Cursos de carpintería, electricidad y cocina. Grupos reducidos, práctica real y salida laboral.'
                  : 'La próxima cohorte comienza el 14 de abril. Solo 12 lugares por oficio. En la edición anterior, 8 de cada 10 consiguieron trabajo antes de los 90 días.'}
              </p>
            </header>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {['Carpintería', 'Electricidad', 'Cocina'].map((oficio) => (
                  <div key={oficio} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-900">{oficio}</h3>
                    <p className="text-sm text-gray-600 mt-1">8 semanas · Grupos de 12</p>
                  </div>
                ))}
              </div>

              {/* CTA - único punto de conversión */}
              <div className="text-center pt-4 border-t border-gray-100">
                <form action={submitConversion}>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? 'Registrando...' : copy.cta}
                  </button>
                </form>
                <p className="mt-3 text-sm text-gray-500">
                  Sin compromiso. Te contactamos para confirmar tu lugar.
                </p>
              </div>
            </div>
          </article>

          {/* Footer informativo */}
          <footer className="mt-10 text-center text-sm text-gray-500">
            <p>Taller Norte — Escuela de oficios</p>
            <p className="mt-1">
              Este es un experimento A/B educativo. La oferta es idéntica en ambas variantes.
            </p>
            <p className="mt-2">
              <a href="/bitacora" className="text-blue-600 hover:underline">
                Ver bitácora del experimento
              </a>
            </p>
          </footer>
        </main>
      </body>
    </html>
  );
}