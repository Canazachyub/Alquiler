import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Droplets, Wifi, CalendarClock, CheckCircle2, AlertTriangle, Settings2, Receipt } from 'lucide-react';
import { useGastosFijos, useCreateGasto, useCreateGastoFijo, useEdificios } from '@/hooks';
import { useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import { formatCurrency, getMonthName, hoyISO } from '@/utils/formatters';
import { compararCodigos } from '@/utils/plano';
import { textoCuenta } from '@/utils/cobro';
import {
  SERVICIOS,
  aporteCuarto,
  guardarConfigServicios,
  leerConfigServicios,
  marcaFactura,
  pagosDeFactura,
  servicioDeFactura,
  vencimientoFactura,
  type ConfigServicios,
  type ServicioClave,
} from '@/utils/servicios';
import type { Gasto, GastoFijo, HabitacionConDetalles } from '@/types';

const ICONO: Record<ServicioClave, typeof Zap> = { luz: Zap, agua: Droplets, internet: Wifi };
const COLOR: Record<ServicioClave, { chip: string; barra: string; texto: string }> = {
  luz: { chip: 'bg-ochre-50 text-ochre-700', barra: 'bg-ochre-500', texto: 'text-ochre-700' },
  agua: { chip: 'bg-sky-50 text-sky-700', barra: 'bg-sky-500', texto: 'text-sky-700' },
  internet: { chip: 'bg-violet-50 text-violet-700', barra: 'bg-violet-500', texto: 'text-violet-700' },
};

interface ServiciosPanelProps {
  habitaciones: HabitacionConDetalles[];
  gastosDelMes: Gasto[];
  mes: number;
  anio: number;
  /** Edificios en alcance (filtro del header); vacío = todos */
  edificiosIds?: string[];
}

export function ServiciosPanel({ habitaciones, gastosDelMes, mes, anio, edificiosIds }: ServiciosPanelProps) {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { data: gastosFijosTodos } = useGastosFijos();
  const createGasto = useCreateGasto();
  const [cfg, setCfg] = useState<ConfigServicios>(leerConfigServicios);
  const [pagando, setPagando] = useState<string | null>(null);
  const [montoPago, setMontoPago] = useState('');
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const { data: edificios } = useEdificios();
  const createGastoFijo = useCreateGastoFijo();
  const edificiosOpciones = (edificios ?? []).filter((e) => !edificiosIds?.length || edificiosIds.includes(e.id));
  const [nueva, setNueva] = useState<{ edificioId: string; tipo: ServicioClave; monto: string; dia: string } | null>(null);

  const agregarFactura = async () => {
    if (!nueva || !nueva.edificioId || !(Number(nueva.monto) > 0)) return;
    const etiqueta = SERVICIOS.find((x) => x.clave === nueva.tipo)?.label ?? nueva.tipo;
    try {
      await createGastoFijo.mutateAsync({
        edificioId: nueva.edificioId,
        tipo: nueva.tipo,
        descripcion: `${etiqueta} — ${edificiosOpciones.find((e) => e.id === nueva.edificioId)?.nombre ?? ''}`.trim(),
        monto: Number(nueva.monto),
        diaVencimiento: Math.min(31, Math.max(1, Number(nueva.dia) || 1)),
        activo: true,
      });
      notify.success('Factura agregada');
      setNueva(null);
    } catch {
      notify.error('No se pudo agregar la factura');
    }
  };

  const cambiar = (c: ConfigServicios) => {
    setCfg(c);
    guardarConfigServicios(c);
  };

  const ocupadas = habitaciones
    .filter((h) => h.estado === 'occupied')
    .sort((a, b) => Number(a.pisoNumero ?? 0) - Number(b.pisoNumero ?? 0) || compararCodigos(a.codigo, b.codigo));
  const filas = ocupadas.map((h) => ({ h, a: aporteCuarto(h, cfg) }));
  const aporteTotal = (k: ServicioClave) => filas.reduce((s, f) => s + f.a[k], 0);

  const facturas = useMemo(
    () =>
      (gastosFijosTodos ?? []).filter(
        (gf) => gf.activo !== false && (!edificiosIds?.length || edificiosIds.includes(gf.edificioId))
      ),
    [gastosFijosTodos, edificiosIds]
  );
  const facturaDe = (k: ServicioClave) => facturas.filter((gf) => servicioDeFactura(gf) === k);
  const costoMes = (k: ServicioClave) =>
    facturaDe(k).reduce((s, gf) => {
      const pagado = pagosDeFactura(gf, gastosDelMes).reduce((x, g) => x + Number(g.monto || 0), 0);
      return s + (pagado || Number(gf.monto || 0));
    }, 0);

  const registrarPago = async (gf: GastoFijo) => {
    const monto = Number(montoPago);
    if (!(monto > 0)) return;
    try {
      await createGasto.mutateAsync({
        edificioId: gf.edificioId,
        fecha: fechaPago,
        concepto: `${gf.descripcion || gf.tipo} — ${getMonthName(mes)} ${anio}`,
        categoria: 'servicios',
        monto,
        observaciones: marcaFactura(gf.id),
      });
      notify.success('Pago de factura registrado');
      setPagando(null);
    } catch {
      notify.error('No se pudo registrar el pago de la factura');
    }
  };

  return (
    <div className="space-y-5">
      {/* Configuración de porcentajes */}
      <section className="card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900">Aporte por servicios</h2>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Modo de cobro de servicios">
            <button
              type="button"
              role="radio"
              aria-checked={cfg.modo === 'incluido'}
              data-active={cfg.modo === 'incluido'}
              onClick={() => cambiar({ ...cfg, modo: 'incluido' })}
              className="segmented-item"
            >
              Incluido en el alquiler
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={cfg.modo === 'adicional'}
              data-active={cfg.modo === 'adicional'}
              onClick={() => cambiar({ ...cfg, modo: 'adicional' })}
              className="segmented-item"
            >
              Pago adicional
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SERVICIOS.map(({ clave, label }) => {
            const Icon = ICONO[clave];
            return (
              <label key={clave} className={cn('rounded-xl p-3 flex items-center gap-3', COLOR[clave].chip)}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold flex-1">{label}</span>
                <span className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={cfg.porcentajes[clave]}
                    onChange={(e) =>
                      cambiar({ ...cfg, porcentajes: { ...cfg.porcentajes, [clave]: Math.max(0, Number(e.target.value)) } })
                    }
                    className="input !h-9 !w-20 pr-6 text-right font-bold tabular-nums bg-white"
                    aria-label={`Porcentaje de ${label}`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {cfg.modo === 'incluido'
            ? 'Cada inquilino paga su alquiler normal; de ese monto se separa este porcentaje para pagar los servicios.'
            : 'Cada inquilino paga su alquiler más este porcentaje adicional para los servicios.'}{' '}
          Fórmula: aporte = alquiler × % ÷ 100. Se guarda en este navegador.
        </p>
      </section>

      {/* Situación del mes por servicio */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SERVICIOS.map(({ clave, label }) => {
          const Icon = ICONO[clave];
          const aporte = aporteTotal(clave);
          const costo = costoMes(clave);
          const saldo = aporte - costo;
          const cubre = costo > 0 ? Math.min(100, (aporte / costo) * 100) : 100;
          return (
            <div key={clave} className="card p-4">
              <div className="flex items-center gap-2">
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center', COLOR[clave].chip)}>
                  <Icon className="w-4 h-4" />
                </span>
                <p className="font-bold text-slate-900">{label}</p>
                <span className="ml-auto text-xs text-slate-500">{getMonthName(mes)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div>
                  <p className="text-[11px] text-slate-500">Aportan inquilinos</p>
                  <p className="font-display font-bold tabular-nums text-slate-900">{formatCurrency(aporte)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Factura</p>
                  <p className="font-display font-bold tabular-nums text-slate-900">{costo ? formatCurrency(costo) : '—'}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={cn('h-full rounded-full', COLOR[clave].barra)} style={{ width: `${cubre}%` }} />
              </div>
              <p className={cn('text-xs font-semibold mt-1.5', !costo ? 'text-slate-400' : saldo >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                {!costo ? 'Sin factura configurada' : saldo >= 0 ? `Cubre la factura · sobra ${formatCurrency(saldo)}` : `Falta ${formatCurrency(-saldo)} para cubrirla`}
              </p>
            </div>
          );
        })}
      </section>

      {/* Facturas del mes */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900">Facturas de {getMonthName(mes).toLowerCase()}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/edificios')} className="link-arrow text-xs">
              Ver en Edificios
            </button>
            {!nueva && (
              <button
                type="button"
                onClick={() => setNueva({ edificioId: edificiosOpciones[0]?.id ?? '', tipo: 'luz', monto: '', dia: '15' })}
                className="btn btn-secondary btn-sm"
              >
                + Agregar factura
              </button>
            )}
          </div>
        </div>
        {nueva && (
          <form
            className="flex flex-wrap items-end gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100"
            onSubmit={(e) => {
              e.preventDefault();
              agregarFactura();
            }}
          >
            <label className="text-xs text-slate-600">
              Edificio
              <select value={nueva.edificioId} onChange={(e) => setNueva({ ...nueva, edificioId: e.target.value })} className="select !h-9 mt-1 w-44">
                {edificiosOpciones.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Servicio
              <select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value as ServicioClave })} className="select !h-9 mt-1 w-32">
                {SERVICIOS.map((x) => (
                  <option key={x.clave} value={x.clave}>{x.label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Monto aprox. (S/)
              <input type="number" min="0" step="0.1" value={nueva.monto} onChange={(e) => setNueva({ ...nueva, monto: e.target.value })} className="input !h-9 !w-28 mt-1 tabular-nums" autoFocus />
            </label>
            <label className="text-xs text-slate-600">
              Vence el día
              <input type="number" min="1" max="31" value={nueva.dia} onChange={(e) => setNueva({ ...nueva, dia: e.target.value })} className="input !h-9 !w-20 mt-1 tabular-nums" />
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createGastoFijo.isPending || !(Number(nueva.monto) > 0) || !nueva.edificioId}>
              {createGastoFijo.isPending ? 'Guardando…' : 'Agregar'}
            </button>
            <button type="button" onClick={() => setNueva(null)} className="btn btn-ghost btn-sm">Cancelar</button>
          </form>
        )}
        {facturas.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            Aún no hay facturas configuradas. Usa <strong>“+ Agregar factura”</strong> con su monto aproximado y el día en que
            vence; cada mes verás cuánto falta para pagarla.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...facturas]
              .sort((a, b) => Number(a.diaVencimiento) - Number(b.diaVencimiento))
              .map((gf) => {
                const k = servicioDeFactura(gf);
                const Icon = k ? ICONO[k] : Receipt;
                const pagos = pagosDeFactura(gf, gastosDelMes);
                const pagada = pagos.length > 0;
                const { vence, dias } = vencimientoFactura(gf, mes, anio);
                return (
                  <li key={gf.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', k ? COLOR[k].chip : 'bg-slate-100 text-slate-600')}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{gf.descripcion || gf.tipo}</p>
                        <p className="text-xs text-slate-500">
                          Vence el {vence.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })} · aprox. {formatCurrency(Number(gf.monto || 0))}
                        </p>
                      </div>
                      {pagada ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Pagada {formatCurrency(pagos.reduce((s, g) => s + Number(g.monto || 0), 0))}
                        </span>
                      ) : (
                        <>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-sm font-semibold',
                              dias < 0 ? 'text-red-600' : dias <= 5 ? 'text-amber-700' : 'text-slate-600'
                            )}
                          >
                            {dias < 0 ? <AlertTriangle className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                            {textoCuenta(dias)}
                          </span>
                          {pagando !== gf.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setPagando(gf.id);
                                setMontoPago(String(gf.monto ?? ''));
                                setFechaPago(hoyISO());
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Registrar pago
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {pagando === gf.id && (
                      <form
                        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          registrarPago(gf);
                        }}
                      >
                        <label className="text-xs text-slate-600">
                          Monto real de la factura
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={montoPago}
                            onChange={(e) => setMontoPago(e.target.value)}
                            className="input !h-9 !w-32 mt-1 tabular-nums"
                            autoFocus
                          />
                        </label>
                        <label className="text-xs text-slate-600">
                          Fecha de pago
                          <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} className="input !h-9 mt-1" />
                        </label>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={createGasto.isPending || !(Number(montoPago) > 0)}>
                          {createGasto.isPending ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button type="button" onClick={() => setPagando(null)} className="btn btn-ghost btn-sm">
                          Cancelar
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* Aporte de cada cuarto */}
      <section className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Aporte de cada cuarto</h2>
          <p className="text-xs text-slate-500">
            {cfg.modo === 'incluido' ? 'Parte del alquiler destinada a servicios' : 'Monto adicional que paga cada inquilino'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Cuarto</th>
                <th>Inquilino</th>
                <th className="text-right">Alquiler</th>
                <th className="text-right">Luz</th>
                <th className="text-right">Agua</th>
                <th className="text-right">Internet</th>
                <th className="text-right">Servicios</th>
                <th className="text-right">{cfg.modo === 'incluido' ? 'Neto alquiler' : 'Paga en total'}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ h, a }) => (
                <tr key={h.id}>
                  <td className="font-semibold text-slate-900">{h.codigo}</td>
                  <td className="truncate max-w-[180px]">{h.nombreInquilino || '—'}</td>
                  <td className="text-right tabular-nums">{formatCurrency(a.alquiler)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(a.luz)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(a.agua)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(a.internet)}</td>
                  <td className="text-right tabular-nums font-semibold">{formatCurrency(a.total)}</td>
                  <td className="text-right tabular-nums font-semibold">
                    {formatCurrency(cfg.modo === 'incluido' ? a.neto : a.pagaInquilino)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={2}>Total ({filas.length} cuartos)</td>
                <td className="text-right tabular-nums">{formatCurrency(filas.reduce((s, f) => s + f.a.alquiler, 0))}</td>
                <td className="text-right tabular-nums">{formatCurrency(aporteTotal('luz'))}</td>
                <td className="text-right tabular-nums">{formatCurrency(aporteTotal('agua'))}</td>
                <td className="text-right tabular-nums">{formatCurrency(aporteTotal('internet'))}</td>
                <td className="text-right tabular-nums">{formatCurrency(filas.reduce((s, f) => s + f.a.total, 0))}</td>
                <td className="text-right tabular-nums">
                  {formatCurrency(filas.reduce((s, f) => s + (cfg.modo === 'incluido' ? f.a.neto : f.a.pagaInquilino), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
