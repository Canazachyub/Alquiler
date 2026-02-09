import { Home, User, Phone, CheckCircle, XCircle, Wrench, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import type { HabitacionConDetalles } from '@/types';

interface RoomCardProps {
  habitacion: HabitacionConDetalles;
  onClick?: () => void;
  showPaymentStatus?: boolean;
}

export function RoomCard({ habitacion, onClick, showPaymentStatus = true }: RoomCardProps) {
  const isOccupied = habitacion.estado === 'occupied';
  const isVacant = habitacion.estado === 'vacant';
  const isMaintenance = habitacion.estado === 'maintenance';

  const hasDebt = isOccupied && (!habitacion.alquilerPagado || !habitacion.internetPagado);
  const isPaid = isOccupied && habitacion.alquilerPagado && habitacion.internetPagado;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5',
        isVacant && 'border-gray-200 bg-white',
        isMaintenance && 'border-warning-200/60 bg-white',
        isOccupied && hasDebt && 'border-danger-200/60 bg-white',
        isOccupied && isPaid && 'border-success-200/60 bg-white'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isVacant && 'bg-gray-100',
              isMaintenance && 'bg-warning-50',
              isOccupied && hasDebt && 'bg-danger-50',
              isOccupied && isPaid && 'bg-success-50'
            )}
          >
            {isMaintenance ? (
              <Wrench className="w-5 h-5 text-warning-600" />
            ) : (
              <Home className={cn(
                'w-5 h-5',
                isVacant && 'text-gray-400',
                isOccupied && hasDebt && 'text-danger-500',
                isOccupied && isPaid && 'text-success-500'
              )} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">{habitacion.codigo}</h3>
            <p className="text-xs text-gray-400 font-medium">Piso {habitacion.piso?.numero}</p>
          </div>
        </div>
        {showPaymentStatus && isOccupied && (
          <div>
            {habitacion.alquilerPagado ? (
              <CheckCircle className="w-5 h-5 text-success-500" />
            ) : (
              <XCircle className="w-5 h-5 text-danger-500" />
            )}
          </div>
        )}
      </div>

      {/* Inquilino */}
      {isOccupied && habitacion.nombreInquilino && (
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate font-medium text-gray-700">{habitacion.nombreInquilino}</span>
          </div>
          {habitacion.telefonoInquilino && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{habitacion.telefonoInquilino}</span>
            </div>
          )}
          {habitacion.diaPago && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Paga el dia {habitacion.diaPago}</span>
            </div>
          )}
        </div>
      )}

      {/* Estado y Monto */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span
          className={cn(
            'badge',
            isVacant && 'badge-info',
            isMaintenance && 'badge-warning',
            isOccupied && hasDebt && 'badge-danger',
            isOccupied && isPaid && 'badge-success'
          )}
        >
          {isVacant && 'Vacante'}
          {isMaintenance && 'Mantenimiento'}
          {isOccupied && hasDebt && 'Con deuda'}
          {isOccupied && isPaid && 'Al día'}
        </span>
        <span className="font-bold text-sm text-gray-900">
          {formatCurrency(habitacion.montoAlquiler)}
        </span>
      </div>

      {/* Deuda */}
      {isOccupied && hasDebt && habitacion.deudaTotal && habitacion.deudaTotal > 0 && (
        <div className="mt-3 pt-2.5 border-t border-danger-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-danger-600 font-medium">Deuda total:</span>
            <span className="font-bold text-danger-700">
              {formatCurrency(habitacion.deudaTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
