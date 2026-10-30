'use server';

/**
 * Server Action para registrar conversión.
 * - Una conversión por visitante (no por sesión)
 * - Solo se dispara desde el CTA (botón)
 * - Valida el log antes de guardar
 * - Persiste en base de datos (usamos archivo JSON como base simple)
 */

import { validateLogEvent, validateVisitorId, type Variant, type LogEvent } from '@/lib/experiment';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'data', 'events.json');

async function ensureDataDir() {
  const dataDir = path.dirname(LOG_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readLog(): Promise<LogEvent[]> {
  await ensureDataDir();
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.filter(validateLogEvent);
    }
  } catch {
    // Archivo no existe o corrupto
  }
  return [];
}

async function writeLog(events: LogEvent[]) {
  await ensureDataDir();
  await fs.writeFile(LOG_FILE, JSON.stringify(events, null, 2));
}

/**
 * Verifica si el visitante ya convirtió.
 */
async function hasConverted(visitorId: string): Promise<boolean> {
  const events = await readLog();
  return events.some((e) => e.visitorId === visitorId && e.type === 'conversion');
}

/**
 * Registra una conversión para el visitante actual.
 * Retorna { ok: true } si se registró, { ok: false, reason } si no.
 */
export async function registerConversion(): Promise<{ ok: boolean; reason?: string }> {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('lab-visitor')?.value;

  if (!visitorId || !validateVisitorId(visitorId)) {
    return { ok: false, reason: 'Visitante no identificado' };
  }

  // Obtener variante del header que setea el middleware
  // En server action no tenemos headers, así que recalculamos
  const { stableHash } = await import('@/lib/experiment');
  const variant = stableHash(visitorId);

  // Verificar si ya convirtió
  const alreadyConverted = await hasConverted(visitorId);
  if (alreadyConverted) {
    return { ok: false, reason: 'Ya convirtió' };
  }

  // Registrar conversión
  const event: LogEvent = {
    visitorId,
    variant,
    type: 'conversion',
    timestamp: Date.now(),
  };

  const events = await readLog();
  events.push(event);
  await writeLog(events);

  return { ok: true };
}

/**
 * Registra una impresión (llamado desde la página si el middleware lo indica).
 * El middleware ya controla la ventana de 30 min, aquí solo persistimos.
 */
export async function registerImpression(): Promise<{ ok: boolean; reason?: string }> {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('lab-visitor')?.value;

  if (!visitorId || !validateVisitorId(visitorId)) {
    return { ok: false, reason: 'Visitante no identificado' };
  }

  const { stableHash } = await import('@/lib/experiment');
  const variant = stableHash(visitorId);

  const event: LogEvent = {
    visitorId,
    variant,
    type: 'impression',
    timestamp: Date.now(),
  };

  const events = await readLog();
  events.push(event);
  await writeLog(events);

  return { ok: true };
}

/**
 * Obtiene estadísticas para la bitácora.
 * Combina eventos reales + caso fijo.
 */
export async function getStats() {
  const events = await readLog();

  const counts = {
    A: { impressions: 0, conversions: 0 },
    B: { impressions: 0, conversions: 0 },
  };

  for (const e of events) {
    if (e.type === 'impression') counts[e.variant].impressions++;
    if (e.type === 'conversion') counts[e.variant].conversions++;
  }

  // Sumar caso fijo
  const { FIXED_CASE } = await import('@/lib/experiment');
  counts.A.impressions += FIXED_CASE.A.impressions;
  counts.A.conversions += FIXED_CASE.A.conversions;
  counts.B.impressions += FIXED_CASE.B.impressions;
  counts.B.conversions += FIXED_CASE.B.conversions;

  const { calculateRate, calculateDifference } = await import('@/lib/experiment');

  const rateA = calculateRate(counts.A.impressions, counts.A.conversions);
  const rateB = calculateRate(counts.B.impressions, counts.B.conversions);
  const diff = calculateDifference(rateA, rateB);

  // También rates del caso fijo solo
  const fixedRateA = calculateRate(FIXED_CASE.A.impressions, FIXED_CASE.A.conversions);
  const fixedRateB = calculateRate(FIXED_CASE.B.impressions, FIXED_CASE.B.conversions);
  const fixedDiff = calculateDifference(fixedRateA, fixedRateB);

  return {
    live: {
      A: { ...counts.A, rate: rateA },
      B: { ...counts.B, rate: rateB },
      diff,
    },
    fixed: {
      A: { ...FIXED_CASE.A, rate: fixedRateA },
      B: { ...FIXED_CASE.B, rate: fixedRateB },
      diff: fixedDiff,
    },
  };
}