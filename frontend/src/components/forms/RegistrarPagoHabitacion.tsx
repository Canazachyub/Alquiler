import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Smartphone,
  Landmark,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Home,
  Wifi,
  Wrench,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { usePagos, useInquilinos, useCreatePago } from '@/hooks';
import { useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import { formatCurrency, getMonthName, hoyISO } from '@/utils/formatters';
import { calcularCobro, textoCuenta } from '@/utils/cobro';
import { tieneInternet } from '@/utils/habitacion';
import { COBRADORES, textoCobrador } from '@/utils/cobradores';
import type { ConceptoPago, HabitacionConDetalles, MetodoPago, Pago } from '@/types';

interface RegistrarPagoHabitacionProps {
  habitacion: HabitacionConDetalles;
  onListo: () => void;
  /** Si se pasa, "Ver voucher" lo muestra aquí en vez de ir a Pagos */
  onVerVoucher?: (pago: Pago) => void;
}

const CONCEPTOS: { value: ConceptoPago; label: string; icon: LucideIcon }[] = [
  { value: 'alquiler', label: 'Alquiler', icon: Home },
  { value: 'internet', label: 'Internet', icon: Wifi },
  { value: 'servicios', label: 'Servicios', icon: Wrench },
  { value: 'otro', label: 'Otro', icon: MoreHorizontal },
];

const METODOS: { value: MetodoPago; label: string; icon: LucideIcon; activo: string }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote, activo: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'yape', label: 'Yape', icon: Smartphone, activo: 'bg-violet-600 text-white border-violet-600' },
  { value: 'plin', label: 'Plin', icon: Smartphone, activo: 'bg-sky-600 text-white border-sky-600' },
  { value: 'transferencia', label: 'Transferencia', icon: Landmark, activo: 'bg-slate-900 text-white border-slate-900' },
];

const clave = (mes: number, anio: number) => `${anio}-${mes}`;

