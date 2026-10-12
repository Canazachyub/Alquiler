import type { GastoFijo, Gasto, HabitacionConDetalles } from '@/types';

/**
 * Servicios (luz, agua, internet) prorrateados por cuarto como % del alquiler.
 *
 *   aporte_servicio(cuarto) = alquiler × porcentaje_servicio / 100
 *   aporte_total(servicio)  = Σ aporte_servicio(cuarto ocupado)
 *   saldo(servicio)         = aporte_total − factura del mes
 *
 * Modo "incluido": el aporte sale del alquiler (alquiler neto = alquiler − Σ aportes).
 * Modo "adicional": el aporte se cobra encima del alquiler.
 */

export type ServicioClave = 'luz' | 'agua' | 'internet';
export type ModoServicios = 'incluido' | 'adicional';

export interface ConfigServicios {
  porcentajes: Record<ServicioClave, number>;
  modo: ModoServicios;
}

export const SERVICIOS: { clave: ServicioClave; label: string }[] = [
  { clave: 'luz', label: 'Luz' },
  { clave: 'agua', label: 'Agua' },
  { clave: 'internet', label: 'Internet' },
];

/**
 * Por defecto según los recibos de Casa Progreso (oct 2026):
 *   % = recibo promedio ÷ alquileres ocupados × 100, redondeado hacia arriba a 0.5
 *   luz  S/ 214.53 ÷ S/ 1,910 = 11.2 % → 11.5 %
 *   agua S/  57.20 ÷ S/ 1,910 =  3.0 % →  3 %
 */
export const CONFIG_SERVICIOS_DEFAULT: ConfigServicios = {
  porcentajes: { luz: 11.5, agua: 3, internet: 1 },
  modo: 'incluido',
};

const LS_KEY = 'alquiler-config-servicios';
// Al subir la versión, los % guardados de luz y agua se reemplazan por los nuevos por defecto
const VERSION_CONFIG = 2;

export function leerConfigServicios(): ConfigServicios {
  try {
    const c = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (c?.porcentajes && c.version !== VERSION_CONFIG) {
      const migrada: ConfigServicios = {
        ...CONFIG_SERVICIOS_DEFAULT,
        modo: c.modo ?? CONFIG_SERVICIOS_DEFAULT.modo,
        porcentajes: { ...CONFIG_SERVICIOS_DEFAULT.porcentajes, internet: c.porcentajes.internet ?? CONFIG_SERVICIOS_DEFAULT.porcentajes.internet },
      };
      guardarConfigServicios(migrada);
      return migrada;
    }
    if (c?.porcentajes) return { ...CONFIG_SERVICIOS_DEFAULT, ...c, porcentajes: { ...CONFIG_SERVICIOS_DEFAULT.porcentajes, ...c.porcentajes } };
  } catch {
    /* sin almacenamiento */
  }
  return CONFIG_SERVICIOS_DEFAULT;
}

export function guardarConfigServicios(c: ConfigServicios) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...c, version: VERSION_CONFIG }));
  } catch {
    /* sin almacenamiento */
  }
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function aporteCuarto(h: HabitacionConDetalles, cfg: ConfigServicios) {
  const alquiler = Number(h.montoAlquiler || 0);
  const por = (k: ServicioClave) => redondear((alquiler * (cfg.porcentajes[k] || 0)) / 100);
  const luz = por('luz');
  const agua = por('agua');
  const internet = por('internet');
  const total = redondear(luz + agua + internet);
  return {
    alquiler,
    luz,
    agua,
    internet,
    total,
    // Lo que queda para el dueño en modo incluido / lo que paga el inquilino en modo adicional
    neto: cfg.modo === 'incluido' ? redondear(alquiler - total) : alquiler,
    pagaInquilino: cfg.modo === 'incluido' ? alquiler : redondear(alquiler + total),
  };
}

/** Marca con la que un gasto queda ligado a su factura (gasto fijo) */
export const marcaFactura = (gastoFijoId: string) => `factura:${gastoFijoId}`;

/** Pagos registrados de una factura en el mes (gastos ligados por la marca) */
export function pagosDeFactura(gf: GastoFijo, gastosDelMes: Gasto[]): Gasto[] {
  return gastosDelMes.filter((g) => (g.observaciones ?? '').includes(marcaFactura(gf.id)));
}

/** Próximo vencimiento de la factura y días que faltan (negativo = vencida) */
export function vencimientoFactura(gf: GastoFijo, mes: number, anio: number, hoy = new Date()) {
  const dia = Math.min(Number(gf.diaVencimiento) || 1, new Date(anio, mes, 0).getDate());
  const vence = new Date(anio, mes - 1, dia);
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((vence.getTime() - hoy0.getTime()) / 86_400_000);
  return { vence, dias };
}

/** Tipo de servicio de una factura (solo luz / agua / internet entran al prorrateo) */
export function servicioDeFactura(gf: GastoFijo): ServicioClave | null {
  return gf.tipo === 'luz' || gf.tipo === 'agua' || gf.tipo === 'internet' ? gf.tipo : null;
}
