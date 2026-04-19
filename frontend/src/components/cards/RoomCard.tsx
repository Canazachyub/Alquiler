import { Home, User, Phone, Wrench, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import type { HabitacionConDetalles } from '@/types';

interface RoomCardProps {
  habitacion: HabitacionConDetalles;
  onClick?: () => void;
  showPaymentStatus?: boolean;
}

export function RoomCard({ habitacion, onClick }: RoomCardProps) {
  const isOccupied = habitacion.estado === 'occupied';
  const isVacant = habitacion.estado === 'vacant';
  const isMaintenance = habitacion.estado === 'maintenance';
  const hasDebt = isOccupied && (!habitacion.alquilerPagado || !habitacion.internetPagado);
  const isPaid = isOccupied && habitacion.alquilerPagado && habitacion.internetPagado;

  // Prioridad: deuda > mantenimiento > pagado > vacante
  const stateLabel =
    hasDebt ? 'Con deuda' :
    isMaintenance ? 'Mantenimiento' :
    isPaid ? 'Al día' :
    'Vacante';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative card-interactive p-5 ring-1',
        hasDebt && 'ring-red-200 bg-red-50/40',
        isMaintenance && 'ring-amber-200 bg-amber-50/40',
        isPaid && 'ring-emerald-200 bg-emerald-50/30',
        isVacant && 'ring-slate-200'
      )}
    >
      {/* Dot de estado */}
      <span
        className={cn(
          'absolute top-3 right-3 w-2 h-2 rounded-full',
          hasDebt && 'bg-red-500',
          isMaintenance && 'bg-amber-500',
          isPaid && 'bg-emerald-500',
          isVacant && 'bg-slate-300'
        )}
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl ring-1 ring-inset flex items-center justify-center',
            hasDebt && 'bg-red-50 ring-red-100 text-red-600',
            isMaintenance && 'bg-amber-50 ring-amber-100 text-amber-600',
            isPaid && 'bg-emerald-50 ring-emerald-100 text-emerald-600',
            isVacant && 'bg-slate-50 ring-slate-100 text-slate-400'
          )}
        >
          {isMaintenance ? (
            <Wrench className="w-5 h-5" />
          ) : (
            <Home className="w-5 h-5" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base tracking-tight text-slate-900">{habitacion.codigo}</h3>
          <p className="text-xs text-slate-500">Piso {habitacion.piso?.numero}</p>
        </div>
      </div>

      {/* Inquilino */}
      {isOccupied && habitacion.nombreInquilino && (
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate font-medium text-slate-700">{habitacion.nombreInquilino}</span>
          </div>
          {habitacion.telefonoInquilino && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{habitacion.telefonoInquilino}</span>
            </div>
          )}
          {habitacion.diaPago && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Paga el dia {habitacion.diaPago}</span>
            </div>
          )}
        </div>
      )}

      {/* Estado y Monto */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span
          className={cn(
            'badge inline-flex items-center gap-1',
            hasDebt && 'badge-danger',
            isMaintenance && 'badge-warning',
            isPaid && 'badge-success',
            isVacant && 'badge-neutral'
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {stateLabel}
        </span>
        <span className="font-semibold text-sm text-slate-900 tabular-nums">
          {formatCurrency(habitacion.montoAlquiler)}
        </span>
      </div>

      {/* Deuda */}
      {isOccupied && hasDebt && habitacion.deudaTotal && habitacion.deudaTotal > 0 && (
        <div className="mt-3 pt-2.5 border-t border-red-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-red-600 font-medium">Deuda total:</span>
            <span className="font-semibold tabular-nums text-red-700">
              {formatCurrency(habitacion.deudaTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
