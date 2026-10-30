/**
 * Experiment logic: copy, oferta, hash estable, tasa y validación del log.
 * Separado del framework para que sea testeable y reutilizable.
 */

export type Variant = 'A' | 'B';

export interface Offer {
  inicio: string;
  duracion: string;
  cupo: string;
  oficios: string;
}

export interface Copy {
  title: string;
  description: string;
  titular: string;
  cta: string;
}

export interface VariantData {
  variant: Variant;
  copy: Copy;
  offer: Offer;
}

export const OFFER: Offer = {
  inicio: '14 de abril',
  duracion: '8 semanas',
  cupo: '12 personas',
  oficios: 'carpintería, electricidad y cocina',
};

export const COPY: Record<Variant, Copy> = {
  A: {
    title: 'Cursos de oficio en ocho semanas, con salida laboral',
    description:
      'Aprendé carpintería, electricidad o cocina en ocho semanas. Grupos de doce personas y práctica real, con una salida laboral que se puede cobrar.',
    titular: 'Ocho semanas para un oficio que se puede cobrar.',
    cta: 'Ver cupos de abril',
  },
  B: {
    title: 'Abril abre cupos: cursos de oficio en grupos de 12',
    description:
      'El 14 de abril empiezan grupos de doce. En la cohorte anterior, ocho de cada diez consiguieron trabajo en el rubro antes de los noventa días.',
    titular: 'El curso empieza el 14 de abril. El cupo, no.',
    cta: 'Reservar mi lugar',
  },
};

export function getVariantData(variant: Variant): VariantData {
  return {
    variant,
    copy: COPY[variant],
    offer: OFFER,
  };
}

/**
 * Hash estable: mismo identificador -> misma variante siempre.
 * Usa FNV-1a de 32 bits, determinístico y rápido.
 * No usa Math.random() ni fecha actual.
 */
export function stableHash(visitorId: string): Variant {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < visitorId.length; i++) {
    hash ^= visitorId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Hash positivo y par/impar para A/B
  return (hash >>> 0) % 2 === 0 ? 'A' : 'B';
}

/**
 * Genera un ID de visitante aleatorio (solo la primera vez).
 * Se guarda en cookie httpOnly.
 */
export function generateVisitorId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida que el visitorId tenga formato correcto (hex de 32 chars).
 */
export function validateVisitorId(id: string): boolean {
  return /^[a-f0-9]{32}$/.test(id);
}

/**
 * Caso de prueba fijo para la bitácora.
 * Estos números no cambian y sirven para verificar el cálculo.
 */
export const FIXED_CASE = {
  A: { impressions: 240, conversions: 18 },
  B: { impressions: 236, conversions: 31 },
};

export function calculateRate(impressions: number, conversions: number): string | null {
  if (impressions === 0) return null;
  const rate = (conversions / impressions) * 100;
  return rate.toFixed(2).replace('.', ',');
}

export function calculateDifference(rateA: string | null, rateB: string | null): string | null {
  if (rateA === null || rateB === null) return null;
  const a = parseFloat(rateA.replace(',', '.'));
  const b = parseFloat(rateB.replace(',', '.'));
  const diff = b - a;
  return diff.toFixed(2).replace('.', ',');
}

export function getFixedCaseRates() {
  const rateA = calculateRate(FIXED_CASE.A.impressions, FIXED_CASE.A.conversions);
  const rateB = calculateRate(FIXED_CASE.B.impressions, FIXED_CASE.B.conversions);
  const diff = calculateDifference(rateA, rateB);
  return { rateA, rateB, diff };
}

/**
 * Valida un evento de log antes de guardarlo.
 */
export interface LogEvent {
  visitorId: string;
  variant: Variant;
  type: 'impression' | 'conversion';
  timestamp: number;
}

export function validateLogEvent(event: unknown): event is LogEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as Record<string, unknown>;
  return (
    typeof e.visitorId === 'string' &&
    validateVisitorId(e.visitorId) &&
    (e.variant === 'A' || e.variant === 'B') &&
    (e.type === 'impression' || e.type === 'conversion') &&
    typeof e.timestamp === 'number'
  );
}