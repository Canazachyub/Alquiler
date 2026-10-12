import { useForm } from 'react-hook-form';
import { Home, UserRound, Wrench, BadgeCheck, Wifi, WifiOff, AlertTriangle, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { EstadoHabitacion, HabitacionInput, Piso } from '@/types';
import { UBICACIONES_HABITACION } from '@/utils/constants';

interface HabitacionFormProps {
  pisos: Piso[];
  initialData?: Partial<HabitacionInput>;
  /** Nombre del inquilino activo, para avisar si se intenta dejar el cuarto vacante */
  inquilinoActivo?: string;
  onSubmit: (data: HabitacionInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Interruptor de estado con código de colores (DESIGN.md §2)
const ESTADOS: {
  value: EstadoHabitacion;
  label: string;
  ayuda: string;
  icon: LucideIcon;
  pastilla: string;
  /** Fondo del botón activo en móvil (sin pastilla deslizante) */
  movil: string;
  texto: string;
  fondo: string;
}[] = [
  { value: 'vacant', label: 'Vacante', ayuda: 'Libre, listo para alquilar.', icon: Home, pastilla: 'bg-slate-500', movil: 'max-sm:bg-slate-500', texto: 'text-slate-700', fondo: 'bg-slate-100 border-slate-300' },
  { value: 'occupied', label: 'Ocupado', ayuda: 'Tiene inquilino y se cobra cada mes.', icon: UserRound, pastilla: 'bg-emerald-600', movil: 'max-sm:bg-emerald-600', texto: 'text-emerald-700', fondo: 'bg-emerald-50 border-emerald-300' },
  { value: 'maintenance', label: 'Mantenimiento', ayuda: 'En reparación, no se alquila ni se cobra.', icon: Wrench, pastilla: 'bg-violet-500', movil: 'max-sm:bg-violet-500', texto: 'text-violet-700', fondo: 'bg-violet-50 border-violet-300' },
  { value: 'exonerated', label: 'Exonerado', ayuda: 'Lo usan los propietarios: ocupado pero no se cobra.', icon: BadgeCheck, pastilla: 'bg-olive-500', movil: 'max-sm:bg-olive-500', texto: 'text-olive-700', fondo: 'bg-olive-50 border-olive-500/40' },
];

export function HabitacionForm({
  pisos,
  initialData,
  inquilinoActivo,
  onSubmit,
  onCancel,
  isLoading = false,
}: HabitacionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HabitacionInput>({
    defaultValues: {
      pisoId: initialData?.pisoId || '',
      codigo: initialData?.codigo || '',
      ubicacion: initialData?.ubicacion || 'izquierda',
      montoAlquiler: initialData?.montoAlquiler ?? 150,
      montoInternet: initialData?.montoInternet ?? 0,
      montoServicios: initialData?.montoServicios || 0,
      estado: initialData?.estado || 'vacant',
      observaciones: initialData?.observaciones || '',
      motivoExoneracion: initialData?.motivoExoneracion || '',
    },
  });

  const estado = watch('estado') ?? 'vacant';
  const idx = Math.max(0, ESTADOS.findIndex((e) => e.value === estado));
  const actual = ESTADOS[idx];
  const conInternet = Number(initialData?.montoInternet || 0) > 0;

  const enviar = (data: HabitacionInput) =>
    onSubmit({ ...data, motivoExoneracion: data.estado === 'exonerated' ? data.motivoExoneracion?.trim() : '' });

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-6">
      {/* 1. Identificación */}
      <section>
        <p className="fieldset-title mb-3">Identificación</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Piso *</label>
            <select
              {...register('pisoId', { required: 'Seleccione un piso' })}
              className={cn('select', errors.pisoId && 'input-error')}
            >
              <option value="">Seleccionar piso</option>
              {pisos.map((piso) => (
                <option key={piso.id} value={piso.id}>
                  Piso {piso.numero} {piso.descripcion && piso.descripcion !== `Piso ${piso.numero}` && `- ${piso.descripcion}`}
                </option>
              ))}
            </select>
            {errors.pisoId && <p className="form-error">{errors.pisoId.message}</p>}
          </div>

          <div>
            <label className="label">Código *</label>
            <input
              {...register('codigo', { required: 'Ingrese el código' })}
              className={cn('input font-display font-bold text-base tracking-tight', errors.codigo && 'input-error')}
              placeholder="Ej: A1, B2"
            />
            {errors.codigo && <p className="form-error">{errors.codigo.message}</p>}
          </div>

          <div>
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
      </section>

      {/* 2. Estado: interruptor de colores */}
      <section className="border-t border-slate-200 pt-5">
        <p className="fieldset-title mb-3">Estado</p>
        <input type="hidden" {...register('estado')} />
        <div
          role="radiogroup"
          aria-label="Estado de la habitación"
          className="relative grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200"
        >
          {/* Pastilla deslizante (solo en una fila, desde sm) */}
          <span
            aria-hidden
            className={cn(
              'hidden sm:block absolute top-1 bottom-1 left-1 rounded-xl shadow-elevated transition-all duration-300 ease-out',
              actual.pastilla
            )}
            style={{ width: 'calc((100% - 0.5rem - 0.75rem) / 4)', transform: `translateX(calc(${idx} * (100% + 0.25rem)))` }}
          />
          {ESTADOS.map((e) => {
            const activo = e.value === estado;
            return (
              <button
                key={e.value}
                type="button"
                role="radio"
                aria-checked={activo}
                onClick={() => setValue('estado', e.value, { shouldDirty: true })}
                className={cn(
                  'relative z-10 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-semibold transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  activo ? cn('text-white max-sm:shadow-elevated', e.movil) : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                )}
              >
                <e.icon className="w-4 h-4" />
                {e.label}
              </button>
            );
          })}
        </div>

        {/* Explicación del estado elegido */}
        <div className={cn('mt-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors duration-300', actual.fondo)}>
          <p className={cn('font-semibold flex items-center gap-1.5', actual.texto)}>
            <actual.icon className="w-4 h-4" /> {actual.label}
          </p>
          <p className="text-slate-600 text-xs mt-0.5">{actual.ayuda}</p>

          {estado === 'exonerated' && (
            <div className="mt-2.5">
              <label htmlFor="motivoExoneracion" className="label !mb-1">Motivo de la exoneración *</label>
              <input
                id="motivoExoneracion"
                {...register('motivoExoneracion', {
                  validate: (v) => watch('estado') !== 'exonerated' || !!v?.trim() || 'Indica el motivo',
                })}
                placeholder="Ej. Lo ocupa la familia / depósito propio"
                className={cn('input bg-white', errors.motivoExoneracion && 'input-error')}
                autoFocus
              />
              {errors.motivoExoneracion && <p className="form-error">{errors.motivoExoneracion.message}</p>}
            </div>
          )}

          {inquilinoActivo && (estado === 'vacant' || estado === 'maintenance') && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              {inquilinoActivo} sigue registrado aquí. Para dejar el cuarto libre, dale de baja en la pestaña Inquilino.
            </p>
          )}
          {!inquilinoActivo && estado === 'occupied' && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              No hay inquilino registrado. Regístralo en la pestaña Inquilino para poder cobrarle.
            </p>
          )}
        </div>
      </section>

      {/* 3. Condiciones */}
      <section className="border-t border-slate-200 pt-5">
        <p className="fieldset-title mb-3">Condiciones</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Alquiler mensual (S/) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">S/</span>
              <input
                type="number"
                step="0.01"
                {...register('montoAlquiler', {
                  valueAsNumber: true,
                  required: 'Ingrese el monto',
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                })}
                className={cn('input pl-9 tabular-nums font-semibold', errors.montoAlquiler && 'input-error')}
              />
            </div>
            {errors.montoAlquiler && <p className="form-error">{errors.montoAlquiler.message}</p>}
          </div>

          <div>
            <label className="label">Servicios (S/)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">S/</span>
              <input
                type="number"
                step="0.01"
                {...register('montoServicios', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                })}
                className="input pl-9 tabular-nums"
              />
            </div>
          </div>

          {/* Internet: interruptor de solo lectura; se activa desde la ficha del cuarto */}
          <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
            {conInternet ? <Wifi className="w-4 h-4 text-sky-600" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                Internet {conInternet ? `· S/ ${Number(initialData?.montoInternet).toFixed(2)} al mes` : 'no contratado'}
              </p>
              <p className="text-[11px] text-slate-500">Se activa o quita desde la ficha del cuarto (Habitaciones → Edificio).</p>
            </div>
            <span
              aria-hidden
              className={cn(
                'relative w-10 h-6 rounded-full flex-shrink-0 transition-colors',
                conInternet ? 'bg-sky-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  conInternet && 'translate-x-4'
                )}
              />
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="label">Observaciones</label>
            <textarea
              {...register('observaciones')}
              className="input !h-auto py-2.5"
              rows={2}
              placeholder="Notas adicionales…"
            />
          </div>
        </div>
      </section>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-5 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
