import { useMemo } from 'react';
import { Droplets, Zap, AlertTriangle, Lightbulb, Sigma, Scale } from 'lucide-react';
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { leerConfigServicios } from '@/utils/servicios';
import { RECIBOS_AGUA, RECIBOS_LUZ, SUMINISTROS } from '@/data/recibosServicios';
import type { HabitacionConDetalles } from '@/types';

interface Props {
  /** Todas las habitaciones; se usan las ocupadas de Casa Progreso para el prorrateo */
  habitaciones: HabitacionConDetalles[];
}

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const etiqueta = (mes: number, anio: number) => `${MES[mes - 1]} ${String(anio).slice(2)}`;
const r2 = (n: number) => Math.round(n * 100) / 100;
const promedio = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const IGV = 1.18;

const TONO = {
  rojo: 'border-red-200 bg-red-50 text-red-800',
  ambar: 'border-amber-200 bg-amber-50 text-amber-800',
  verde: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  azul: 'border-sky-200 bg-sky-50 text-sky-800',
};

function Tarjeta({ icon: Icon, titulo, children, className }: { icon: typeof Zap; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('card p-4 md:p-5', className)}>
      <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-3">
        <Icon className="w-4 h-4 text-slate-500" /> {titulo}
      </h3>
      {children}
    </section>
  );
}

const diasHasta = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - hoy0.getTime()) / 86_400_000);
};
const fechaCorta = (iso: string) => iso.split('-').reverse().join('/');

