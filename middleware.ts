/**
 * Middleware para /practica
 * - Asigna visitante y variante en el primer request sin cookie
 * - Persiste cookie httpOnly con path /, max-age 30 días
 * - Anota una impresión por sesión de 30 minutos
 * - No cambia la variante en recargas
 * - Preview (?preview=a|b) no pisa la cookie ni cuenta como impresión
 */

import { NextRequest, NextResponse } from 'next/server';
import { stableHash, generateVisitorId, validateVisitorId, type Variant } from '@/lib/experiment';

const COOKIE_NAME = 'lab-visitor';
const SESSION_COOKIE_NAME = 'lab-session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
const SESSION_MAX_AGE = 60 * 30; // 30 minutos

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const preview = url.searchParams.get('preview');

  // Si es preview, no procesamos asignación ni impresiones
  // Solo pasamos el request para que la página renderice con el preview
  if (preview === 'a' || preview === 'b') {
    const response = NextResponse.next();
    // Aseguramos que no se cachee el preview
    response.headers.set('Cache-Control', 'no-store, private');
    return response;
  }

  // Obtener o crear visitorId
  let visitorId = request.cookies.get(COOKIE_NAME)?.value;
  let isNewVisitor = false;

  if (!visitorId || !validateVisitorId(visitorId)) {
    visitorId = generateVisitorId();
    isNewVisitor = true;
  }

  // Derivar variante del visitorId (determinístico)
  const variant = stableHash(visitorId);

  // Verificar sesión para impresión
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const now = Date.now();
  let shouldCountImpression = false;

  if (!sessionCookie) {
    shouldCountImpression = true;
  } else {
    const sessionStart = parseInt(sessionCookie, 10);
    if (isNaN(sessionStart) || now - sessionStart > SESSION_MAX_AGE * 1000) {
      shouldCountImpression = true;
    }
  }

  const response = NextResponse.next();

  // Setear cookies si es visitante nuevo o sesión nueva
  if (isNewVisitor) {
    response.cookies.set(COOKIE_NAME, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
  }

  if (shouldCountImpression) {
    response.cookies.set(SESSION_COOKIE_NAME, now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    // Header para que la página sepa que debe registrar impresión
    response.headers.set('x-lab-impression', '1');
    response.headers.set('x-lab-variant', variant);
    response.headers.set('x-lab-visitor', visitorId);
  } else {
    response.headers.set('x-lab-variant', variant);
    response.headers.set('x-lab-visitor', visitorId);
  }

  // Canonical siempre limpio, sin query
  response.headers.set('x-lab-canonical', '/practica');

  return response;
}

export const config = {
  matcher: '/practica',
};