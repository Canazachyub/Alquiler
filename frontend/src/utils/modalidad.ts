import type { Inquilino } from '@/types';

/**
 * Modalidad de pago del alquiler:
 *  - adelantado: paga al inicio del periodo (entra el 12/10, paga ese día, cubre hasta el 11/11).
 *  - vencido:    usa el periodo y paga al terminarlo (periodo 12/10–11/11 se paga el 12/11).
 *
 * Se guarda en la columna ModalidadPago de INQUILINOS. Mientras el backend no la tenga,
 * queda también en este navegador para no perderla.
 */
export type ModalidadPago = 'adelantado' | 'vencido';

const LS_KEY = 'alquiler-modalidad-pago';
const porHabitacion = new Map<string, ModalidadPago>();

function leerLocal(): Record<string, ModalidadPago> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function guardarModalidadLocal(inquilinoId: string, m?: ModalidadPago) {
  if (!inquilinoId || !m) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...leerLocal(), [inquilinoId]: m }));
  } catch {
    /* sin almacenamiento */
  }
}

export function modalidadDeInquilino(inq: Pick<Inquilino, 'id'> & { modalidadPago?: string }): ModalidadPago {
  const v = inq.modalidadPago || leerLocal()[inq.id];
  return v === 'vencido' ? 'vencido' : 'adelantado';
}

/** Registra la modalidad de los inquilinos activos, indexada por habitación */
export function actualizarModalidades(inquilinos?: Inquilino[]) {
  if (!inquilinos) return;
  porHabitacion.clear();
  inquilinos
    .filter((i) => i.estado === 'activo')
    .forEach((i) => porHabitacion.set(i.habitacionId, modalidadDeInquilino(i)));
}

export function modalidadDeHabitacion(habitacionId: string): ModalidadPago {
  return porHabitacion.get(habitacionId) ?? 'adelantado';
}

/** Inicio y fin del periodo de un mes de alquiler (independiente de la modalidad) */
export function periodoDeMes(mes: number, anio: number, dia: number) {
  const fecha = (m: number, a: number) => new Date(a, m - 1, Math.min(dia, new Date(a, m, 0).getDate()));
  const desde = fecha(mes, anio);
  const sig = mes === 12 ? { m: 1, a: anio + 1 } : { m: mes + 1, a: anio };
  const hasta = new Date(fecha(sig.m, sig.a).getTime() - 86_400_000);
  return { desde, hasta };
}

/**
 * Periodo que cubre el pago del mes M:
 *  - adelantado: del día de pago de M al día anterior en M+1.
 *  - vencido:    el mes ya usado, del día de pago de M−1 al día anterior en M.
 */
export function periodoCubierto(mes: number, anio: number, dia: number, modalidad: ModalidadPago) {
  if (modalidad === 'vencido') {
    const prev = mes === 1 ? { m: 12, a: anio - 1 } : { m: mes - 1, a: anio };
    return periodoDeMes(prev.m, prev.a, dia);
  }
  return periodoDeMes(mes, anio, dia);
}

const ddmmaaaa = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

/**
 * Qué fechas cubre un pago de alquiler: el periodo del mes pagado, que empieza
 * el día de ingreso del inquilino. Con mes vencido el pago se hace al terminar ese periodo.
 * Devuelve null si no se conoce el día de pago.
 */
export function coberturaDePago(
  pago: { mes: number | string; anio: number | string; concepto?: string },
  inquilino?: (Pick<Inquilino, 'id' | 'fechaIngreso'> & { modalidadPago?: string }) | null,
  habitacion?: { diaPago?: number } | null
): { desde: string; hasta: string; modalidad: ModalidadPago; texto: string } | null {
  const dia =
    Number(String(inquilino?.fechaIngreso ?? '').slice(8, 10)) || Number(habitacion?.diaPago) || 0;
  if (!dia) return null;
  const modalidad = inquilino ? modalidadDeInquilino(inquilino) : 'adelantado';
  const { desde, hasta } = periodoCubierto(Number(pago.mes), Number(pago.anio), dia, modalidad);
  const d = ddmmaaaa(desde);
  const h = ddmmaaaa(hasta);
  return {
    desde: d,
    hasta: h,
    modalidad,
    texto: `Cubre del ${d} al ${h} · ${modalidad === 'vencido' ? 'mes vencido' : 'pago adelantado'}`,
  };
}
