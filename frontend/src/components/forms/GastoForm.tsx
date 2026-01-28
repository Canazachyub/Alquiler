import { useForm } from 'react-hook-form';
import type { GastoInput, Edificio, Habitacion } from '@/types';
import { CATEGORIAS_GASTO } from '@/utils/constants';

interface GastoFormProps {
  edificios: Edificio[];
  habitaciones: Habitacion[];
  initialData?: Partial<GastoInput>;
  onSubmit: (data: GastoInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GastoForm({
  edificios,
  habitaciones,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: GastoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GastoInput>({
    defaultValues: {
      edificioId: initialData?.edificioId || '',
      habitacionId: initialData?.habitacionId || '',
      fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
      concepto: initialData?.concepto || '',
      categoria: initialData?.categoria || 'mantenimiento',
      monto: initialData?.monto || 0,
      comprobanteUrl: initialData?.comprobanteUrl || '',
      observaciones: initialData?.observaciones || '',
    },
  });

  const selectedEdificioId = watch('edificioId');

  // Filtrar habitaciones por edificio seleccionado
  const habitacionesFiltradas = selectedEdificioId
    ? habitaciones.filter((h) => h.piso?.edificio?.id === selectedEdificioId)
    : habitaciones;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Edificio */}
        <div>
          <label className="label">Edificio *</label>
          <select
            {...register('edificioId', { required: 'Seleccione un edificio' })}
            className="select"
          >
            <option value="">Seleccionar edificio</option>
            {edificios.map((edificio) => (
              <option key={edificio.id} value={edificio.id}>
                {edificio.nombre}
              </option>
            ))}
          </select>
          {errors.edificioId && (
            <p className="text-sm text-red-500 mt-1">{errors.edificioId.message}</p>
          )}
        </div>

        {/* Habitación (opcional) */}
        <div>
          <label className="label">Habitación (opcional)</label>
          <select {...register('habitacionId')} className="select">
            <option value="">Gasto general</option>
            {habitacionesFiltradas.map((hab) => (
              <option key={hab.id} value={hab.id}>
                {hab.codigo}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="label">Fecha *</label>
          <input
            type="date"
            {...register('fecha', { required: 'Seleccione la fecha' })}
            className="input"
          />
          {errors.fecha && (
            <p className="text-sm text-red-500 mt-1">{errors.fecha.message}</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="label">Categoría *</label>
          <select {...register('categoria')} className="select">
            {CATEGORIAS_GASTO.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Concepto */}
        <div className="col-span-2">
          <label className="label">Concepto *</label>
          <input
            {...register('concepto', { required: 'Ingrese el concepto' })}
            className="input"
            placeholder="Descripción del gasto"
          />
          {errors.concepto && (
            <p className="text-sm text-red-500 mt-1">{errors.concepto.message}</p>
          )}
        </div>

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
            className="input"
          />
          {errors.monto && (
            <p className="text-sm text-red-500 mt-1">{errors.monto.message}</p>
          )}
        </div>

        {/* URL Comprobante */}
        <div>
          <label className="label">URL Comprobante</label>
          <input
            {...register('comprobanteUrl')}
            className="input"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="label">Observaciones</label>
        <textarea
          {...register('observaciones')}
          className="input"
          rows={2}
          placeholder="Notas adicionales..."
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Gasto'}
        </button>
      </div>
    </form>
  );
}
