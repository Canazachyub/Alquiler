import { CalendarClock, AlertTriangle, Receipt } from 'lucide-react';
import { usePagos } from '@/hooks';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatters';
import { calcularCobro, textoCuenta, type EstadoCobro } from '@/utils/cobro';
import type { HabitacionConDetalles } from '@/types';

const ESTILO: Record<EstadoCobro['nivel'], { caja: string; numero: string; barra: string; etiqueta: string }> = {
  ok: { caja: 'bg-leaf-50 border-leaf-500/30', numero: 'text-leaf-700', barra: 'bg-leaf-500', etiqueta: 'Al día' },
  pronto: { caja: 'bg-amber-50 border-amber-500/40', numero: 'text-amber-700', barra: 'bg-amber-500', etiqueta: 'Se acerca' },
  hoy: { caja: 'bg-amber-50 border-amber-500/60', numero: 'text-amber-700', barra: 'bg-amber-500', etiqueta: 'Vence hoy' },
  vencido: { caja: 'bg-red-50 border-red-500/40', numero: 'text-red-700', barra: 'bg-red-500', etiqueta: 'Vencido' },
};

const fechaLarga = (d: Date) =>
  d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
const mesCorto = (mes: number) => getMonthName(mes).slice(0, 3).toLowerCase();

interface CicloPagoProps {
  habitacion: HabitacionConDetalles;
  onRegistrar?: () => void;
}

/** Ciclo de cobro: desde cuándo paga, último pago y cuenta regresiva al próximo. */
export function CicloPago({ habitacion, onRegistrar }: CicloPagoProps) {
  const { data: pagos, isLoading } = usePagos();
  if (isLoading || !pagos) {
    return <div className="mt-4 h-28 rounded-xl bg-slate-100 animate-pulse" />;
  }

  const c = calcularCobro(habitacion, pagos);
  const st = ESTILO[c.nivel];
  const dias = c.dias ?? 0;

  return (
    <div className={cn('mt-4 rounded-xl border p-4', st.caja)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Cuenta regresiva */}
        <div className="flex items-end gap-2">
          <span className={cn('font-display text-5xl font-bold leading-none tabular-nums tracking-tight', st.numero)}>
            {c.dias === null ? '—' : Math.abs(dias)}
          </span>
          <div className="pb-1">
            <p className={cn('text-sm font-bold leading-tight', st.numero)}>
              {dias === 0 ? 'hoy' : Math.abs(dias) === 1 ? 'día' : 'días'}
            </p>
            <p className="text-xs text-slate-600 leading-tight">
              {dias > 0 ? 'para el próximo pago' : dias === 0 ? 'vence el pago' : 'de atraso'}
            </p>
          </div>
        </div>

        {/* Próximo vencimiento */}
        {c.proximo && (
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1 justify-end">
              <CalendarClock className="w-3.5 h-3.5" /> Próximo pago
            </p>
            <p className="font-display text-xl font-bold text-slate-900 leading-tight capitalize">
              {fechaLarga(c.proximo.vence)}
            </p>
            <p className="text-xs text-slate-600">
              Alquiler de <span className="capitalize">{getMonthName(c.proximo.mes)}</span> · {formatCurrency(habitacion.montoAlquiler)}
            </p>
          </div>
        )}
      </div>

      {/* Barra del ciclo */}
      <div className="mt-3">
        <div className="h-2 rounded-full bg-white/80 overflow-hidden" role="progressbar" aria-valuenow={Math.round(c.avance)} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del ciclo de pago">
          <div className={cn('h-full rounded-full transition-all duration-700', st.barra)} style={{ width: `${c.avance}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
          <span className="first-letter:uppercase">
            {c.nivel === 'ok' || c.nivel === 'pronto' ? `${st.etiqueta} · próximo ${textoCuenta(c.dias)}` : textoCuenta(c.dias)}
          </span>
          <span>Paga cada día {c.diaPago}</span>
        </div>
      </div>

      {/* Desde / último pago */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-900/10 text-sm">
        <div>
          <p className="text-[11px] text-slate-500">Inquilino desde</p>
          <p className="font-semibold text-slate-800">{c.desde ? fechaLarga(c.desde) : '—'}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Receipt className="w-3 h-3" /> Último pago
          </p>
          {c.ultimoPago ? (
            <p className="text-slate-800">
              <span className="font-semibold">{formatDate(c.ultimoPago.fecha)}</span>
              {' · cubrió '}
              <span className="capitalize">{getMonthName(Number(c.ultimoPago.mes))}</span> {c.ultimoPago.anio}
              {' · '}
              <span className="tabular-nums">{formatCurrency(Number(c.ultimoPago.monto))}</span>
              <span className="font-mono text-[11px] text-slate-500"> · {c.ultimoPago.id}</span>
            </p>
          ) : (
            <p className="text-slate-500">Sin pagos registrados</p>
          )}
        </div>
      </div>

      {/* Meses atrasados */}
      {c.atrasados.length > 0 && (
        <div className="mt-3 rounded-lg bg-white/70 border border-red-200 px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-red-700 font-semibold">
            {c.atrasados.length} {c.atrasados.length === 1 ? 'mes atrasado' : 'meses atrasados'}:
          </span>
          <span className="text-slate-700">
            {c.atrasados.map((m) => `${mesCorto(m.mes)} ${String(m.anio).slice(2)}`).join(', ')}
          </span>
          <span className="text-red-700 font-semibold tabular-nums">
            · {formatCurrency(c.atrasados.length * Number(habitacion.montoAlquiler || 0))}
          </span>
          {onRegistrar && (
            <button type="button" onClick={onRegistrar} className="ml-auto link-arrow text-xs">
              Registrar en el historial
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Versión compacta para tarjetas y plano: "Próx. 25 nov · en 13 días" */
export function CuentaPagoCorta({ habitacion, className }: { habitacion: HabitacionConDetalles; className?: string }) {
  const { data: pagos } = usePagos();
  if (!pagos || habitacion.estado !== 'occupied' || !habitacion.fechaIngreso) return null;
  const c = calcularCobro(habitacion, pagos);
  if (!c.proximo) return null;
  const color =
    c.nivel === 'vencido' ? 'text-red-600' : c.nivel === 'ok' ? 'text-slate-500' : 'text-amber-700';
  return (
    <p className={cn('text-[11px] tabular-nums truncate', color, className)} title={`Próximo pago ${fechaLarga(c.proximo.vence)}`}>
      {c.atrasados.length > 1
        ? `${c.atrasados.length} meses atrasados`
        : `Próx. ${c.proximo.vence.getDate()} ${mesCorto(c.proximo.vence.getMonth() + 1)} · ${textoCuenta(c.dias)}`}
    </p>
  );
}
