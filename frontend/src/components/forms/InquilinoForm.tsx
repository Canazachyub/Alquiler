import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Camera } from 'lucide-react';
import { cn } from '@/utils/cn';
import { CapturaDni, type CapturaDniValue } from './CapturaDni';
import type { InquilinoInput, Habitacion, HabitacionConDetalles } from '@/types';

interface InquilinoFormProps {
  habitaciones: (Habitacion | HabitacionConDetalles)[];
  initialData?: Partial<InquilinoInput>;
  /** Enlaces de DNI ya archivados, cuando se edita un inquilino existente. */
  dniUrls?: { frente?: string; reverso?: string };
  /** Ciudad y edificio seleccionados en el header, para dar contexto al alta. */
  contexto?: { ciudad?: string | null; edificio?: string | null };
  onSubmit: (data: InquilinoInput, fotosDni: CapturaDniValue) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InquilinoForm({
  habitaciones,
  initialData,
  dniUrls,
  contexto,
  onSubmit,
  onCancel,
  isLoading = false,
}: InquilinoFormProps) {
  const [fotosDni, setFotosDni] = useState<CapturaDniValue>({});
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

  // Agrupar por edificio: los codigos (B2, D1) se repiten entre edificios,
  // asi que sin el agrupado no hay forma de saber a cual se esta asignando.
  const gruposPorEdificio = useMemo(() => {
    const grupos = new Map<string, (Habitacion | HabitacionConDetalles)[]>();
    habitacionesDisponibles.forEach((hab) => {
      const nombre = (hab as HabitacionConDetalles).edificioNombre || 'Sin edificio';
      const actual = grupos.get(nombre);
      if (actual) actual.push(hab);
      else grupos.set(nombre, [hab]);
    });
    return Array.from(grupos.entries());
  }, [habitacionesDisponibles]);

  const etiquetaHabitacion = (hab: Habitacion | HabitacionConDetalles) => {
    const pisoNum = hab.piso?.numero ?? (hab as HabitacionConDetalles).pisoNumero;
    return pisoNum ? `${hab.codigo} — Piso ${pisoNum}` : hab.codigo;
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, fotosDni))} className="space-y-5">
      {/* Contexto: donde se esta registrando */}
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl border p-3',
          contexto?.edificio
            ? 'border-primary-200 bg-primary-50/50'
            : 'border-amber-200 bg-amber-50/50'
        )}
      >
        <MapPin
          className={cn(
            'w-4 h-4 mt-0.5 shrink-0',
            contexto?.edificio ? 'text-primary-600' : 'text-amber-600'
          )}
        />
        {contexto?.edificio ? (
          <p className="text-sm text-slate-700">
            Registrando en{' '}
            <span className="font-semibold">
              {contexto.ciudad ? `${contexto.ciudad} · ` : ''}
              {contexto.edificio}
            </span>
          </p>
        ) : (
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Sin edificio seleccionado.</span> El selector lista
            habitaciones de todos los edificios; elegí uno en el filtro superior para acotarlo.
          </p>
        )}
      </div>

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
              {gruposPorEdificio.length > 1
                ? gruposPorEdificio.map(([edificio, habs]) => (
                    <optgroup key={edificio} label={edificio}>
                      {habs.map((hab) => (
                        <option key={hab.id} value={hab.id}>
                          {etiquetaHabitacion(hab)}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : habitacionesDisponibles.map((hab) => (
                    <option key={hab.id} value={hab.id}>
                      {etiquetaHabitacion(hab)}
                    </option>
                  ))}
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

      {/* Documento de identidad */}
      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4 h-4 text-slate-400" />
          <p className="fieldset-title">Documento de identidad</p>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Las fotos se archivan de forma privada en Drive, dentro de la carpeta del inquilino.
        </p>
        <CapturaDni
          value={fotosDni}
          onChange={setFotosDni}
          urlFrenteGuardada={dniUrls?.frente}
          urlReversoGuardada={dniUrls?.reverso}
          disabled={isLoading}
        />
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
