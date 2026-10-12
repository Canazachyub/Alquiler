import { RECIBOS_AGUA, RECIBOS_LUZ, SUMINISTROS } from '@/data/recibosServicios';
import { leerConfigServicios } from './servicios';
import type { HabitacionConDetalles } from '@/types';

/**
 * Lo esencial de los recibos de luz y agua de Casa Progreso para el Dashboard:
 * cuánto hay que pagar, hasta cuándo, cuántos meses junta y si el aporte de los cuartos alcanza.
 */

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const promedio = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

const fecha = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const diasHasta = (d: Date, hoy = new Date()) => {
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((d.getTime() - hoy0.getTime()) / 86_400_000);
};

/** Meses que junta un recibo: el suyo y, si trae deuda, el anterior */
const mesesDelRecibo = (mes: number, conDeuda: boolean) =>
  conDeuda ? [MES[(mes + 10) % 12], MES[mes - 1]] : [MES[mes - 1]];

export interface EstadoServicio {
  clave: 'luz' | 'agua';
  nombre: string;
  empresa: string;
  /** Mes del último recibo cargado, p. ej. "set 2026" */
  recibo: string;
  porPagar: number;
  meses: string[];
  vence: Date;
  dias: number;
  /** Promedio mensual de los últimos recibos (sin deuda ni multas) */
  promedio: number;
  /** Fecha aproximada del siguiente recibo */
  proximoRecibo: Date;
  /** Emisión del recibo: inicio de la cuenta regresiva */
  emision: Date;
  codigo: string;
  etiquetaCodigo: string;
  consultaUrl: string;
}

export function estadoServicios(hoy = new Date()) {
  const a = RECIBOS_AGUA[RECIBOS_AGUA.length - 1];
  const l = RECIBOS_LUZ[RECIBOS_LUZ.length - 1];

  // Redondeado por recibo, igual que en Reportes
  const multasPorRecibo = RECIBOS_AGUA.map((r) => Math.round((r.multas.reduce((s, m) => s + m.monto, 0) * 1.18 + r.interes) * 100) / 100);
  const multasAgua = Math.round(multasPorRecibo.reduce((s, x) => s + x, 0) * 100) / 100;
  const aguaProm = promedio(RECIBOS_AGUA.slice(-12).map((r, i, arr) => r.importeMes - multasPorRecibo[RECIBOS_AGUA.length - arr.length + i]));
  const luzProm = promedio(RECIBOS_LUZ.filter((r) => r.importeMes !== undefined).map((r) => r.importeMes!));

  const servicios: EstadoServicio[] = [];
  if (l.vence && l.totalPagar !== undefined) {
    const vence = fecha(l.vence);
    servicios.push({
      clave: 'luz',
      nombre: 'Luz',
      empresa: 'Electro Puno',
      recibo: `${MES[l.mes - 1]} ${l.anio}`,
      porPagar: l.pagado ? 0 : l.totalPagar,
      meses: mesesDelRecibo(l.mes, (l.deudaAnterior ?? 0) > 0),
      vence,
      dias: diasHasta(vence, hoy),
      promedio: luzProm,
      // Electro Puno factura a inicios del mes siguiente y vence ~20 días después
      proximoRecibo: new Date(l.anio, l.mes + 1, 2),
      emision: l.emision ? fecha(l.emision) : new Date(vence.getTime() - 20 * 86_400_000),
      codigo: SUMINISTROS.luz.codigo,
      etiquetaCodigo: SUMINISTROS.luz.etiquetaCodigo,
      consultaUrl: SUMINISTROS.luz.consultaUrl,
    });
  }
  const venceAgua = fecha(a.vence);
  servicios.push({
    clave: 'agua',
    nombre: 'Agua',
    empresa: 'EMSA Puno',
    recibo: `${MES[a.mes - 1]} ${a.anio}`,
    porPagar: a.totalPagar,
    meses: mesesDelRecibo(a.mes, a.deudaAnterior > 0),
    vence: venceAgua,
    dias: diasHasta(venceAgua, hoy),
    promedio: aguaProm,
    // EMSA emite el último día del mes siguiente
    proximoRecibo: new Date(a.anio, a.mes + 1, 0),
    emision: a.emision ? fecha(a.emision) : new Date(venceAgua.getTime() - 16 * 86_400_000),
    codigo: SUMINISTROS.agua.codigo,
    etiquetaCodigo: SUMINISTROS.agua.etiquetaCodigo,
    consultaUrl: SUMINISTROS.agua.consultaUrl,
  });

  return {
    servicios,
    totalPorPagar: servicios.reduce((s, x) => s + x.porPagar, 0),
    multasAgua,
    cortesAgua: RECIBOS_AGUA.filter((r) => r.multas.length).length,
  };
}

/** Diferencia entre lo que aportan los cuartos ocupados de Casa Progreso y el recibo promedio */
export function brechaServicios(habitaciones: HabitacionConDetalles[]) {
  const ocupadas = habitaciones.filter(
    (h) => (h.edificioNombre ?? '').toLowerCase().includes('progreso') && h.estado === 'occupied'
  );
  const renta = ocupadas.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0);
  if (!renta) return [];
  const cfg = leerConfigServicios();
  return estadoServicios().servicios.map((s) => {
    const aporte = (renta * cfg.porcentajes[s.clave]) / 100;
    return {
      clave: s.clave,
      nombre: s.nombre,
      pct: cfg.porcentajes[s.clave],
      diferencia: aporte - s.promedio,
      sugerido: Math.ceil((s.promedio / renta) * 100 * 2) / 2,
    };
  });
}
