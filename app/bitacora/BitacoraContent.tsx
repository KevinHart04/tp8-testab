'use client';

interface Stats {
  live: {
    A: { impressions: number; conversions: number; rate: string | null };
    B: { impressions: number; conversions: number; rate: string | null };
    diff: string | null;
  };
  fixed: {
    A: { impressions: number; conversions: number; rate: string | null };
    B: { impressions: number; conversions: number; rate: string | null };
    diff: string | null;
  };
}

interface StatsTableProps {
  stats: Stats;
}

/**
 * Tabla de estadísticas del experimento.
 * Muestra datos en vivo + caso fijo.
 */
export function StatsTable({ stats }: StatsTableProps) {
  const { live, fixed } = stats;

  return (
    <div className="space-y-8">
      {/* Tabla en vivo */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Datos en vivo (tu sesión)
          <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-normal">
            Se actualiza al interactuar
          </span>
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-700">Variante</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Impresiones</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Conversiones</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Tasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">A · Control</td>
                  <td className="p-4 text-right text-gray-700">{live.A.impressions}</td>
                  <td className="p-4 text-right text-gray-700">{live.A.conversions}</td>
                  <td className="p-4 text-right font-mono font-medium text-gray-900">
                    {live.A.rate ? `${live.A.rate}%` : '—'}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">B · Tratamiento</td>
                  <td className="p-4 text-right text-gray-700">{live.B.impressions}</td>
                  <td className="p-4 text-right text-gray-700">{live.B.conversions}</td>
                  <td className="p-4 text-right font-mono font-medium text-gray-900">
                    {live.B.rate ? `${live.B.rate}%` : '—'}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Diferencia (B − A)</td>
                  <td className="p-4 text-right">—</td>
                  <td className="p-4 text-right">—</td>
                  <td className="p-4 text-right font-mono font-semibold text-blue-700">
                    {live.diff ? `${live.diff} pp` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {live.A.impressions === 0 && live.B.impressions === 0 && (
            <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
              Aún no hay impresiones en esta sesión. Visita <a href="/practica" className="text-blue-600 hover:underline">/practica</a> para generar datos.
            </div>
          )}
        </div>
      </section>

      {/* Nota importante */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Nota importante:</p>
        <p>
          No se declara ganador. Una tasa más alta no es una prueba estadística.
          La diferencia de {live.diff || fixed.diff} pp es solo una observación descriptiva.
        </p>
      </div>
    </div>
  );
}