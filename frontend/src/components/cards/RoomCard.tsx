import { Home, User, Phone, Wrench, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconChip } from '@/components/ui/IconChip';
import { ESTADO_ESTILO } from '@/components/plano/estadoEstilos';
import { useCobros } from '@/hooks/useCobros';
import { CuentaPagoCorta } from '@/components/plano/CicloPago';
import { formatCurrency } from '@/utils/formatters';
import type { HabitacionConDetalles } from '@/types';

interface RoomCardProps {
  habitacion: HabitacionConDetalles;
  onClick?: () => void;
  showPaymentStatus?: boolean;
  /** Oculta "Piso · Edificio" cuando la tarjeta ya está dentro de su grupo de piso */
  ocultarUbicacion?: boolean;
}

export function RoomCard({ habitacion, onClick, ocultarUbicacion }: RoomCardProps) {
  const isOccupied = habitacion.estado === 'occupied';
  const isVacant = habitacion.estado === 'vacant';
  const isMaintenance = habitacion.estado === 'maintenance';
  const isExonerated = habitacion.estado === 'exonerated';
  // Estado según el ciclo de pago real (no el mes calendario)
  const cobros = useCobros();
  const estado = cobros.estado(habitacion);
  const st = ESTADO_ESTILO[estado];

  // El backend devuelve el numero de piso plano (pisoNumero); el objeto anidado
  // solo llega en los endpoints que hacen join. Se aceptan ambos.
  const pisoNumero = habitacion.piso?.numero ?? habitacion.pisoNumero;

  // Solo cuenta como deuda lo que ya venció
  const deuda = cobros.deuda(habitacion);
  const cobro = cobros.cobro(habitacion);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative card-interactive p-5 flex flex-col',
        st.borde
      )}
    >
      {/* Header (nodo: ficha + título + meta) */}
      <div className="flex items-start gap-3 mb-4">
        <IconChip
          icon={isMaintenance ? Wrench : Home}
          tone={st.tone}
          variant={isVacant ? 'soft' : 'solid'}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900">{habitacion.codigo}</h3>
          {!ocultarUbicacion && (pisoNumero !== undefined || habitacion.edificioNombre) && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {[
                pisoNumero !== undefined ? `Piso ${pisoNumero}` : null,
                habitacion.edificioNombre,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
        <span
          className={cn('badge', st.badge)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
          {st.label}
        </span>
      </div>

      {/* Inquilino */}
      <div className="flex-1 mb-4">
        {(isOccupied || isExonerated) && habitacion.nombreInquilino ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate font-semibold text-slate-800">{habitacion.nombreInquilino}</span>
            </div>
            {habitacion.telefonoInquilino && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{habitacion.telefonoInquilino}</span>
              </div>
            )}
            {isExonerated && (
              <p className="text-xs text-olive-700">
                Exonerado{habitacion.motivoExoneracion ? ` · ${habitacion.motivoExoneracion}` : ''}
              </p>
            )}
            {isOccupied && habitacion.diaPago && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <CuentaPagoCorta habitacion={habitacion} className="!text-xs" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {isExonerated
              ? `Exonerado${habitacion.motivoExoneracion ? ` · ${habitacion.motivoExoneracion}` : ''}`
              : isMaintenance
              ? 'En mantenimiento'
              : isOccupied
              ? 'Ocupado sin inquilino registrado'
              : 'Disponible para alquilar'}
          </p>
        )}
      </div>

      {/* Métricas en columnas (como "Sent · Delivered · Clicked") */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div>
          <p className="font-display font-bold text-base tabular-nums text-slate-900 leading-tight">
            {formatCurrency(habitacion.montoAlquiler)}
          </p>
          <p className="text-[11px] text-slate-500">Alquiler</p>
        </div>
        <div className="text-right">
          {isOccupied && deuda > 0 ? (
            <>
              <p className="font-display font-bold text-base tabular-nums leading-tight text-red-600">
                {formatCurrency(deuda)}
              </p>
              <p className="text-[11px] text-red-600">Deuda vencida</p>
            </>
          ) : isOccupied && cobro?.proximo ? (
            <>
              <p
                className={cn(
                  'font-display font-bold text-base tabular-nums leading-tight',
                  estado === 'por-vencer' ? 'text-amber-700' : 'text-emerald-700'
                )}
              >
                {cobro.proximo.vence.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[11px] text-slate-500">Próximo pago</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-base leading-tight text-slate-300">—</p>
              <p className="text-[11px] text-slate-500">Sin cobro</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
