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
        'card p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
        isVacant && 'border-gray-300 bg-gray-50',
        isMaintenance && 'border-yellow-300 bg-yellow-50',
        isOccupied && hasDebt && 'border-red-300 bg-red-50',
        isOccupied && isPaid && 'border-green-300 bg-green-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isVacant && 'bg-gray-200',
              isMaintenance && 'bg-yellow-200',
              isOccupied && hasDebt && 'bg-red-200',
              isOccupied && isPaid && 'bg-green-200'
            )}
          >
            {isMaintenance ? (
              <Wrench className="w-5 h-5 text-yellow-700" />
            ) : (
              <Home className="w-5 h-5 text-gray-700" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">{habitacion.codigo}</h3>
            <p className="text-xs text-gray-500">Piso {habitacion.piso?.numero}</p>
          </div>
        </div>
        {showPaymentStatus && isOccupied && (
          <div className="flex gap-1">
            {habitacion.alquilerPagado ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Inquilino */}
      {isOccupied && habitacion.nombreInquilino && (
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="truncate">{habitacion.nombreInquilino}</span>
          </div>
          {habitacion.telefonoInquilino && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{habitacion.telefonoInquilino}</span>
            </div>
          )}
          {habitacion.diaPago && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Paga el dia {habitacion.diaPago}</span>
            </div>
          )}
        </div>
      )}

      {/* Estado */}
      <div className="flex items-center justify-between text-sm">
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
        <span className="font-medium">
          {formatCurrency(habitacion.montoAlquiler)}
        </span>
      </div>

      {/* Deuda */}
      {isOccupied && hasDebt && habitacion.deudaTotal && habitacion.deudaTotal > 0 && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <div className="flex justify-between text-sm">
            <span className="text-red-600">Deuda total:</span>
            <span className="font-bold text-red-600">
              {formatCurrency(habitacion.deudaTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
