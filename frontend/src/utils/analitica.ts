import { calcularCobro } from './cobro';
import { inicialCobrador, COBRADORES } from './cobradores';
import { aporteCuarto, type ConfigServicios } from './servicios';
import type { Gasto, HabitacionConDetalles, Pago } from '@/types';

/**
 * Analítica de cobranza a partir de los pagos reales.
 *
 *   atraso(pago)      = fecha_pago − vencimiento(mes, año, día_de_pago)      [días]
 *   puntualidad       = pagos con atraso ≤ 0 ÷ total de pagos de alquiler
 *   mora_potencial    = Σ max(0, atraso) × S/ 1                             (regla 5 del reglamento)
 *   costo_vacancia    = cuartos vacantes × alquiler promedio                  [por mes]
 *   %_necesario(serv) = factura promedio ÷ Σ alquileres ocupados × 100
 */

const DIA = 86_400_000;
const fechaLocal = (iso?: string) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const vence = (mes: number, anio: number, dia: number) =>
  new Date(anio, mes - 1, Math.min(dia, new Date(anio, mes, 0).getDate()));

export interface Analitica {
  pagosAlquiler: number;
  totalCobrado: number;
  porCobrador: { clave: string; nombre: string; monto: number; cantidad: number }[];
  atrasoPromedio: number | null;
  atrasoMediana: number | null;
  puntualidad: number | null;
  moraPotencial: number;
  porInquilino: { codigo: string; nombre: string; atrasoPromedio: number; pagos: number; mesesDebe: number }[];
  diasDePago: number[]; // índice 1..31 = cantidad de pagos ese día del mes
  porMetodo: { metodo: string; cantidad: number; monto: number }[];
  ocupacion: number;
  vacantes: number;
  alquilerPromedio: number;
  costoVacancia: number;
  deudaVencida: number;
  serviciosAporteMes: number;
  serviciosGastoPromedio: number;
  porcentajeNecesario: number | null;
  recomendaciones: { tono: 'rojo' | 'ambar' | 'verde' | 'azul'; titulo: string; detalle: string; formula: string }[];
}

