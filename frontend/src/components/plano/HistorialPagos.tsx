import { Fragment, useState } from 'react';
import { Pencil, Plus, Check, X, History } from 'lucide-react';
import { usePagosByHabitacion, useUpdatePago, useCreatePago, useInquilinos } from '@/hooks';
import { useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, getMonthName, hoyISO } from '@/utils/formatters';
import { CONCEPTOS_PAGO, METODOS_PAGO } from '@/utils/constants';
import { tieneInternet } from '@/utils/habitacion';
import type { HabitacionConDetalles, Pago, PagoInput, ConceptoPago, MetodoPago } from '@/types';

interface HistorialPagosProps {
  habitacion: HabitacionConDetalles;
}

interface Borrador {
  fecha: string;
  concepto: ConceptoPago;
  monto: string;
  metodoPago: MetodoPago;
  observaciones: string;
}

/** Meses desde el ingreso del inquilino hasta hoy, del más reciente al más antiguo. */
function mesesDesde(fechaIngreso?: string): { mes: number; anio: number }[] {
  const hoy = new Date();
  let inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
  if (fechaIngreso) {
    const [y, m] = String(fechaIngreso).slice(0, 10).split('-').map(Number);
    if (y && m) inicio = new Date(y, m - 1, 1);
  }
  const out: { mes: number; anio: number }[] = [];
  for (let d = new Date(hoy.getFullYear(), hoy.getMonth(), 1); d >= inicio && out.length < 36; d.setMonth(d.getMonth() - 1)) {
    out.push({ mes: d.getMonth() + 1, anio: d.getFullYear() });
  }
  return out;
}

const fechaInput = (f?: string) => (f ? String(f).slice(0, 10) : hoyISO());
const labelConcepto = (c: string) => CONCEPTOS_PAGO.find((x) => x.value === c)?.label ?? c;
const labelMetodo = (m: string) => METODOS_PAGO.find((x) => x.value === m)?.label ?? m;

