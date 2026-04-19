import { useForm } from 'react-hook-form';
import { cn } from '@/utils/cn';
import type { InquilinoInput, Habitacion, HabitacionConDetalles } from '@/types';

interface InquilinoFormProps {
  habitaciones: (Habitacion | HabitacionConDetalles)[];
  initialData?: Partial<InquilinoInput>;
  onSubmit: (data: InquilinoInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InquilinoForm({
  habitaciones,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: InquilinoFormProps) {
  // Coerciones defensivas: Google Sheets a veces devuelve numeros o strings para flags/documentos
  const toStr = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
  const toBool = (v: unknown): boolean => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.trim().toUpperCase();
      return s === 'TRUE' || s === 'SI' || s === '1';
    }
    return Boolean(v);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquilinoInput>({
    defaultValues: {
      habitacionId: toStr(initialData?.habitacionId),
      nombre: toStr(initialData?.nombre),
      apellido: toStr(initialData?.apellido),
      dni: toStr(initialData?.dni),
      telefono: toStr(initialData?.telefono),
      email: toStr(initialData?.email),
      fechaIngreso: toStr(initialData?.fechaIngreso).split('T')[0] || new Date().toISOString().split('T')[0],
      contactoEmergencia: toStr(initialData?.contactoEmergencia),
      telefonoEmergencia: toStr(initialData?.telefonoEmergencia),
      observaciones: toStr(initialData?.observaciones),
      garantia: toBool(initialData?.garantia),
      llaveHabitacion: toBool(initialData?.llaveHabitacion),
      llavePuertaCalle: toBool(initialData?.llavePuertaCalle),
    },
  });

  // Filtrar habitaciones vacantes o la habitación actual del inquilino
  const habitacionesDisponibles = habitaciones.filter(
    (h) => h.estado === 'vacant' || h.id === initialData?.habitacionId
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Datos Personales */}
      <div className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
        <p className="fieldset-title mb-3">Datos personales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="label">Nombre *</label>
            <input
              {...register('nombre', { required: 'Ingrese el nombre' })}
              className={cn('input', errors.nombre && 'input-error')}
              placeholder="Nombre"
            />
            {errors.nombre && <p className="form-error">{errors.nombre.message}</p>}
          </div>

          {/* Apellido */}
          <div>
            <label className="label">Apellido *</label>
            <input
              {...register('apellido', { required: 'Ingrese el apellido' })}
              className={cn('input', errors.apellido && 'input-error')}
              placeholder="Apellido"
            />
            {errors.apellido && <p className="form-error">{errors.apellido.message}</p>}
          </div>

          {/* DNI */}
          <div>
            <label className="label">DNI *</label>
            <input
              {...register('dni', {
                required: 'Ingrese el DNI',
                pattern: { value: /^\d{8}$/, message: 'DNI debe tener 8 dígitos' },
              })}
              className={cn('input', errors.dni && 'input-error')}
              placeholder="12345678"
              maxLength={8}
            />
            {errors.dni && <p className="form-error">{errors.dni.message}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="label">Teléfono *</label>
            <input
              {...register('telefono', {
                required: 'Ingrese el teléfono',
                pattern: {
                  value: /^9\d{8}$/,
                  message: 'Teléfono debe empezar con 9 y tener 9 dígitos',
                },
              })}
              className={cn('input', errors.telefono && 'input-error')}
              placeholder="987654321"
              maxLength={9}
            />
            {errors.telefono && <p className="form-error">{errors.telefono.message}</p>}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="label">Email</label>
            <input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email no válido',
                },
              })}
              className={cn('input', errors.email && 'input-error')}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
        </div>
      </div>

      {/* Contrato */}
      <div className="border-t border-slate-200 pt-5">
        <p className="fieldset-title mb-3">Contrato</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Habitación */}
          <div className="md:col-span-2">
            <label className="label">Habitación *</label>
            <select
              {...register('habitacionId', { required: 'Seleccione una habitación' })}
              className={cn('select', errors.habitacionId && 'input-error')}
            >
              <option value="">Seleccionar habitación</option>
              {habitacionesDisponibles.map((hab) => {
                const pisoNum = hab.piso?.numero || (hab as HabitacionConDetalles).pisoNumero;
                return (
                  <option key={hab.id} value={hab.id}>
                    {hab.codigo}{pisoNum ? ` - Piso ${pisoNum}` : ''}
                  </option>
                );
              })}
            </select>
            {errors.habitacionId && <p className="form-error">{errors.habitacionId.message}</p>}
          </div>

          {/* Fecha de Ingreso */}
          <div className="md:col-span-2">
            <label className="label">Fecha de Ingreso *</label>
            <input
              type="date"
              {...register('fechaIngreso', { required: 'Seleccione la fecha' })}
              className={cn('input', errors.fechaIngreso && 'input-error')}
            />
            {errors.fechaIngreso && <p className="form-error">{errors.fechaIngreso.message}</p>}
          </div>

          {/* Garantia */}
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              {...register('garantia')}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-slate-700">Garantía</span>
              <p className="text-xs text-slate-500">Se entregó garantía</p>
            </div>
          </label>

          {/* Llave Habitacion */}
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              {...register('llaveHabitacion')}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-slate-700">Llave habitación</span>
              <p className="text-xs text-slate-500">Se entregó llave</p>
            </div>
          </label>

          {/* Llave Puerta Calle */}
          <label className="md:col-span-2 flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              {...register('llavePuertaCalle')}
              className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-slate-700">Llave puerta de calle</span>
              <p className="text-xs text-slate-500">Llave de ingreso</p>
            </div>
          </label>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="border-t border-slate-200 pt-5">
        <p className="fieldset-title mb-3">Contacto de emergencia</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input
              {...register('contactoEmergencia')}
              className="input"
              placeholder="Nombre del contacto"
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              {...register('telefonoEmergencia')}
              className="input"
              placeholder="987654321"
            />
          </div>
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