export function calcularAnalitica(params: {
  habitaciones: HabitacionConDetalles[];
  pagos: Pago[];
  gastos: Gasto[];
  desde: Date; // inicio del periodo
  hasta: Date; // fin del periodo
  configServicios: ConfigServicios;
}): Analitica {
  const { habitaciones, gastos, desde, hasta, configServicios } = params;
  const ids = new Set(habitaciones.map((h) => h.id));
  const habPorId = new Map(habitaciones.map((h) => [h.id, h]));
  const enPeriodo = (p: Pago) => {
    const k = Number(p.anio) * 12 + (Number(p.mes) - 1);
    return k >= desde.getFullYear() * 12 + desde.getMonth() && k <= hasta.getFullYear() * 12 + hasta.getMonth();
  };
  const pagos = params.pagos.filter((p) => ids.has(p.habitacionId) && p.estado !== 'anulado' && enPeriodo(p));
  const alquileres = pagos.filter((p) => p.concepto === 'alquiler');

  // Por cobrador
  const mapaCobrador = new Map<string, { monto: number; cantidad: number }>();
  pagos.forEach((p) => {
    const k = inicialCobrador(p.observaciones) || '?';
    const e = mapaCobrador.get(k) ?? { monto: 0, cantidad: 0 };
    e.monto += Number(p.monto || 0);
    e.cantidad++;
    mapaCobrador.set(k, e);
  });
  const porCobrador = [...mapaCobrador.entries()]
    .map(([clave, v]) => ({
      clave,
      nombre: COBRADORES.find((c) => c.inicial === clave)?.nombre ?? 'Sin anotar',
      ...v,
    }))
    .sort((a, b) => b.monto - a.monto);

  // Atrasos
  const atrasos: number[] = [];
  const porHab = new Map<string, number[]>();
  const diasDePago = Array(32).fill(0);
  alquileres.forEach((p) => {
    const h = habPorId.get(p.habitacionId);
    const f = fechaLocal(p.fecha);
    if (!f) return;
    diasDePago[f.getDate()]++;
    if (!h) return;
    const dia = Number(h.diaPago) || fechaLocal(h.fechaIngreso)?.getDate() || 1;
    const atraso = Math.round((f.getTime() - vence(Number(p.mes), Number(p.anio), dia).getTime()) / DIA);
    // Pagos registrados meses después (regularizaciones) distorsionan el promedio: se acotan a ±60 días
    const a = Math.max(-60, Math.min(60, atraso));
    atrasos.push(a);
    porHab.set(h.id, [...(porHab.get(h.id) ?? []), a]);
  });
  const prom = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const ordenados = [...atrasos].sort((a, b) => a - b);
  const mediana = ordenados.length ? ordenados[Math.floor(ordenados.length / 2)] : null;

  const ocupadas = habitaciones.filter((h) => h.estado === 'occupied');
  const porInquilino = ocupadas
    .map((h) => {
      const xs = porHab.get(h.id) ?? [];
      return {
        codigo: h.codigo,
        nombre: h.nombreInquilino || 'Sin inquilino',
        atrasoPromedio: prom(xs) ?? 0,
        pagos: xs.length,
        mesesDebe: h.nombreInquilino ? calcularCobro(h, params.pagos).atrasados.length : 0,
      };
    })
    .sort((a, b) => b.mesesDebe - a.mesesDebe || b.atrasoPromedio - a.atrasoPromedio);

  // Métodos
  const mapaMetodo = new Map<string, { cantidad: number; monto: number }>();
  pagos.forEach((p) => {
    const e = mapaMetodo.get(p.metodoPago) ?? { cantidad: 0, monto: 0 };
    e.cantidad++;
    e.monto += Number(p.monto || 0);
    mapaMetodo.set(p.metodoPago, e);
  });
  const porMetodo = [...mapaMetodo.entries()].map(([metodo, v]) => ({ metodo, ...v })).sort((a, b) => b.monto - a.monto);

  // Ocupación y vacancia
  const vacantes = habitaciones.filter((h) => h.estado === 'vacant').length;
  const alquilerPromedio = ocupadas.length ? ocupadas.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0) / ocupadas.length : 0;
  const ocupacion = habitaciones.length ? ((ocupadas.length + habitaciones.filter((h) => h.estado === 'exonerated').length) / habitaciones.length) * 100 : 0;
  const deudaVencida = ocupadas
    .filter((h) => h.nombreInquilino)
    .reduce((s, h) => s + calcularCobro(h, params.pagos).atrasados.length * Number(h.montoAlquiler || 0), 0);

  // Servicios
  const serviciosAporteMes = ocupadas.reduce((s, h) => s + aporteCuarto(h, configServicios).total, 0);
  const meses = Math.max(1, (hasta.getFullYear() - desde.getFullYear()) * 12 + hasta.getMonth() - desde.getMonth() + 1);
  const gastosServicios = gastos.filter((g) => {
    const f = fechaLocal(g.fecha);
    return g.categoria === 'servicios' && f && f >= desde && f <= new Date(hasta.getFullYear(), hasta.getMonth() + 1, 0);
  });
  const serviciosGastoPromedio = gastosServicios.reduce((s, g) => s + Number(g.monto || 0), 0) / meses;
  const sumaAlquileres = ocupadas.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0);
  const porcentajeNecesario = serviciosGastoPromedio > 0 && sumaAlquileres > 0 ? (serviciosGastoPromedio / sumaAlquileres) * 100 : null;

  const moraPotencial = atrasos.reduce((s, a) => s + Math.max(0, a), 0);
  const atrasoPromedio = prom(atrasos);
  const puntualidad = atrasos.length ? (atrasos.filter((a) => a <= 0).length / atrasos.length) * 100 : null;

  // Recomendaciones
  const recomendaciones: Analitica['recomendaciones'] = [];
  const morosos = porInquilino.filter((x) => x.mesesDebe >= 2);
  if (morosos.length) {
    recomendaciones.push({
      tono: 'rojo',
      titulo: `Priorizar cobranza: ${morosos.map((m) => m.codigo).join(', ')}`,
      detalle: `${morosos.length} inquilino(s) deben 2 meses o más. Revisa si los pagos ya se hicieron y faltan registrar; si no, coordina un plan de pago.`,
      formula: 'meses_debe = meses vencidos sin pago de alquiler desde el ingreso',
    });
  }
  if (atrasoPromedio !== null && atrasoPromedio > 3) {
    recomendaciones.push({
      tono: 'ambar',
      titulo: `Los pagos llegan ${atrasoPromedio.toFixed(1)} días tarde en promedio`,
      detalle: `Envía un recordatorio por WhatsApp 2 días antes del vencimiento. Aplicando la mora del reglamento (S/ 1 por día) se habrían generado ${moraPotencial.toFixed(0)} soles.`,
      formula: 'atraso = fecha de pago − fecha de vencimiento · mora = Σ días de atraso × S/ 1',
    });
  }
  if (vacantes > 0 && alquilerPromedio > 0) {
    recomendaciones.push({
      tono: 'azul',
      titulo: `${vacantes} cuarto(s) vacío(s) dejan de producir ~S/ ${(vacantes * alquilerPromedio).toFixed(0)} al mes`,
      detalle: 'Publica los vacantes o considera un descuento temporal: un cuarto ocupado a menor precio rinde más que uno vacío.',
      formula: 'costo de vacancia = vacantes × alquiler promedio',
    });
  }
  if (porcentajeNecesario !== null) {
    const actual = configServicios.porcentajes.luz + configServicios.porcentajes.agua + configServicios.porcentajes.internet;
    recomendaciones.push({
      tono: porcentajeNecesario > actual ? 'rojo' : 'verde',
      titulo:
        porcentajeNecesario > actual
          ? `Los servicios cuestan ${porcentajeNecesario.toFixed(1)}% del alquiler y se reserva ${actual}%`
          : `Los servicios (${porcentajeNecesario.toFixed(1)}%) están cubiertos con el ${actual}% reservado`,
      detalle:
        porcentajeNecesario > actual
          ? 'Sube los porcentajes en Gastos → Servicios o cobra los servicios como pago adicional.'
          : 'El aporte por servicios alcanza para pagar las facturas del periodo.',
      formula: '% necesario = gasto promedio en servicios ÷ Σ alquileres ocupados × 100',
    });
  }
  const sinAnotar = porCobrador.find((c) => c.clave === '?');
  if (sinAnotar && pagos.length && sinAnotar.cantidad / pagos.length > 0.2) {
    recomendaciones.push({
      tono: 'ambar',
      titulo: `${Math.round((sinAnotar.cantidad / pagos.length) * 100)}% de los pagos no dicen quién cobró`,
      detalle: 'Al registrar un pago, marca Yubert, Julio o Mamá para saber quién tiene el dinero y cuadrar cuentas.',
      formula: 'sin anotar = pagos sin cobrador ÷ total de pagos',
    });
  }
  if (puntualidad !== null && puntualidad >= 80) {
    recomendaciones.push({
      tono: 'verde',
      titulo: `${puntualidad.toFixed(0)}% de los pagos llegan a tiempo`,
      detalle: 'Buena puntualidad. Mantén el recordatorio y considera un pequeño descuento por pronto pago para sostenerla.',
      formula: 'puntualidad = pagos con atraso ≤ 0 ÷ pagos de alquiler',
    });
  }

  return {
    pagosAlquiler: alquileres.length,
    totalCobrado: pagos.reduce((s, p) => s + Number(p.monto || 0), 0),
    porCobrador,
    atrasoPromedio,
    atrasoMediana: mediana,
    puntualidad,
    moraPotencial,
    porInquilino,
    diasDePago,
    porMetodo,
    ocupacion,
    vacantes,
    alquilerPromedio,
    costoVacancia: vacantes * alquilerPromedio,
    deudaVencida,
    serviciosAporteMes,
    serviciosGastoPromedio,
    porcentajeNecesario,
    recomendaciones,
  };
}
