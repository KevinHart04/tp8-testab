import { getStats } from '../practica/actions';
import { calculateRate, calculateDifference, FIXED_CASE } from '@/lib/experiment';
import { StatsTable } from './BitacoraContent';

export const dynamic = 'force-dynamic';

/**
 * Página de bitácora - Server Component que obtiene stats y renderiza la tabla.
 */
export default async function BitacoraPage() {
  const stats = await getStats();

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <main className="max-w-4xl mx-auto px-6 py-16">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bitácora del experimento</h1>
            <p className="text-gray-600">
              Impresiones, conversiones y tasas por variante. Incluye caso de prueba fijo.
            </p>
          </header>

          <StatsTable stats={stats} />

          <section className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Caso de prueba fijo (verificación)</h2>
            <p className="text-gray-600 mb-4">
              Estos números no dependen de tu sesión. Sirven para verificar que el cálculo sea correcto.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 font-semibold text-gray-700">Variante</th>
                    <th className="pb-2 font-semibold text-gray-700 text-right">Impresiones</th>
                    <th className="pb-2 font-semibold text-gray-700 text-right">Conversiones</th>
                    <th className="pb-2 font-semibold text-gray-700 text-right">Tasa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">A · Control</td>
                    <td className="py-2 text-right text-gray-700">{FIXED_CASE.A.impressions}</td>
                    <td className="py-2 text-right text-gray-700">{FIXED_CASE.A.conversions}</td>
                    <td className="py-2 text-right font-mono font-medium text-gray-900">
                      {calculateRate(FIXED_CASE.A.impressions, FIXED_CASE.A.conversions)}%
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">B · Tratamiento</td>
                    <td className="py-2 text-right text-gray-700">{FIXED_CASE.B.impressions}</td>
                    <td className="py-2 text-right text-gray-700">{FIXED_CASE.B.conversions}</td>
                    <td className="py-2 text-right font-mono font-medium text-gray-900">
                      {calculateRate(FIXED_CASE.B.impressions, FIXED_CASE.B.conversions)}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-2 font-semibold text-gray-900">Diferencia (B − A)</td>
                    <td className="py-2 text-right">—</td>
                    <td className="py-2 text-right">—</td>
                    <td className="py-2 text-right font-mono font-semibold text-blue-700">
                      {calculateDifference(
                        calculateRate(FIXED_CASE.A.impressions, FIXED_CASE.A.conversions),
                        calculateRate(FIXED_CASE.B.impressions, FIXED_CASE.B.conversions)
                      )} pp
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>Cálculo manual: 18 / 240 = 0,075 = 7,50%</p>
              <p>31 / 236 ≈ 0,131355 = 13,14%</p>
              <p>Diferencia: 13,14 − 7,50 = 5,64 pp</p>
            </div>
          </section>

          <nav className="mt-8 text-center">
            <a href="/practica" className="text-blue-600 hover:underline">
              Volver a la landing (/practica)
            </a>
          </nav>
        </main>
      </body>
    </html>
  );
}