import type { HabitacionConDetalles, Pago } from '@/types';
import { modalidadDeHabitacion, type ModalidadPago } from './modalidad';

/**
 * Ciclo de cobro de un inquilino.
 *
 * Regla: el alquiler del mes M vence el día de pago del inquilino en ese mes
 * (el día de su fecha de ingreso; si el mes es más corto, el último día).
 * Un mes está cubierto si tiene al menos un pago de alquiler no anulado.
 */

export interface MesCobro {
  mes: number;
  anio: number;
  vence: Date;
}

export interface EstadoCobro {
  desde: Date | null;
  diaPago: number;
  ultimoPago: Pago | null;
  /** Mes que cubre el último pago de alquiler */
  ultimoMesCubierto: { mes: number; anio: number } | null;
  /** Meses ya vencidos sin pago de alquiler (más antiguo primero) */
  atrasados: MesCobro[];
  /** Próximo vencimiento: el mes atrasado más antiguo, o el siguiente sin pagar */
  proximo: MesCobro | null;
  /** Días hasta el próximo vencimiento (negativo = vencido) */
  dias: number | null;
  /** Avance del ciclo actual 0–100 (del vencimiento anterior al próximo) */
  avance: number;
  nivel: 'ok' | 'pronto' | 'hoy' | 'vencido';
  /** adelantado = paga al inicio del periodo · vencido = paga al terminarlo */
  modalidad: ModalidadPago;
  /**
   * Meses que se pueden cobrar, en orden: los atrasados, el del ciclo actual y
   * `adelantos` meses más, saltando los que ya están pagados.
   */
  porCobrar: (MesCobro & { tipo: 'atrasado' | 'proximo' | 'adelanto' })[];
}

const DIA_MS = 86_400_000;

