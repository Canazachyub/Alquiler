import { useForm } from 'react-hook-form';
import { cn } from '@/utils/cn';
import type { HabitacionInput, Piso } from '@/types';
import { UBICACIONES_HABITACION, ESTADOS_HABITACION } from '@/utils/constants';

interface HabitacionFormProps {
  pisos: Piso[];
  initialData?: Partial<HabitacionInput>;
  onSubmit: (data: HabitacionInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HabitacionForm({
  pisos,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: HabitacionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HabitacionInput>({
    defaultValues: {
      pisoId: initialData?.pisoId || '',
      codigo: initialData?.codigo || '',
      ubicacion: initialData?.ubicacion || 'izquierda',
      montoAlquiler: initialData?.montoAlquiler || 150,
      montoInternet: initialData?.montoInternet || 20,
      montoServicios: initialData?.montoServicios || 0,
      estado: initialData?.estado || 'vacant',
      observaciones: initialData?.observaciones || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Identificación */}
      <div className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
        <p className="fieldset-title mb-3">Identificación</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Piso */}
          <div>
            <label className="label">Piso *</label>
            <select
              {...register('pisoId', { required: 'Seleccione un piso' })}
              className={cn('select', errors.pisoId && 'input-error')}
            >
              <option value="">Seleccionar piso</option>
              {pisos.map((piso) => (
                <option key={piso.id} value={piso.id}>
                  Piso {piso.numero} {piso.descripcion && `- ${piso.descripcion}`}
                </option>
              ))}
            </select>
            {errors.pisoId && <p className="form-error">{errors.pisoId.message}</p>}
          </div>

          {/* Código */}
          <div>
            <label className="label">Código *</label>
            <input
              {...register('codigo', { required: 'Ingrese el código' })}
              className={cn('input', errors.codigo && 'input-error')}
              placeholder="Ej: A1, B2"
            />
            {errors.codigo && <p className="form-error">{errors.codigo.message}</p>}
          </div>

          {/* Ubicación */}
          <div className="md:col-span-2">
            <label className="label">Ubicación</label>
            <select {...register('ubicacion')} className="select">
              {UBICACIONES_HABITACION.map((ub) => (
                <option key={ub.value} value={ub.value}>
                  {ub.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Condiciones */}
      <div className="border-t border-slate-200 pt-5">
        <p className="fieldset-title mb-3">Condiciones</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monto Alquiler */}
          <div>
            <label className="label">Monto Alquiler (S/) *</label>
            <input
              type="number"
              step="0.01"
              {...register('montoAlquiler', {
                required: 'Ingrese el monto',
                min: { value: 0, message: 'Debe ser mayor o igual a 0' },
              })}
              className={cn('input tabular-nums', errors.montoAlquiler && 'input-error')}
            />
            {errors.montoAlquiler && <p className="form-error">{errors.montoAlquiler.message}</p>}
          </div>

          {/* Monto Internet */}
          <div>
            <label className="label">Monto Internet (S/)</label>
            <input
              type="number"
              step="0.01"
              {...register('montoInternet', {
                min: { value: 0, message: 'Debe ser mayor o igual a 0' },
              })}
              className="input tabular-nums"
            />
          </div>

          {/* Monto Servicios */}
          <div>
            <label className="label">Monto Servicios (S/)</label>
            <input
              type="number"
              step="0.01"
              {...register('montoServicios', {
                min: { value: 0, message: 'Debe ser mayor o igual a 0' },
              })}
              className="input tabular-nums"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="label">Estado</label>
            <select {...register('estado')} className="select">
              {Object.entries(ESTADOS_HABITACION).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div className="md:col-span-2">
            <label className="label">Observaciones</label>
            <textarea
              {...register('observaciones')}
              className="input"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-5 border-t border-slate-200 mt-6">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