/** Análisis de los recibos de luz y agua de Casa Progreso: consumo, costo, multas y prorrateo. */
export function AnalisisServicios({ habitaciones }: Props) {
  const a = useMemo(() => {
    // ---------- Agua ----------
    const agua = RECIBOS_AGUA.map((r) => {
      const multas = r2(r.multas.reduce((s, m) => s + m.monto, 0) * IGV + r.interes);
      return {
        ...r,
        label: etiqueta(r.mes, r.anio),
        multasConIgv: multas,
        normal: r2(r.importeMes - multas),
        costoM3: r2((r.agua + r.desague) / r.m3),
      };
    });
    const ultimos12Agua = agua.slice(-12);
    const aguaPromNormal = promedio(ultimos12Agua.map((r) => r.normal));
    const aguaPromM3 = promedio(ultimos12Agua.map((r) => r.m3));
    const multasTotal = r2(agua.reduce((s, r) => s + r.multasConIgv, 0));
    const cortes = agua.filter((r) => r.multas.length).map((r) => r.label);
    const conDeuda = agua.filter((r) => r.deudaAnterior > 0).length;
    const costoM3Inicial = agua[0].costoM3;
    const costoM3Actual = agua[agua.length - 1].costoM3;
    const picoAgua = agua.reduce((p, r) => (r.m3 > p.m3 ? r : p), agua[0]);
    const ultimoAgua = agua[agua.length - 1];

    // ---------- Luz ----------
    const luz = RECIBOS_LUZ.map((r) => ({ ...r, label: etiqueta(r.mes, r.anio) }));
    const conMonto = luz.filter((r) => r.importeMes !== undefined);
    const luzPromMonto = promedio(conMonto.map((r) => r.importeMes!));
    const luzPromKwh = promedio(luz.map((r) => r.kwh));
    const ultimoLuz = luz[luz.length - 1];
    const solesPorKwh = ultimoLuz.importeMes ? r2(ultimoLuz.importeMes / ultimoLuz.kwh) : 0;
    const invierno = promedio(luz.filter((r) => r.mes >= 6 && r.mes <= 8).map((r) => r.kwh));
    const verano = promedio(luz.filter((r) => r.mes >= 1 && r.mes <= 3).map((r) => r.kwh));
    // Costo estimado de un año completo con el consumo del gráfico y el precio actual por kWh
    const luzAnualEstimada = r2(luz.reduce((s, r) => s + (r.importeMes ?? r.kwh * solesPorKwh), 0));

    // ---------- Prorrateo: lo que aportan los cuartos vs lo que llega en el recibo ----------
    const ocupadas = habitaciones.filter(
      (h) => (h.edificioNombre ?? '').toLowerCase().includes('progreso') && h.estado === 'occupied'
    );
    const rentaTotal = ocupadas.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0);
    const cfg = leerConfigServicios();
    const prorrateo = [
      { clave: 'luz' as const, nombre: 'Luz', factura: luzPromMonto },
      { clave: 'agua' as const, nombre: 'Agua', factura: aguaPromNormal },
    ].map((s) => {
      const pct = cfg.porcentajes[s.clave];
      const aporte = (rentaTotal * pct) / 100;
      const sugerido = rentaTotal ? Math.ceil(((s.factura / rentaTotal) * 100) * 2) / 2 : 0;
      return { ...s, pct, aporte, diferencia: aporte - s.factura, sugerido, porCuarto: ocupadas.length ? s.factura / ocupadas.length : 0 };
    });

    return {
      agua, aguaPromNormal, aguaPromM3, multasTotal, cortes, conDeuda, costoM3Inicial, costoM3Actual, picoAgua, ultimoAgua,
      luz, luzPromMonto, luzPromKwh, ultimoLuz, solesPorKwh, invierno, verano, luzAnualEstimada,
      ocupadas: ocupadas.length, rentaTotal, prorrateo, modo: cfg.modo,
    };
  }, [habitaciones]);

  const subaTarifa = ((a.costoM3Actual - a.costoM3Inicial) / a.costoM3Inicial) * 100;
  const luzPendiente = a.ultimoLuz.pagado === false ? a.ultimoLuz.totalPagar ?? 0 : 0;
  const diasLuz = a.ultimoLuz.vence ? diasHasta(a.ultimoLuz.vence) : null;
  const diasAgua = diasHasta(a.ultimoAgua.vence);

  // Avisos y recomendaciones, de lo más urgente a lo informativo
  const recomendaciones: { tono: keyof typeof TONO; titulo: string; texto: string; formula?: string }[] = [];
  if (luzPendiente > 0 && a.ultimoLuz.vence) {
    recomendaciones.push({
      tono: 'rojo',
      titulo: `Luz: ${formatCurrency(luzPendiente)} por pagar (2 meses)`,
      texto: `El recibo de ${a.ultimoLuz.label} trae la deuda del mes anterior. Electro Puno corta el servicio si no se paga hasta el ${fechaCorta(a.ultimoLuz.vence)}${diasLuz !== null ? (diasLuz >= 0 ? ` (en ${diasLuz} días)` : ' (ya venció)') : ''}.`,
      formula: `${formatCurrency(a.ultimoLuz.importeMes ?? 0)} del mes + ${formatCurrency(a.ultimoLuz.deudaAnterior ?? 0)} de deuda`,
    });
  }
  if (a.ultimoAgua.deudaAnterior > 0) {
    recomendaciones.push({
      tono: diasAgua < 0 ? 'rojo' : 'ambar',
      titulo: `Agua: ${formatCurrency(a.ultimoAgua.totalPagar)} vence el ${fechaCorta(a.ultimoAgua.vence)}`,
      texto: `Incluye la deuda del mes anterior. ${diasAgua < 0 ? 'Ya venció: si se acumula otro mes, EMSA corta y cobra reapertura.' : `Faltan ${diasAgua} días.`}`,
    });
  }
  if (a.multasTotal > 0) {
    recomendaciones.push({
      tono: 'ambar',
      titulo: `Se perdieron ${formatCurrency(a.multasTotal)} en cortes e intereses de agua`,
      texto: `Hubo corte y reapertura en ${a.cortes.join(', ')}. En ${a.conDeuda} de ${a.agua.length} recibos se pagaba con un mes de atraso. Pagar cada recibo antes de su vencimiento evita el corte (S/ 54.01 + IGV cada vez).`,
      formula: 'pérdida = Σ (reapertura + cierre) × 1.18 + Σ interés moratorio',
    });
  }
  a.prorrateo.forEach((s) => {
    if (a.rentaTotal && s.diferencia < 0) {
      recomendaciones.push({
        tono: 'ambar',
        titulo: `El ${s.pct}% para ${s.nombre.toLowerCase()} no alcanza`,
        texto: `Los ${a.ocupadas} cuartos ocupados aportan ${formatCurrency(s.aporte)} al mes y el recibo promedia ${formatCurrency(s.factura)}. Para cubrirlo haría falta ${s.sugerido}% del alquiler (se cambia en Gastos → Servicios). Si el recibo no es de todo el edificio, ignora este aviso.`,
        formula: `% sugerido = recibo promedio ÷ alquileres ocupados × 100 = ${formatCurrency(s.factura)} ÷ ${formatCurrency(a.rentaTotal)} × 100`,
      });
    }
  });
  if (subaTarifa > 5) {
    recomendaciones.push({
      tono: 'azul',
      titulo: `El m³ de agua subió ${subaTarifa.toFixed(0)}%`,
      texto: `Agua + desagüe costaba ${formatCurrency(a.costoM3Inicial)} por m³ en ${a.agua[0].label} y ahora ${formatCurrency(a.costoM3Actual)} (cambio de tarifa SUNASS). Conviene revisar el % de agua una vez al año.`,
      formula: 'costo por m³ = (servicio de agua + desagüe) ÷ m³ facturados',
    });
  }
  if (a.invierno > a.verano * 1.2) {
    recomendaciones.push({
      tono: 'azul',
      titulo: 'La luz sube en invierno',
      texto: `De junio a agosto se consumen ~${a.invierno.toFixed(0)} kWh al mes, frente a ~${a.verano.toFixed(0)} kWh de enero a marzo (+${(((a.invierno - a.verano) / a.verano) * 100).toFixed(0)}%). Reserva un poco más para esos meses.`,
    });
  }
  if (a.picoAgua.m3 > a.aguaPromM3 * 1.6) {
    recomendaciones.push({
      tono: 'azul',
      titulo: `Pico de agua en ${a.picoAgua.label}: ${a.picoAgua.m3} m³`,
      texto: `Fue ${(a.picoAgua.m3 / a.aguaPromM3).toFixed(1)} veces el promedio (${a.aguaPromM3.toFixed(0)} m³). Si vuelve a pasar, revisar fugas en baños y tanque.`,
    });
  }

  const datosAgua = a.agua.map((r) => ({ label: r.label, m3: r.m3, normal: r.normal, multas: r.multasConIgv, costoM3: r.costoM3 }));
  const datosLuz = a.luz.map((r) => ({ label: r.label, kwh: r.kwh, monto: r.importeMes ?? null }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="eyebrow">Servicios · Casa Progreso (recibos de luz y agua)</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Luz al mes', valor: formatCurrency(a.luzPromMonto), sub: `promedio · ${a.luzPromKwh.toFixed(0)} kWh`, cls: 'text-ochre-700' },
          { label: 'Agua al mes', valor: formatCurrency(a.aguaPromNormal), sub: `promedio sin multas · ${a.aguaPromM3.toFixed(0)} m³`, cls: 'text-sky-700' },
          { label: 'Perdido en multas', valor: formatCurrency(a.multasTotal), sub: `${a.cortes.length} cortes de agua`, cls: a.multasTotal ? 'text-red-700' : 'text-emerald-700' },
          {
            label: 'Por pagar ahora',
            valor: formatCurrency(luzPendiente + (a.ultimoAgua.deudaAnterior > 0 ? a.ultimoAgua.totalPagar : 0)),
            sub: 'luz + agua del último recibo',
            cls: 'text-red-700',
          },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className={cn('font-display text-2xl font-bold tabular-nums mt-1', k.cls)}>{k.valor}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Tarjeta icon={Zap} titulo="Luz: consumo y monto por mes">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datosLuz} margin={{ top: 5, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={42} />
                <YAxis yAxisId="kwh" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="soles" orientation="right" tick={{ fontSize: 11 }} width={36} domain={[0, 250]} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, n: string) => (n === 'kWh' ? [`${v} kWh`, 'Consumo'] : [formatCurrency(v), 'Monto del mes'])}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="kwh" dataKey="kwh" name="kWh" fill="#E08B35" radius={[4, 4, 0, 0]} />
                <Line yAxisId="soles" dataKey="monto" name="S/ del mes" stroke="#1B1E2A" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {SUMINISTROS.luz.empresa} · código {SUMINISTROS.luz.codigo} · {SUMINISTROS.luz.tarifa}. Precio actual ≈ {formatCurrency(a.solesPorKwh)} por kWh (todo incluido).
            Los kWh antes de setiembre 2026 se leyeron del gráfico del recibo (aprox.). Estimado anual: {formatCurrency(a.luzAnualEstimada)}.
          </p>
        </Tarjeta>

        <Tarjeta icon={Droplets} titulo="Agua: consumo e importe por mes">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosAgua} margin={{ top: 5, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} angle={-35} textAnchor="end" height={42} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, n: string) => [formatCurrency(v), n]}
                  labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.m3 ?? ''} m³`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="normal" name="Consumo" stackId="a" fill="#4E9BC9" />
                <Bar dataKey="multas" name="Cortes e intereses" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {SUMINISTROS.agua.empresa} · usuario {SUMINISTROS.agua.codigo} · {SUMINISTROS.agua.tarifa}. Rojo = dinero perdido por pagar tarde.
          </p>
        </Tarjeta>

        <Tarjeta icon={Scale} titulo="¿Alcanza lo que aportan los cuartos?">
          {a.rentaTotal ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-1.5">Servicio</th>
                      <th className="py-1.5 text-right">Recibo prom.</th>
                      <th className="py-1.5 text-right">Aporte ({a.modo})</th>
                      <th className="py-1.5 text-right">Diferencia</th>
                      <th className="py-1.5 text-right">% sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {a.prorrateo.map((s) => (
                      <tr key={s.clave}>
                        <td className="py-2 font-semibold text-slate-900">{s.nombre}</td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(s.factura)}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatCurrency(s.aporte)} <span className="text-xs text-slate-400">({s.pct}%)</span>
                        </td>
                        <td className={cn('py-2 text-right tabular-nums font-semibold', s.diferencia < 0 ? 'text-red-700' : 'text-emerald-700')}>
                          {s.diferencia >= 0 ? '+' : ''}
                          {formatCurrency(s.diferencia)}
                        </td>
                        <td className="py-2 text-right tabular-nums font-semibold">{s.sugerido}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {a.ocupadas} cuartos ocupados · alquileres {formatCurrency(a.rentaTotal)} al mes. Si se reparte en partes iguales: luz{' '}
                {formatCurrency(a.prorrateo[0].porCuarto)} y agua {formatCurrency(a.prorrateo[1].porCuarto)} por cuarto.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No hay cuartos ocupados de Casa Progreso en el filtro actual.</p>
          )}
        </Tarjeta>

        <Tarjeta icon={Sigma} titulo="Costo del agua por m³">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datosAgua} margin={{ top: 5, right: 0, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} domain={[2, 'auto']} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [`${formatCurrency(v)} por m³`, 'Agua + desagüe']} />
                <Line dataKey="costoM3" stroke="#336C8F" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">Sin cargo fijo ni IGV. El escalón muestra los cambios de tarifa.</p>
        </Tarjeta>
      </div>

      {recomendaciones.length > 0 && (
        <Tarjeta icon={Lightbulb} titulo="Lo que conviene tener en cuenta">
          <ul className="grid md:grid-cols-2 gap-3">
            {recomendaciones.map((r) => (
              <li key={r.titulo} className={cn('rounded-xl border p-3', TONO[r.tono])}>
                <p className="font-semibold flex items-center gap-1.5">
                  {r.tono === 'rojo' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  {r.titulo}
                </p>
                <p className="text-sm mt-1 opacity-90">{r.texto}</p>
                {r.formula && <p className="text-xs mt-2 font-mono opacity-75">{r.formula}</p>}
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
