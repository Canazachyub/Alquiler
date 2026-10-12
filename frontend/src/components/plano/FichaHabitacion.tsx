import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Phone, CreditCard, Pencil, MessageCircle, Wifi, WifiOff, Home, BadgeCheck } from 'lucide-react';
import { IconChip } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { normalizarTelefonoPeru } from '@/utils/whatsapp';
import { ESTADO_ESTILO } from './estadoEstilos';
import { CicloPago } from './CicloPago';
import { useUpdateHabitacion, useCobros } from '@/hooks';
import { useNotifications } from '@/store';
import { tieneInternet, PRECIO_INTERNET_DEFAULT } from '@/utils/habitacion';
import type { HabitacionConDetalles } from '@/types';

interface FichaHabitacionProps {
  habitacion: HabitacionConDetalles;
  onCerrar: () => void;
  onEditar: () => void;
  /** Abre la pestaña Registrar pago de la ventana del cuarto */
  onRegistrarPago?: () => void;
}

export function FichaHabitacion({ habitacion: h, onCerrar, onEditar, onRegistrarPago }: FichaHabitacionProps) {
  const navigate = useNavigate();
  const cobros = useCobros();
  const estado = cobros.estado(h);
  const st = ESTADO_ESTILO[estado];
  const ocupada = h.estado === 'occupied';
  // Solo lo vencido es deuda; el mes en curso que aún no vence no cuenta
  const deuda = cobros.deuda(h);
  const conInternet = tieneInternet(h);

  // El internet es opcional y este es el único lugar donde se activa o quita
  const { notify } = useNotifications();
  const updateHab = useUpdateHabitacion();
  const [activando, setActivando] = useState(false);
  const [precio, setPrecio] = useState(String(PRECIO_INTERNET_DEFAULT));
  const [exonerando, setExonerando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const exonerado = estado === 'exonerado';

  const exonerar = async () => {
    try {
      const r = await updateHab.mutateAsync({
        id: h.id,
        data: { estado: 'exonerated', motivoExoneracion: motivo.trim() },
      });
      if (r && (r as { motivoExoneracion?: string }).motivoExoneracion === undefined) {
        notify.warning(`${h.codigo} exonerado. El motivo se guardará cuando actualices el backend (columna "MotivoExoneracion").`);
      } else {
        notify.success(`${h.codigo} exonerado`);
      }
      setExonerando(false);
      setMotivo('');
    } catch {
      notify.error('No se pudo exonerar el cuarto');
    }
  };

  const quitarExoneracion = async () => {
    try {
      await updateHab.mutateAsync({
        id: h.id,
        data: { estado: h.nombreInquilino ? 'occupied' : 'vacant', motivoExoneracion: '' },
      });
      notify.success(`Exoneración de ${h.codigo} retirada`);
    } catch {
      notify.error('No se pudo quitar la exoneración');
    }
  };

  const cambiarInternet = async (monto: number) => {
    try {
      await updateHab.mutateAsync({ id: h.id, data: { montoInternet: monto } });
      notify.success(monto > 0 ? `Internet activado en ${h.codigo}` : `Internet quitado de ${h.codigo}`);
      setActivando(false);
    } catch {
      notify.error('No se pudo actualizar el internet');
    }
  };
  const tel = normalizarTelefonoPeru(h.telefonoInquilino);

  return (
    <div className="plano-aparecer rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-start gap-3">
        <IconChip icon={Home} tone={st.tone} variant={estado === 'vacante' ? 'soft' : 'solid'} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900 leading-none">{h.codigo}</h3>
            <span className={cn('badge', st.badge)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
              {st.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {[h.edificioNombre, h.pisoNumero !== undefined ? `Piso ${h.pisoNumero}` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button onClick={onCerrar} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Cerrar ficha">
          <X className="w-4 h-4" />
        </button>
      </div>

      {ocupada ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800 truncate">{h.nombreInquilino || 'Sin inquilino registrado'}</span>
          </p>
          {h.telefonoInquilino && (
            <p className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              {h.telefonoInquilino}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          {exonerado
            ? 'Cuarto exonerado: lo usan los propietarios, no se cobra.'
            : estado === 'mantenimiento'
            ? 'Cuarto en mantenimiento.'
            : 'Cuarto libre, listo para alquilar.'}
        </p>
      )}

      {ocupada && !exonerado && (
        <CicloPago
          habitacion={h}
          onRegistrar={() =>
            document.getElementById(`historial-${h.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        />
      )}

      {/* Métricas del mes */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
        <div>
          <p className="font-display font-bold tabular-nums text-slate-900">{formatCurrency(h.montoAlquiler)}</p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            Alquiler
            {ocupada && <span className={h.alquilerPagado ? 'text-emerald-600' : 'text-red-600'}>{h.alquilerPagado ? '✓' : '✗'}</span>}
          </p>
        </div>
        <div>
          {conInternet ? (
            <>
              <p className="font-display font-bold tabular-nums text-slate-900">{formatCurrency(h.montoInternet)}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Internet
                {ocupada && <span className={h.internetPagado ? 'text-emerald-600' : 'text-red-600'}>{h.internetPagado ? '✓' : '✗'}</span>}
              </p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-slate-400">—</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Sin internet
              </p>
            </>
          )}
        </div>
        <div className="text-right">
          <p className={cn('font-display font-bold tabular-nums', ocupada && deuda > 0 ? 'text-red-600' : 'text-slate-900')}>
            {ocupada ? formatCurrency(deuda) : '—'}
          </p>
          <p className="text-[11px] text-slate-500">Deuda vencida</p>
        </div>
      </div>

      {/* Exoneración */}
      {exonerado ? (
        <div className="mt-4 rounded-lg bg-olive-50 border border-olive-500/30 px-3 py-2.5 flex flex-wrap items-start gap-2 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-olive-700">Exonerado de pago</p>
            <p className="text-slate-700">{h.motivoExoneracion || <span className="text-slate-400">Sin motivo registrado</span>}</p>
          </div>
          <button
            type="button"
            onClick={quitarExoneracion}
            disabled={updateHab.isPending}
            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Quitar exoneración
          </button>
        </div>
      ) : exonerando ? (
        <form
          className="mt-4 rounded-lg bg-olive-50 border border-olive-500/30 p-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (motivo.trim()) exonerar();
          }}
        >
          <label htmlFor={`motivo-${h.id}`} className="label !mb-0">Motivo de la exoneración *</label>
          <input
            id={`motivo-${h.id}`}
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Lo ocupa la familia / depósito propio"
            className="input"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setExonerando(false)} className="btn btn-ghost btn-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!motivo.trim() || updateHab.isPending}>
              {updateHab.isPending ? 'Guardando…' : 'Exonerar'}
            </button>
          </div>
        </form>
      ) : null}

      {/* Internet: activar / quitar */}
      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm">
        {conInternet ? (
          <>
            <Wifi className="w-4 h-4 text-sky-600" />
            <span className="text-slate-700">Internet activo · {formatCurrency(h.montoInternet)}/mes</span>
            <button
              type="button"
              onClick={() => cambiarInternet(0)}
              disabled={updateHab.isPending}
              className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Quitar internet
            </button>
          </>
        ) : activando ? (
          <form
            className="flex flex-wrap items-center gap-2 w-full"
            onSubmit={(e) => {
              e.preventDefault();
              const monto = Number(precio);
              if (monto > 0) cambiarInternet(monto);
            }}
          >
            <Wifi className="w-4 h-4 text-sky-600" />
            <label htmlFor={`precio-int-${h.id}`} className="text-slate-700">Precio mensual S/</label>
            <input
              id={`precio-int-${h.id}`}
              type="number"
              min="1"
              step="0.5"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="input !h-8 !w-24 tabular-nums"
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={updateHab.isPending || !(Number(precio) > 0)}>
              {updateHab.isPending ? 'Guardando…' : 'Activar'}
            </button>
            <button type="button" onClick={() => setActivando(false)} className="btn btn-ghost btn-sm">
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">Sin internet contratado</span>
            <button type="button" onClick={() => setActivando(true)} className="ml-auto link-arrow text-xs">
              Activar internet
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {ocupada && !exonerado && (
          <button onClick={() => (onRegistrarPago ? onRegistrarPago() : navigate(`/pagos?hab=${h.id}`))} className="btn btn-primary btn-sm">
            <CreditCard className="w-3.5 h-3.5" /> Registrar pago
          </button>
        )}
        {ocupada && tel && (
          <a
            href={`https://wa.me/${tel}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        )}
        {!exonerado && !exonerando && (
          <button onClick={() => setExonerando(true)} className="btn btn-ghost btn-sm">
            <BadgeCheck className="w-3.5 h-3.5" /> Exonerar cuarto
          </button>
        )}
        <button onClick={onEditar} className="btn btn-ghost btn-sm">
          <Pencil className="w-3.5 h-3.5" /> Editar cuarto
        </button>
      </div>
    </div>
  );
}
