/**
 * Personas que reciben los pagos. Se anota en las observaciones del pago
 * ("Cobró Yubert") y en el resumen impreso se muestra solo la inicial.
 */
export const COBRADORES = [
  { nombre: 'Yubert', inicial: 'Y' },
  { nombre: 'Julio', inicial: 'J' },
  { nombre: 'Mamá', inicial: 'M' },
] as const;

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Inicial de quien cobró, leída de las observaciones del pago.
 * "Julio" también es un mes, así que solo cuenta si va precedido de
 * "a", "cobró", "recibió", "por" o "entregó" (p. ej. "pago a Julio").
 */
export function inicialCobrador(observaciones?: string): string {
  const t = sinTildes(observaciones ?? '');
  if (!t) return '';
  if (/\byubert\b/.test(t)) return 'Y';
  if (/\bmama\b/.test(t)) return 'M';
  if (/\b(a|cobro|recibio|por|entrego)\s*:?\s*julio\b/.test(t)) return 'J';
  return '';
}

/** Texto que se guarda en observaciones al elegir quién cobró */
export const textoCobrador = (nombre: string) => `Cobró ${nombre}`;
