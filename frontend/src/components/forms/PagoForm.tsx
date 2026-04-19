import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/utils/cn';
import type { PagoInput, HabitacionConDetalles } from '@/types';
import { METODOS_PAGO, CONCEPTOS_PAGO, MESES } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

interface PagoFormProps {
  habitaciones: HabitacionConDetalles[];
  mesActual: number;
  anioActual: number;
  initialData?: Partial<PagoInput>;
  onSubmit: (data: PagoInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PagoForm({
  habitaciones,
  mesActual,
  anioActual,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: PagoFormProps) {
  // Fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PagoInput>({
    defaultValues: {
      habitacionId: initialData?.habitacionId || '',
      fecha: initialData?.fecha || today,
      mes: initialData?.mes || mesActual,
      anio: initialData?.anio || anioActual,
      concepto: initialData?.concepto || 'alquiler',
      monto: initialData?.monto || 0,
      metodoPago: initialData?.metodoPago || 'efectivo',
      referencia: initialData?.referencia || '',
      observaciones: initialData?.observaciones || '',
    },
  });

  const selectedHabitacionId = watch('habitacionId');
  const selectedConcepto = watch('concepto');

  // Obtener la habitación seleccionada
  const habitacionSeleccionada = habitaciones.find((h) => h.id === selectedHabitacionId);

  // Auto-completar monto al montar con habitación preseleccionada
  useEffect(() => {
    if (initialData?.habitacionId && habitacionSeleccionada && !initialData?.monto) {
      const concepto = initialData?.concepto || 'alquiler';
      if (concepto === 'alquiler') {
        setValue('monto', habitacionSeleccionada.montoAlquiler);
      } else if (concepto === 'internet') {
        setValue('monto', habitacionSeleccionada.montoInternet);
      }
    }
  }, [initialData, habitacionSeleccionada, setValue]);

  // Auto-completar monto según concepto
  const handleHabitacionChange = (habitacionId: string) => {
    const hab = habitaciones.find((h) => h.id === habitacionId);
    if (hab) {
      if (selectedConcepto === 'alquiler') {
        setValue('monto', hab.montoAlquiler);
      } else if (selectedConcepto === 'internet') {
        setValue('monto', hab.montoInternet);
      }
    }
  };

  const handleConceptoChange = (concepto: string) => {
    if (habitacionSeleccionada) {
      if (concepto === 'alquiler') {
        setValue('monto', habitacionSeleccionada.montoAlquiler);
      } else if (concepto === 'internet') {
        setValue('monto', habitacionSeleccionada.montoInternet);
      }
    }
  };

  // Filtrar solo habitaciones ocupadas
  const habitacionesOcupadas = habitaciones.filter((h) => h.estado === 'occupied');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Concepto */}
      <div className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
        <p className="fieldset-title mb-3">Concepto</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Habitación */}
          <div className="md:col-span-2">
            <label className="label">Habitación *</label>
            <select
              {...register('habitacionId', { required: 'Seleccione una habitación' })}
              className={cn('select', errors.habitacionId && 'input-error')}
              onChange={(e) => handleHabitacionChange(e.target.value)}
            >
              <option value="">Seleccionar habitación</option>
              {habitacionesOcupadas.map((hab) => (
                <option key={hab.id} value={hab.id}>
                  {hab.codigo} - {hab.nombreInquilino} ({formatCurrency(hab.montoAlquiler)})
                </option>
              ))}
            </select>
            {errors.habitacionId && <p className="form-error">{errors.habitacionId.message}</p>}
          </div>

          {/* Concepto */}
          <div>
            <label className="label">Concepto *</label>
            <select
              {...register('concepto')}
              className="select"
              onChange={(e) => handleConceptoChange(e.target.value)}
            >
              {CONCEPTOS_PAGO.map((concepto) => (
                <option key={concepto.value} value={concepto.value}>
                  {concepto.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <label className="label">Mes del Pago *</label>
            <select {...register('mes', { valueAsNumber: true })} className="select">
              {MESES.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div className="md:col-span-2">
            <label className="label">Año del Pago *</label>
            <select {...register('anio', { valueAsNumber: true })} className="select">
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monto y método */}
      <div className="border-t border-slate-200 pt-5">
        <p className="fieldset-title mb-3">Monto y método</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monto */}
          <div>
            <label className="label">Monto (S/) *</label>
            <input
              type="number"
              step="0.01"
              {...register('monto', {
                required: 'Ingrese el monto',
                min: { value: 0.01, message: 'Debe ser mayor a 0' },
                valueAsNumber: true,
              })}
              className={cn('input tabular-nums', errors.monto && 'input-error')}
            />
            {errors.monto && <p className="form-error">{errors.monto.message}</p>}
          </div>

          {/* Método de Pago */}
          <div>
            <label className="label">Método de Pago *</label>
            <select {...register('metodoPago')} className="select">
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo.value} value={metodo.value}>
                  {metodo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="label">Fecha de Pago *</label>
            <input
              type="date"
              {...register('fecha', { required: 'Ingrese la fecha de pago' })}
              className={cn('input', errors.fecha && 'input-error')}
            />
            {errors.fecha && <p className="form-error">{errors.fecha.message}</p>}
          </div>

          {/* Referencia */}
          <div>
            <label className="label">Referencia / Voucher</label>
            <input
              {...register('referencia')}
              className="input"
              placeholder="Número de operación"
            />
          </div>

          {/* Observaciones */}
          <div className="md:col-span-2">
            <label className="label">Observaciones</label>
            <textarea
              {...register('observaciones')}
              className="input"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </div>

      {/* Info de la habitación seleccionada */}
      {habitacionSeleccionada && (
        <div className="bg-slate-50 p-3.5 rounded-xl text-sm border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="text-slate-500 font-medium">Alquiler:</span>{' '}
              <span className="font-semibold tabular-nums">
                {formatCurrency(habitacionSeleccionada.montoAlquiler)}
              </span>
              {habitacionSeleccionada.alquilerPagado ? (
                <span className="text-emerald-600 ml-2 font-semibold text-xs">Pagado</span>
              ) : (
                <span className="text-red-600 ml-2 font-semibold text-xs">Pendiente</span>
              )}
            </div>
            <div>
              <span className="text-slate-500 font-medium">Internet:</span>{' '}
              <span className="font-semibold tabular-nums">
                {formatCurrency(habitacionSeleccionada.montoInternet)}
              </span>
              {habitacionSeleccionada.internetPagado ? (
                <span className="text-emerald-600 ml-2 font-semibold text-xs">Pagado</span>
              ) : (
                <span className="text-red-600 ml-2 font-semibold text-xs">Pendiente</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-5 border-t border-slate-200 mt-6">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrar Pago'}
        </button>
      </div>
    </form>
  );
}
