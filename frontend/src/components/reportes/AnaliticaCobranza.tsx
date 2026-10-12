import { useMemo } from 'react';
import { Users, Clock, CalendarDays, Wallet, Lightbulb, Sigma, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { usePagos, useGastos } from '@/hooks';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { calcularAnalitica } from '@/utils/analitica';
import { leerConfigServicios } from '@/utils/servicios';
import { METODOS_PAGO } from '@/utils/constants';
import type { HabitacionConDetalles } from '@/types';

interface Props {
  habitaciones: HabitacionConDetalles[];
  mesFin: number;
  anioFin: number;
  meses: number;
}

const TONO = {
  rojo: 'border-red-200 bg-red-50 text-red-800',
  ambar: 'border-amber-200 bg-amber-50 text-amber-800',
  verde: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  azul: 'border-sky-200 bg-sky-50 text-sky-800',
};
const COLOR_COBRADOR: Record<string, string> = { Y: 'bg-primary-600', J: 'bg-teal-500', M: 'bg-coral-500', '?': 'bg-slate-300' };

function Tarjeta({ icon: Icon, titulo, children, className }: { icon: typeof Users; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('card p-4 md:p-5', className)}>
      <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-3">
        <Icon className="w-4 h-4 text-slate-500" /> {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Analítica de cobranza: quién cobra, puntualidad, fechas de pago, servicios y recomendaciones. */
export function AnaliticaCobranza({ habitaciones, mesFin, anioFin, meses }: Props) {
  const { data: pagos } = usePagos();
  const { data: gastos } = useGastos();

  const a = useMemo(() => {
    if (!pagos) return null;
    return calcularAnalitica({
      habitaciones,
      pagos,
      gastos: gastos ?? [],
      desde: new Date(anioFin, mesFin - meses, 1),
      hasta: new Date(anioFin, mesFin - 1, 1),
      configServicios: leerConfigServicios(),
    });
  }, [habitaciones, pagos, gastos, mesFin, anioFin, meses]);

  if (!a) return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />;

  const maxCobrador = Math.max(1, ...a.porCobrador.map((c) => c.monto));
  const datosDias = a.diasDePago.slice(1).map((n, i) => ({ dia: i + 1, pagos: n }));
  const totalMetodo = a.porMetodo.reduce((s, m) => s + m.monto, 0) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="eyebrow">Análisis de cobranza · últimos {meses} meses</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Indicadores clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Puntualidad',
            valor: a.puntualidad === null ? '—' : `${a.puntualidad.toFixed(0)}%`,
            sub: 'pagos a tiempo',
            cls: a.puntualidad !== null && a.puntualidad >= 80 ? 'text-emerald-700' : 'text-amber-700',
          },
          {
            label: 'Atraso promedio',
            valor: a.atrasoPromedio === null ? '—' : `${a.atrasoPromedio.toFixed(1)} días`,
            sub: a.atrasoMediana === null ? '' : `mediana ${a.atrasoMediana} días`,
            cls: a.atrasoPromedio !== null && a.atrasoPromedio > 3 ? 'text-red-600' : 'text-slate-900',
          },
          { label: 'Deuda vencida', valor: formatCurrency(a.deudaVencida), sub: 'a la fecha', cls: a.deudaVencida ? 'text-red-600' : 'text-emerald-700' },
          { label: 'Costo de vacancia', valor: formatCurrency(a.costoVacancia), sub: `${a.vacantes} vacantes / mes`, cls: 'text-slate-900' },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
            <p className={cn('font-display text-2xl font-bold tabular-nums mt-1 leading-tight', k.cls)}>{k.valor}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quién cobra */}
        <Tarjeta icon={Users} titulo="Quién cobra más">
          <ul className="space-y-2.5">
            {a.porCobrador.map((c) => (
              <li key={c.clave}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-800">
                    {c.nombre} <span className="font-normal text-slate-500">· {c.cantidad} cobros</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(c.monto)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={cn('h-full rounded-full', COLOR_COBRADOR[c.clave] ?? 'bg-slate-400')} style={{ width: `${(c.monto / maxCobrador) * 100}%` }} />
                </div>
              </li>
            ))}
            {!a.porCobrador.length && <li className="text-sm text-slate-400">Sin pagos en el periodo.</li>}
          </ul>
        </Tarjeta>

        {/* Puntualidad por inquilino */}
        <Tarjeta icon={Clock} titulo="Puntualidad por inquilino">
          <div className="overflow-x-auto -mx-1">
            <table className="table !min-w-0 text-sm">
              <thead>
                <tr>
                  <th>Cuarto</th>
                  <th>Inquilino</th>
                  <th className="text-right">Atraso prom.</th>
                  <th className="text-right">Debe</th>
                </tr>
              </thead>
              <tbody>
                {a.porInquilino.map((x) => (
                  <tr key={x.codigo}>
                    <td className="!py-2 font-semibold">{x.codigo}</td>
                    <td className="!py-2 truncate max-w-[150px]">{x.nombre}</td>
                    <td className={cn('!py-2 text-right tabular-nums', x.atrasoPromedio > 3 ? 'text-red-600 font-semibold' : x.atrasoPromedio > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                      {x.pagos ? `${x.atrasoPromedio > 0 ? '+' : ''}${x.atrasoPromedio.toFixed(1)} d` : '—'}
                    </td>
                    <td className={cn('!py-2 text-right tabular-nums', x.mesesDebe ? 'text-red-600 font-semibold' : 'text-slate-400')}>
                      {x.mesesDebe ? `${x.mesesDebe} mes${x.mesesDebe > 1 ? 'es' : ''}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">+ días = pagó tarde · − días = pagó antes de su fecha.</p>
        </Tarjeta>

        {/* Días en que pagan */}
        <Tarjeta icon={CalendarDays} titulo="¿Qué días del mes pagan?">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosDias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DF" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#6F717B' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#A3A3AA' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip formatter={(v: number) => [`${v} pagos`, 'Pagos']} labelFormatter={(d) => `Día ${d}`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="pagos" radius={[3, 3, 0, 0]}>
                  {datosDias.map((d) => (
                    <Cell key={d.dia} fill={d.dia <= 10 ? '#4FA65B' : d.dia <= 20 ? '#4E9BC9' : '#E08B35'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500">Verde: días 1–10 · azul: 11–20 · naranja: 21–31.</p>
        </Tarjeta>

        {/* Métodos y servicios */}
        <Tarjeta icon={Wallet} titulo="Métodos de pago y servicios">
          <div className="flex h-3 rounded-full overflow-hidden mb-2">
            {a.porMetodo.map((m, i) => (
              <div key={m.metodo} className={['bg-emerald-500', 'bg-violet-500', 'bg-sky-500', 'bg-slate-700'][i % 4]} style={{ width: `${(m.monto / totalMetodo) * 100}%` }} />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
            {a.porMetodo.map((m, i) => (
              <li key={m.metodo} className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', ['bg-emerald-500', 'bg-violet-500', 'bg-sky-500', 'bg-slate-700'][i % 4])} />
                {METODOS_PAGO.find((x) => x.value === m.metodo)?.label ?? m.metodo}
                <span className="ml-auto tabular-nums text-slate-500">{Math.round((m.monto / totalMetodo) * 100)}%</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-slate-800"><Zap className="w-3.5 h-3.5" /> Servicios por mes</p>
            <p className="flex justify-between"><span className="text-slate-600">Aportan los inquilinos (según %)</span><span className="font-semibold tabular-nums">{formatCurrency(a.serviciosAporteMes)}</span></p>
            <p className="flex justify-between"><span className="text-slate-600">Gasto promedio en facturas</span><span className="font-semibold tabular-nums">{a.serviciosGastoPromedio ? formatCurrency(a.serviciosGastoPromedio) : '—'}</span></p>
            {a.porcentajeNecesario !== null && (
              <p className="flex justify-between"><span className="text-slate-600">% del alquiler que cuestan</span><span className="font-semibold tabular-nums">{a.porcentajeNecesario.toFixed(1)}%</span></p>
            )}
          </div>
        </Tarjeta>
      </div>

      {/* Recomendaciones */}
      <Tarjeta icon={Lightbulb} titulo="Recomendaciones">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {a.recomendaciones.map((r) => (
            <li key={r.titulo} className={cn('rounded-xl border p-3.5', TONO[r.tono])}>
              <p className="font-semibold">{r.titulo}</p>
              <p className="text-sm opacity-90 mt-1">{r.detalle}</p>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] font-mono opacity-80">
                <Sigma className="w-3 h-3 mt-0.5 flex-shrink-0" /> {r.formula}
              </p>
            </li>
          ))}
          {!a.recomendaciones.length && <li className="text-sm text-slate-500">Todo en orden en este periodo.</li>}
        </ul>
      </Tarjeta>
    </div>
  );
}
