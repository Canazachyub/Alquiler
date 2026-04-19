import { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
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

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener el dia actual
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === mes && today.getFullYear() === anio;
  const currentDay = today.getDate();

  const selectedDayData = getSelectedDayData();

  // Verificar si un dia tiene pagos pendientes o pagados
  const getDayStatus = (day: number) => {
    const habsDelDia = getHabitacionesByDay(day);
    if (habsDelDia.length === 0) {
      return { hasPayments: false, pagadas: 0, pendientes: 0, habs: habsDelDia };
    }

    const pagadas = habsDelDia.filter((h) => getPagoStatus(h.id)).length;
    const pendientes = habsDelDia.length - pagadas;
    return { hasPayments: true, pagadas, pendientes, habs: habsDelDia };
  };

  // Determinar día de la semana (0 = domingo, 6 = sábado)
  const getWeekday = (day: number) => new Date(anio, mes - 1, day).getDay();

  return (
    <div className="card">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="text-base font-semibold text-slate-900">
          {getMonthName(mes)} {anio}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Indicadores */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium tabular-nums">Pagado ({totalPagadas})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-700 font-medium tabular-nums">Pendiente ({totalPendientes})</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="p-4">
        {/* Dias de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-semibold text-slate-500 normal-case py-1"
            >
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
            const weekday = getWeekday(day);
            const isWeekend = weekday === 0 || weekday === 6;

            // Fondo del día según estado de pagos
            const bgClass = !dayStatus.hasPayments
              ? isWeekend
                ? 'bg-slate-50/60 hover:bg-slate-50'
                : 'bg-white hover:bg-slate-50'
              : dayStatus.pendientes > 0 && dayStatus.pagadas > 0
                ? 'bg-amber-50 hover:bg-amber-100'
                : dayStatus.pendientes > 0
                  ? 'bg-red-50 hover:bg-red-100'
                  : 'bg-emerald-50 hover:bg-emerald-100';

            const textColor = !dayStatus.hasPayments
              ? 'text-slate-700'
              : dayStatus.pendientes > 0 && dayStatus.pagadas > 0
                ? 'text-amber-800'
                : dayStatus.pendientes > 0
                  ? 'text-red-700'
                  : 'text-emerald-700';

            const totalDots = dayStatus.habs.length;
            const visibleDots = Math.min(totalDots, 5);
            const overflow = totalDots - visibleDots;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={cn(
                  'aspect-square rounded-lg text-sm font-medium transition-all',
                  'flex flex-col items-center justify-center relative',
                  bgClass,
                  isToday && 'ring-2 ring-primary-500 ring-inset',
                  isSelected && !isToday && 'ring-2 ring-slate-400 ring-inset'
                )}
              >
                <span className={cn('font-semibold tabular-nums', textColor)}>{day}</span>

                {/* Dots de pagos */}
                {dayStatus.hasPayments && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayStatus.habs.slice(0, 5).map((h, idx) => {
                      const pagado = getPagoStatus(h.id);
                      return (
                        <span
                          key={`${h.id}-${idx}`}
                          className={cn(
                            'w-1 h-1 rounded-full',
                            pagado ? 'bg-emerald-500' : 'bg-red-500'
                          )}
                        />
                      );
                    })}
                    {overflow > 0 && (
                      <span className="tabular-nums text-[10px] text-slate-500 ml-0.5">
                        +{overflow}
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
        <div className="border-t border-slate-200 p-4 shadow-popover rounded-xl">
          <h4 className="font-medium text-sm text-slate-600 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Pagos del dia {selectedDay}:
          </h4>

          {selectedDayData.length === 0 ? (
            <p className="text-sm text-slate-500">No hay pagos programados para este dia</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDayData.map(({ habitacion, pagado }) => (
                <div
                  key={habitacion.id}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg border',
                    pagado ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className={cn('w-4 h-4', pagado ? 'text-emerald-600' : 'text-red-600')} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Hab. {habitacion.codigo}</p>
                      <p className="text-xs text-slate-500">
                        {habitacion.nombreInquilino || 'Sin inquilino'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full',
                      pagado
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    )}
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
        <div className="border-t border-slate-200 p-3 bg-red-50">
          <p className="text-xs text-red-700 font-medium mb-2">Pendientes de pago:</p>
          <div className="flex flex-wrap gap-1">
            {habitacionesOcupadas
              .filter((h) => !getPagoStatus(h.id))
              .map((h) => (
                <span
                  key={h.id}
                  className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded cursor-pointer hover:bg-red-200"
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