export function HistorialPagos({ habitacion: h }: HistorialPagosProps) {
  const { notify } = useNotifications();
  const { data: pagos = [], isLoading } = usePagosByHabitacion(h.id);
  const { data: inquilinos } = useInquilinos();
  const updatePago = useUpdatePago();
  const createPago = useCreatePago();

  // Fila en edición: id de pago, o "nuevo-<anio>-<mes>" para registrar en un mes pendiente
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);

  const inquilino = inquilinos?.find((i) => i.habitacionId === h.id && i.estado === 'activo');
  const meses = mesesDesde(h.fechaIngreso);

  const pagosDelMes = (mes: number, anio: number) =>
    pagos
      .filter((p) => Number(p.mes) === mes && Number(p.anio) === anio && p.estado !== 'anulado')
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  const empezarEdicion = (p: Pago) => {
    setEditando(p.id);
    setBorrador({
      fecha: fechaInput(p.fecha),
      concepto: p.concepto,
      monto: String(p.monto),
      metodoPago: p.metodoPago,
      observaciones: p.observaciones ?? '',
    });
  };

  const empezarNuevo = (mes: number, anio: number) => {
    setEditando(`nuevo-${anio}-${mes}`);
    setBorrador({
      fecha: hoyISO(),
      concepto: 'alquiler',
      monto: String(h.montoAlquiler ?? 0),
      metodoPago: 'efectivo',
      observaciones: '',
    });
  };

  const cancelar = () => {
    setEditando(null);
    setBorrador(null);
  };

  const guardar = async (mes: number, anio: number, pago?: Pago) => {
    if (!borrador) return;
    const monto = Number(borrador.monto);
    if (!(monto > 0)) {
      notify.error('Ingresa un monto mayor a 0');
      return;
    }
    const data: Partial<PagoInput> = {
      fecha: borrador.fecha,
      concepto: borrador.concepto,
      monto,
      metodoPago: borrador.metodoPago,
      observaciones: borrador.observaciones.trim(),
    };
    try {
      if (pago) {
        await updatePago.mutateAsync({ id: pago.id, data });
        notify.success(`Pago ${pago.id} actualizado`);
      } else {
        await createPago.mutateAsync({
          ...(data as PagoInput),
          habitacionId: h.id,
          inquilinoId: inquilino?.id,
          mes,
          anio,
        });
        notify.success(`Pago de ${getMonthName(mes)} registrado`);
      }
      cancelar();
    } catch {
      notify.error('No se pudo guardar el pago');
    }
  };

  const guardando = updatePago.isPending || createPago.isPending;
  const conceptos = CONCEPTOS_PAGO.filter((c) => c.value !== 'internet' || tieneInternet(h));

  const filaEdicion = (mes: number, anio: number, pago?: Pago) =>
    borrador && (
      <tr className="bg-primary-50/50">
        <td className="!py-2 text-xs text-slate-500">{pago ? pago.id : 'Nuevo'}</td>
        <td className="!py-2">
          <input
            type="date"
            value={borrador.fecha}
            onChange={(e) => setBorrador({ ...borrador, fecha: e.target.value })}
            className="input !h-8 !px-2 text-xs w-[130px]"
            aria-label="Fecha de pago"
          />
        </td>
        <td className="!py-2">
          <select
            value={borrador.concepto}
            onChange={(e) => setBorrador({ ...borrador, concepto: e.target.value as ConceptoPago })}
            className="select !h-8 !px-2 text-xs w-[110px]"
            aria-label="Concepto"
          >
            {conceptos.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </td>
        <td className="!py-2">
          <input
            type="number"
            min="0"
            step="0.5"
            value={borrador.monto}
            onChange={(e) => setBorrador({ ...borrador, monto: e.target.value })}
            className="input !h-8 !px-2 text-xs w-[84px] tabular-nums"
            aria-label="Monto"
          />
        </td>
        <td className="!py-2">
          <select
            value={borrador.metodoPago}
            onChange={(e) => setBorrador({ ...borrador, metodoPago: e.target.value as MetodoPago })}
            className="select !h-8 !px-2 text-xs w-[110px]"
            aria-label="Método"
          >
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </td>
        <td className="!py-2">
          <input
            type="text"
            value={borrador.observaciones}
            onChange={(e) => setBorrador({ ...borrador, observaciones: e.target.value })}
            placeholder="Ej. pagó a Yubert"
            className="input !h-8 !px-2 text-xs min-w-[140px]"
            aria-label="Observaciones"
          />
        </td>
        <td className="!py-2">
          <div className="flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => guardar(mes, anio, pago)}
              disabled={guardando}
              className="p-1.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              aria-label="Guardar"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={cancelar} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500" aria-label="Cancelar">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );

  return (
    <div id={`historial-${h.id}`} className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden plano-aparecer scroll-mt-20">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-bold text-slate-900">Historial de pagos</h4>
        </div>
        <span className="text-[11px] text-slate-500">
          {h.fechaIngreso ? `Desde ${formatDate(h.fechaIngreso, 'MMMM yyyy')}` : 'Últimos 6 meses'}
        </span>
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-sm text-slate-400">Cargando pagos…</p>
      ) : (
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="table !min-w-[720px]">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>N° pago</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th className="text-right">Monto</th>
                <th>Método</th>
                <th>Observaciones</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {meses.map(({ mes, anio }) => {
                const delMes = pagosDelMes(mes, anio);
                const alquilerPagado = delMes.some((p) => p.concepto === 'alquiler');
                const total = delMes.reduce((s, p) => s + Number(p.monto || 0), 0);
                const nuevoId = `nuevo-${anio}-${mes}`;
                return (
                  <Fragment key={`${anio}-${mes}`}>
                    {/* Cabecera del mes */}
                    <tr className="!bg-slate-50 hover:!bg-slate-50">
                      <td colSpan={7} className="!py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 capitalize">
                            {getMonthName(mes)} {anio}
                          </span>
                          <span className={cn('badge', alquilerPagado ? 'badge-success' : 'badge-danger')}>
                            {alquilerPagado ? 'Pagado' : 'Pendiente'}
                          </span>
                          {total > 0 && (
                            <span className="text-xs text-slate-500 tabular-nums">{formatCurrency(total)}</span>
                          )}
                          {editando !== nuevoId && (
                            <button
                              type="button"
                              onClick={() => empezarNuevo(mes, anio)}
                              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {alquilerPagado ? 'Agregar' : 'Registrar pago'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {delMes.map((p) =>
                      editando === p.id ? (
                        <Fragment key={p.id}>{filaEdicion(mes, anio, p)}</Fragment>
                      ) : (
                        <tr key={p.id}>
                          <td className="!py-2 font-mono text-xs text-slate-600">{p.id}</td>
                          <td className="!py-2 tabular-nums">{formatDate(p.fecha)}</td>
                          <td className="!py-2">{labelConcepto(p.concepto)}</td>
                          <td className="!py-2 text-right font-semibold tabular-nums">{formatCurrency(Number(p.monto))}</td>
                          <td className="!py-2 text-slate-600">{labelMetodo(p.metodoPago)}</td>
                          <td className="!py-2 text-slate-600 max-w-[220px] truncate" title={p.observaciones}>
                            {p.observaciones || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="!py-2 text-right">
                            <button
                              type="button"
                              onClick={() => empezarEdicion(p)}
                              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                              aria-label={`Editar pago ${p.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    )}

                    {editando === nuevoId && filaEdicion(mes, anio)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