/** Panel para cobrar desde la ventana de la habitación: meses, concepto, método y total. */
export function RegistrarPagoHabitacion({ habitacion: h, onListo, onVerVoucher }: RegistrarPagoHabitacionProps) {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { data: pagos, isLoading } = usePagos();
  const { data: inquilinos } = useInquilinos();
  const createPago = useCreatePago();

  const inq = inquilinos?.find((i) => i.habitacionId === h.id && i.estado === 'activo');
  const cobro = useMemo(() => (pagos ? calcularCobro(h, pagos) : null), [h, pagos]);

  // Meses ofrecidos: atrasados + ciclo actual + dos adelantos, sin los ya pagados
  const meses = cobro?.porCobrar ?? [];

  const [seleccion, setSeleccion] = useState<Set<string> | null>(null);
  const elegidos = seleccion ?? new Set(meses.length ? [clave(meses[0].mes, meses[0].anio)] : []);
  const [concepto, setConcepto] = useState<ConceptoPago>('alquiler');
  const [monto, setMonto] = useState<string>(String(h.montoAlquiler ?? 0));
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [fecha, setFecha] = useState(hoyISO());
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cobrador, setCobrador] = useState<string>('');
  const [registrados, setRegistrados] = useState<Pago[] | null>(null);

  const alternarMes = (k: string) => {
    const next = new Set(elegidos);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSeleccion(next);
  };

  const elegirConcepto = (c: ConceptoPago) => {
    setConcepto(c);
    if (c === 'alquiler') setMonto(String(h.montoAlquiler ?? 0));
    else if (c === 'internet') setMonto(String(h.montoInternet ?? 0));
    else if (c === 'servicios') setMonto(String(h.montoServicios ?? 0));
  };

  const montoNum = Number(monto) || 0;
  const mesesElegidos = meses.filter((m) => elegidos.has(clave(m.mes, m.anio)));
  const total = montoNum * mesesElegidos.length;
  const puedeGuardar = montoNum > 0 && mesesElegidos.length > 0 && !createPago.isPending;

  const registrar = async () => {
    const hechos: Pago[] = [];
    try {
      // En serie: Apps Script escribe en la hoja de una fila a la vez
      for (const m of mesesElegidos) {
        const p = await createPago.mutateAsync({
          habitacionId: h.id,
          inquilinoId: inq?.id,
          fecha,
          mes: m.mes,
          anio: m.anio,
          concepto,
          monto: montoNum,
          metodoPago: metodo,
          referencia: referencia.trim(),
          observaciones: [cobrador && textoCobrador(cobrador), observaciones.trim()].filter(Boolean).join(' · '),
        });
        if (p) hechos.push(p);
      }
      notify.success(hechos.length > 1 ? `${hechos.length} pagos registrados` : 'Pago registrado');
      setRegistrados(hechos);
    } catch {
      notify.error(
        hechos.length ? `Se registraron ${hechos.length} pagos; los demás fallaron.` : 'No se pudo registrar el pago'
      );
      if (hechos.length) setRegistrados(hechos);
    }
  };

  if (isLoading || !cobro) return <p className="text-sm text-slate-400 py-6">Cargando pagos…</p>;

  // Confirmación tras registrar
  if (registrados) {
    return (
      <div className="py-6 text-center space-y-4 plano-aparecer">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(registrados.reduce((s, p) => s + Number(p.monto || 0), 0))} registrados
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {h.codigo} · {inq ? `${inq.nombre} ${inq.apellido}` : 'sin inquilino'}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {registrados.map((p) => (
            <span key={p.id} className="badge badge-success">
              <span className="font-mono">{p.id}</span> · <span className="capitalize">{getMonthName(Number(p.mes))}</span> {p.anio}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button type="button" onClick={() => setRegistrados(null)} className="btn btn-secondary">
            Registrar otro
          </button>
          <button
            type="button"
            onClick={() => (onVerVoucher && registrados[0] ? onVerVoucher(registrados[0]) : navigate('/pagos'))}
            className="btn btn-secondary"
          >
            Ver voucher
          </button>
          <button type="button" onClick={onListo} className="btn btn-primary">
            Listo
          </button>
        </div>
      </div>
    );
  }

  const dias = cobro.dias ?? 0;
  return (
    <div className="space-y-5">
      {/* Resumen del cobro */}
      <div
        className={cn(
          'rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3',
          cobro.nivel === 'vencido' ? 'bg-red-50 border-red-200' : cobro.nivel === 'ok' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        )}
      >
        {cobro.atrasados.length ? (
          <AlertTriangle className="w-5 h-5 text-red-600" />
        ) : (
          <CalendarClock className="w-5 h-5 text-emerald-700" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {inq ? `${inq.nombre} ${inq.apellido}` : 'Sin inquilino registrado'}
          </p>
          <p className="text-xs text-slate-600">
            {cobro.atrasados.length
              ? `${cobro.atrasados.length} ${cobro.atrasados.length === 1 ? 'mes atrasado' : 'meses atrasados'} · ${formatCurrency(cobro.atrasados.length * Number(h.montoAlquiler || 0))}`
              : cobro.proximo
              ? `Próximo pago ${cobro.proximo.vence.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })} · ${textoCuenta(dias)}`
              : 'Sin pagos pendientes'}
          </p>
        </div>
      </div>

      {/* Meses */}
      <section>
        <p className="fieldset-title mb-2">¿Qué meses paga?</p>
        <div className="space-y-3">
          {[...new Set(meses.map((m) => m.anio))].map((anio) => (
            <div key={anio} className="flex flex-wrap items-start gap-2">
              {/* Año como sección: evita confundirlo con la fecha de pago */}
              <span className="w-12 pt-2.5 text-xs font-bold text-slate-400 tabular-nums flex-shrink-0">{anio}</span>
              <div className="flex flex-wrap gap-2 flex-1">
                {meses
                  .filter((m) => m.anio === anio)
                  .map((m) => {
                    const k = clave(m.mes, m.anio);
                    const activo = elegidos.has(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => alternarMes(k)}
                        className={cn(
                          'rounded-xl border-2 px-3 py-2 text-left transition-all duration-150 min-w-[108px]',
                          activo
                            ? 'border-primary-600 bg-primary-50 shadow-soft -translate-y-px'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        )}
                      >
                        <p className={cn('text-sm font-bold capitalize', activo ? 'text-primary-700' : 'text-slate-800')}>
                          {getMonthName(m.mes)}
                        </p>
                        <p
                          className={cn(
                            'text-[11px] font-semibold',
                            m.tipo === 'atrasado' ? 'text-red-600' : m.tipo === 'proximo' ? 'text-amber-700' : 'text-slate-400'
                          )}
                        >
                          {m.tipo === 'atrasado' ? 'Atrasado' : m.tipo === 'proximo' ? 'Este ciclo' : 'Adelanto'}
                          <span className="font-normal text-slate-500"> · vence el {m.vence.getDate()}</span>
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Concepto */}
      <section>
        <p className="fieldset-title mb-2">Concepto</p>
        <div className="flex flex-wrap gap-2">
          {CONCEPTOS.filter((c) => c.value !== 'internet' || tieneInternet(h)).map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={concepto === c.value}
              onClick={() => elegirConcepto(c.value)}
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-semibold transition-colors',
                concepto === c.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
              )}
            >
              <c.icon className="w-4 h-4" /> {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Método */}
      <section>
        <p className="fieldset-title mb-2">Método de pago</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {METODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={metodo === m.value}
              onClick={() => setMetodo(m.value)}
              className={cn(
                'flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 text-sm font-semibold transition-colors',
                metodo === m.value ? m.activo : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              )}
            >
              <m.icon className="w-4 h-4" /> {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* Quién cobró: queda en observaciones y sale como inicial en el resumen impreso */}
      <section>
        <p className="fieldset-title mb-2">¿Quién cobró?</p>
        <div className="flex flex-wrap gap-2">
          {COBRADORES.map((c) => (
            <button
              key={c.nombre}
              type="button"
              aria-pressed={cobrador === c.nombre}
              onClick={() => setCobrador(cobrador === c.nombre ? '' : c.nombre)}
              className={cn(
                'inline-flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full border-2 text-sm font-semibold transition-colors',
                cobrador === c.nombre ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  cobrador === c.nombre ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {c.inicial}
              </span>
              {c.nombre}
            </button>
          ))}
        </div>
      </section>

      {/* Datos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pago-monto" className="label">Monto por mes *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">S/</span>
            <input
              id="pago-monto"
              type="number"
              min="0"
              step="0.5"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="input pl-9 tabular-nums font-semibold"
            />
          </div>
        </div>
        <div>
          <label htmlFor="pago-fecha" className="label">Fecha del pago</label>
          <input id="pago-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
        </div>
        {metodo !== 'efectivo' && (
          <div>
            <label htmlFor="pago-ref" className="label">N° de operación</label>
            <input
              id="pago-ref"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Código del Yape / transferencia"
              className="input"
            />
          </div>
        )}
        <div className={metodo === 'efectivo' ? 'sm:col-span-2' : ''}>
          <label htmlFor="pago-obs" className="label">Observaciones</label>
          <input
            id="pago-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Nota opcional"
            className="input"
          />
        </div>
      </section>

      {/* Total */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <div>
          <p className="text-[11px] text-slate-500">
            {mesesElegidos.length} {mesesElegidos.length === 1 ? 'mes' : 'meses'} × {formatCurrency(montoNum)}
          </p>
          <p className="font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onListo} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={registrar} disabled={!puedeGuardar} className="btn btn-primary btn-lg">
            {createPago.isPending ? 'Registrando…' : mesesElegidos.length > 1 ? `Registrar ${mesesElegidos.length} pagos` : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