/** Fecha de calendario local desde "YYYY-MM-DD…" sin corrimiento de zona horaria */
function fechaLocal(iso?: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

function vencimiento(mes: number, anio: number, dia: number): Date {
  const ultimo = new Date(anio, mes, 0).getDate();
  return new Date(anio, mes - 1, Math.min(dia, ultimo));
}

const clave = (mes: number, anio: number) => anio * 12 + (mes - 1);
const desdeClave = (k: number) => ({ mes: (k % 12) + 1, anio: Math.floor(k / 12) });

export function calcularCobro(
  h: HabitacionConDetalles,
  pagos: Pago[],
  hoy = new Date(),
  adelantos = 2,
  /** Si se conoce (p. ej. consulta pública), evita buscarla en la lista de inquilinos */
  modalidadForzada?: ModalidadPago
): EstadoCobro {
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const desde = fechaLocal(h.fechaIngreso);
  const diaPago = Number(h.diaPago) || desde?.getDate() || 1;
  const modalidad = modalidadForzada ?? modalidadDeHabitacion(h.id);
  // El alquiler del mes M vence el día de pago de M en ambas modalidades. Lo que cambia
  // es qué cubre: adelantado = el periodo que empieza ese día; mes vencido = el periodo
  // que termina ese día (el mes ya usado). Por eso, con mes vencido, el primer cobro
  // llega un mes después del ingreso.
  const venceDe = (mes: number, anio: number) => vencimiento(mes, anio, diaPago);

  const delCuarto = pagos.filter(
    (p) => p.habitacionId === h.id && p.estado !== 'anulado' && p.concepto === 'alquiler'
  );
  // Solo cuenta lo pagado por el inquilino actual (desde su ingreso)
  const inicioK = desde ? clave(desde.getMonth() + 1, desde.getFullYear()) : null;
  const cubiertos = new Set(
    delCuarto
      .map((p) => clave(Number(p.mes), Number(p.anio)))
      .filter((k) => inicioK === null || k >= inicioK)
  );

  const ultimoPago =
    [...delCuarto].sort(
      (a, b) =>
        clave(Number(b.mes), Number(b.anio)) - clave(Number(a.mes), Number(a.anio)) ||
        String(b.fecha).localeCompare(String(a.fecha))
    )[0] ?? null;
  const ultimoK = cubiertos.size ? Math.max(...cubiertos) : null;

  // Meses vencidos sin pago, desde el ingreso hasta hoy
  const atrasados: MesCobro[] = [];
  const hoyK = clave(hoy0.getMonth() + 1, hoy0.getFullYear());
  const inicio = inicioK !== null ? inicioK + (modalidad === 'vencido' ? 1 : 0) : ultimoK ?? hoyK;
  for (let k = inicio; k <= hoyK; k++) {
    const { mes, anio } = desdeClave(k);
    const vence = venceDe(mes, anio);
    if (!cubiertos.has(k) && vence <= hoy0) atrasados.push({ mes, anio, vence });
  }

  // Próximo: el atrasado más antiguo, o el primer mes sin pagar después de lo cubierto
  let proximo: MesCobro | null = atrasados[0] ?? null;
  if (!proximo) {
    let k = Math.max(inicio, ultimoK !== null ? ultimoK + 1 : inicio);
    while (cubiertos.has(k)) k++;
    const { mes, anio } = desdeClave(k);
    proximo = { mes, anio, vence: venceDe(mes, anio) };
  }

  const dias = proximo ? Math.round((proximo.vence.getTime() - hoy0.getTime()) / DIA_MS) : null;
  let avance = 0;
  if (proximo && dias !== null) {
    const prevK = clave(proximo.mes, proximo.anio) - 1;
    const prev = desdeClave(prevK);
    const inicioCiclo = venceDe(prev.mes, prev.anio);
    const total = proximo.vence.getTime() - inicioCiclo.getTime();
    avance = dias < 0 ? 100 : Math.max(0, Math.min(100, ((hoy0.getTime() - inicioCiclo.getTime()) / total) * 100));
  }

  const nivel: EstadoCobro['nivel'] =
    dias === null ? 'ok' : dias < 0 ? 'vencido' : dias === 0 ? 'hoy' : dias <= 5 ? 'pronto' : 'ok';

  const porCobrar: EstadoCobro['porCobrar'] = atrasados.map((m) => ({ ...m, tipo: 'atrasado' as const }));
  {
    let k = proximo ? clave(proximo.mes, proximo.anio) : hoyK;
    let futuros = 0;
    let vistoProximo = false;
    while (futuros < adelantos + 1 && k < hoyK + 36) {
      const { mes, anio } = desdeClave(k);
      const vence = venceDe(mes, anio);
      if (!cubiertos.has(k) && vence > hoy0) {
        porCobrar.push({ mes, anio, vence, tipo: vistoProximo ? 'adelanto' : 'proximo' });
        vistoProximo = true;
        futuros++;
      }
      k++;
    }
  }

  return {
    modalidad,
    porCobrar,
    desde,
    diaPago,
    ultimoPago,
    ultimoMesCubierto: ultimoK !== null ? desdeClave(ultimoK) : null,
    atrasados,
    proximo,
    dias,
    avance,
    nivel,
  };
}

/** Texto corto de la cuenta regresiva: "en 13 días", "hoy", "vencido hace 4 días" */
export function textoCuenta(dias: number | null): string {
  if (dias === null) return '';
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'vence mañana';
  if (dias > 0) return `en ${dias} días`;
  return dias === -1 ? 'vencido ayer' : `vencido hace ${-dias} días`;
}

/**
 * Estado visible de un cuarto. Para los ocupados sale del ciclo de pago real,
 * no del mes calendario: quien aún no llega a su fecha no figura como deudor.
 */
export type EstadoPlano = 'vencido' | 'por-vencer' | 'al-dia' | 'vacante' | 'mantenimiento' | 'exonerado';

/** Días de anticipación con los que un pago pasa a "por vencer" */
export const DIAS_AVISO = 5;

export function estadoDesdeCobro(h: HabitacionConDetalles, c?: EstadoCobro): EstadoPlano {
  if (h.estado === 'maintenance') return 'mantenimiento';
  if (h.estado === 'exonerated') return 'exonerado';
  if (h.estado !== 'occupied') return 'vacante';
  if (!c) return h.alquilerPagado ? 'al-dia' : 'por-vencer';
  if (c.atrasados.length > 0) return 'vencido';
  return c.dias !== null && c.dias <= DIAS_AVISO ? 'por-vencer' : 'al-dia';
}

/** Lo que debe por meses cuya fecha de pago ya pasó */
export function deudaVencida(h: HabitacionConDetalles, c?: EstadoCobro): number {
  if (h.estado !== 'occupied' || !c) return 0;
  return c.atrasados.length * Number(h.montoAlquiler || 0);
}
