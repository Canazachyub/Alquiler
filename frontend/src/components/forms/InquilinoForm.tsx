import { useForm } from 'react-hook-form';
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InquilinoInput>({
    defaultValues: {
      habitacionId: initialData?.habitacionId || '',
      nombre: initialData?.nombre || '',
      apellido: initialData?.apellido || '',
      dni: initialData?.dni || '',
      telefono: initialData?.telefono || '',
      email: initialData?.email || '',
      fechaIngreso: initialData?.fechaIngreso || new Date().toISOString().split('T')[0],
      contactoEmergencia: initialData?.contactoEmergencia || '',
      telefonoEmergencia: initialData?.telefonoEmergencia || '',
      observaciones: initialData?.observaciones || '',
      garantia: initialData?.garantia || false,
      llaveHabitacion: initialData?.llaveHabitacion || false,
      llavePuertaCalle: initialData?.llavePuertaCalle || false,
    },
  });

  // Filtrar habitaciones vacantes o la habitación actual del inquilino
  const habitacionesDisponibles = habitaciones.filter(
    (h) => h.estado === 'vacant' || h.id === initialData?.habitacionId
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="label">Nombre *</label>
          <input
            {...register('nombre', { required: 'Ingrese el nombre' })}
            className="input"
            placeholder="Nombre"
          />
          {errors.nombre && (
            <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
          )}
        </div>

        {/* Apellido */}
        <div>
          <label className="label">Apellido *</label>
          <input
            {...register('apellido', { required: 'Ingrese el apellido' })}
            className="input"
            placeholder="Apellido"
          />
          {errors.apellido && (
            <p className="text-sm text-red-500 mt-1">{errors.apellido.message}</p>
          )}
        </div>

        {/* DNI */}
        <div>
          <label className="label">DNI *</label>
          <input
            {...register('dni', {
              required: 'Ingrese el DNI',
              pattern: {
                value: /^\d{8}$/,
                message: 'DNI debe tener 8 dígitos',
              },
            })}
            className="input"
            placeholder="12345678"
            maxLength={8}
          />
          {errors.dni && (
            <p className="text-sm text-red-500 mt-1">{errors.dni.message}</p>
          )}
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
            className="input"
            placeholder="987654321"
            maxLength={9}
          />
          {errors.telefono && (
            <p className="text-sm text-red-500 mt-1">{errors.telefono.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            {...register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email no válido',
              },
            })}
            className="input"
            placeholder="correo@ejemplo.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Fecha de Ingreso */}
        <div>
          <label className="label">Fecha de Ingreso *</label>
          <input
            type="date"
            {...register('fechaIngreso', { required: 'Seleccione la fecha' })}
            className="input"
          />
          {errors.fechaIngreso && (
            <p className="text-sm text-red-500 mt-1">{errors.fechaIngreso.message}</p>
          )}
        </div>

        {/* Habitación */}
        <div className="col-span-2">
          <label className="label">Habitación *</label>
          <select
            {...register('habitacionId', { required: 'Seleccione una habitación' })}
            className="select"
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
          {errors.habitacionId && (
            <p className="text-sm text-red-500 mt-1">{errors.habitacionId.message}</p>
          )}
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-700 mb-3">Contacto de Emergencia</h4>
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="label">Observaciones</label>
        <textarea
          {...register('observaciones')}
          className="input"
          rows={3}
          placeholder="Notas adicionales..."
        />
      </div>

      {/* Contrato - Garantia y Llaves */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-700 mb-3">Datos del Contrato</h4>
        <div className="grid grid-cols-3 gap-4">
          {/* Garantia */}
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              {...register('garantia')}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-700">Garantia</span>
              <p className="text-xs text-gray-500">Se entrego garantia</p>
            </div>
          </label>

          {/* Llave Habitacion */}
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              {...register('llaveHabitacion')}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-700">Llave Habitacion</span>
              <p className="text-xs text-gray-500">Se entrego llave</p>
            </div>
          </label>

          {/* Llave Puerta Calle */}
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              {...register('llavePuertaCalle')}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-700">Llave Puerta</span>
              <p className="text-xs text-gray-500">Llave de calle</p>
            </div>
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
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
