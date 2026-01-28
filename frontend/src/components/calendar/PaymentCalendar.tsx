import { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import { getMonthName } from '@/utils/formatters';
import type { HabitacionConDetalles, Pago } from '@/types';

interface PaymentCalendarProps {
  habitaciones: HabitacionConDetalles[];
  pagos: Pago[];
  mes: number;
  anio: number;
  onMonthChange?: (mes: number, anio: number) => void;
}

export function PaymentCalendar({
  habitaciones,
  pagos,
  mes,
  anio,
  onMonthChange,
}: PaymentCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Obtener informacion del mes
  const daysInMonth = new Date(anio, mes, 0).getDate();
  const firstDayOfMonth = new Date(anio, mes - 1, 1).getDay();

  // Crear array de dias
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Obtener habitaciones ocupadas con dia de pago
  const habitacionesOcupadas = habitaciones.filter((h) => h.estado === 'occupied');

  // Verificar pagos por habitacion
  const getPagoStatus = (habitacionId: string) => {
    const pagoAlquiler = pagos.find(
      (p) => p.habitacionId === habitacionId && p.concepto === 'alquiler' && p.estado === 'pagado'
    );
    return !!pagoAlquiler;
  };

  // Agrupar habitaciones por dia de pago
  const getHabitacionesByDay = (day: number) => {
    return habitacionesOcupadas.filter((h) => h.diaPago === day);
  };

  // Obtener datos del dia seleccionado
  const getSelectedDayData = () => {
    if (!selectedDay) return [];
    return getHabitacionesByDay(selectedDay).map((hab) => ({
      habitacion: hab,
      pagado: getPagoStatus(hab.id),
    }));
  };

  // Navegar meses
  const navigateMonth = (delta: number) => {
    let newMonth = mes + delta;
    let newYear = anio;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    onMonthChange?.(newMonth, newYear);
  };

  // Calcular totales
  const totalOcupadas = habitacionesOcupadas.length;
  const totalPagadas = habitacionesOcupadas.filter((h) => getPagoStatus(h.id)).length;
  const totalPendientes = totalOcupadas - totalPagadas;

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  // Obtener el dia actual
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === mes && today.getFullYear() === anio;
  const currentDay = today.getDate();

  const selectedDayData = getSelectedDayData();

  // Verificar si un dia tiene pagos pendientes o pagados
  const getDayStatus = (day: number) => {
    const habsDelDia = getHabitacionesByDay(day);
    if (habsDelDia.length === 0) return { hasPayments: false, pagadas: 0, pendientes: 0 };

    const pagadas = habsDelDia.filter((h) => getPagoStatus(h.id)).length;
    const pendientes = habsDelDia.length - pagadas;
    return { hasPayments: true, pagadas, pendientes };
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-semibold text-lg">
          {getMonthName(mes)} {anio}
        </h3>
        <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Indicadores */}
      <div className="p-3 bg-gray-50 border-b flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span className="text-green-700 font-medium">Pagado ({totalPagadas})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-pink-100 border border-pink-300"></div>
          <span className="text-pink-700 font-medium">Pendiente ({totalPendientes})</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="p-4">
        {/* Dias de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Dias del mes */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espacios vacios antes del primer dia */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

          {/* Dias */}
          {days.map((day) => {
            const isToday = isCurrentMonth && day === currentDay;
            const isSelected = day === selectedDay;
            const dayStatus = getDayStatus(day);

            // Determinar color de fondo segun estado
            const getBgColor = () => {
              if (!dayStatus.hasPayments) return '';
              if (dayStatus.pendientes > 0 && dayStatus.pagadas > 0) {
                // Tiene ambos: fondo amarillo/naranja
                return 'bg-amber-100 hover:bg-amber-200';
              }
              if (dayStatus.pendientes > 0) {
                // Solo pendientes: fondo rosa
                return 'bg-pink-100 hover:bg-pink-200';
              }
              // Solo pagados: fondo verde
              return 'bg-green-100 hover:bg-green-200';
            };

            const getTextColor = () => {
              if (!dayStatus.hasPayments) return isToday ? 'text-primary-600' : 'text-gray-700';
              if (dayStatus.pendientes > 0 && dayStatus.pagadas > 0) return 'text-amber-800';
              if (dayStatus.pendientes > 0) return 'text-pink-800';
              return 'text-green-800';
            };

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`
                  aspect-square rounded-lg text-sm font-medium transition-all
                  flex flex-col items-center justify-center relative
                  ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                  ${isSelected ? 'ring-2 ring-gray-400' : ''}
                  ${dayStatus.hasPayments ? getBgColor() : 'hover:bg-gray-100'}
                `}
              >
                <span className={`font-semibold ${getTextColor()}`}>{day}</span>

                {/* Contador de pagos del dia */}
                {dayStatus.hasPayments && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayStatus.pagadas > 0 && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-200 px-1 rounded">
                        {dayStatus.pagadas}
                      </span>
                    )}
                    {dayStatus.pendientes > 0 && (
                      <span className="text-[10px] font-bold text-pink-600 bg-pink-200 px-1 rounded">
                        {dayStatus.pendientes}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del dia seleccionado */}
      {selectedDay && (
        <div className="border-t p-4">
          <h4 className="font-medium text-sm text-gray-600 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Pagos del dia {selectedDay}:
          </h4>

          {selectedDayData.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pagos programados para este dia</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDayData.map(({ habitacion, pagado }) => (
                <div
                  key={habitacion.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    pagado
                      ? 'bg-green-50 border-green-200'
                      : 'bg-pink-50 border-pink-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${pagado ? 'text-green-600' : 'text-pink-600'}`} />
                    <div>
                      <p className="text-sm font-medium">
                        Hab. {habitacion.codigo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {habitacion.nombreInquilino || 'Sin inquilino'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      pagado
                        ? 'bg-green-200 text-green-800'
                        : 'bg-pink-200 text-pink-800'
                    }`}
                  >
                    {pagado ? 'PAGADO' : 'PENDIENTE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer con lista de pendientes */}
      {totalPendientes > 0 && (
        <div className="border-t p-3 bg-pink-50">
          <p className="text-xs text-pink-700 font-medium mb-2">Pendientes de pago:</p>
          <div className="flex flex-wrap gap-1">
            {habitacionesOcupadas
              .filter((h) => !getPagoStatus(h.id))
              .map((h) => (
                <span
                  key={h.id}
                  className="text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded cursor-pointer hover:bg-pink-200"
                  title={`${h.nombreInquilino} - Dia ${h.diaPago}`}
                  onClick={() => setSelectedDay(h.diaPago || null)}
                >
                  {h.codigo} (dia {h.diaPago})
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
