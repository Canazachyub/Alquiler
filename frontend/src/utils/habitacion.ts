import type { Habitacion } from '@/types';

/** Precio por defecto al activar internet en un cuarto */
export const PRECIO_INTERNET_DEFAULT = 20;

/** El internet es opcional: un cuarto lo tiene solo si su monto es mayor que 0. */
export function tieneInternet(h: Pick<Habitacion, 'montoInternet'>): boolean {
  return Number(h.montoInternet || 0) > 0;
}

/** Internet al día: pagado, o el cuarto no tiene internet contratado. */
export function internetAlDia(h: Pick<Habitacion, 'montoInternet' | 'internetPagado'>): boolean {
  return !tieneInternet(h) || !!h.internetPagado;
}

/** Lo que el cuarto debe en el mes (alquiler + internet si lo tiene). */
export function deudaMes(h: Pick<Habitacion, 'montoAlquiler' | 'montoInternet' | 'alquilerPagado' | 'internetPagado'>): number {
  return (
    (h.alquilerPagado ? 0 : Number(h.montoAlquiler || 0)) +
    (internetAlDia(h) ? 0 : Number(h.montoInternet || 0))
  );
}

/** Ocupado y sin nada pendiente en el mes. */
export function alDia(h: Pick<Habitacion, 'montoInternet' | 'alquilerPagado' | 'internetPagado'>): boolean {
  return !!h.alquilerPagado && internetAlDia(h);
}
