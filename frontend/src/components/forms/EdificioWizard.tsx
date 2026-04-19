import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Building2, Layers, DoorOpen, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Ciudad } from '@/types';
import type { PisoConfig } from '@/api/edificios.api';
import { formatCurrency } from '@/utils/formatters';

interface EdificioWizardData {
  // Paso 1: Datos del edificio
  ciudadId: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  // Paso 2: Configuración de pisos
  pisos: PisoConfig[];
}

interface EdificioWizardProps {
  ciudades: Ciudad[];
  onSubmit: (data: { edificio: Omit<EdificioWizardData, 'pisos'>; pisos: PisoConfig[] }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const STEPS = [
  { id: 1, name: 'Datos del Edificio', icon: Building2 },
  { id: 2, name: 'Configurar Pisos', icon: Layers },
  { id: 3, name: 'Confirmar', icon: Check },
];

export function EdificioWizard({ ciudades, onSubmit, onCancel, isLoading }: EdificioWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const { register, control, handleSubmit, watch, formState: { errors }, trigger } = useForm<EdificioWizardData>({
    defaultValues: {
      ciudadId: '',
      nombre: '',
      descripcion: '',
      direccion: '',
      pisos: [{ numero: 1, descripcion: '', cantidadHabitaciones: 2, montoAlquiler: 150, montoInternet: 20, montoServicios: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pisos',
  });

  const watchedData = watch();

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(['ciudadId', 'nombre', 'direccion']);
    } else if (currentStep === 2) {
      isValid = await trigger('pisos');
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onFormSubmit = (data: EdificioWizardData) => {
    const { pisos, ...edificioData } = data;
    onSubmit({ edificio: edificioData, pisos });
  };

  const addPiso = () => {
    const lastPiso = fields[fields.length - 1];
    append({
      numero: fields.length + 1,
      descripcion: '',
      cantidadHabitaciones: lastPiso?.cantidadHabitaciones || 2,
      montoAlquiler: lastPiso?.montoAlquiler || 150,
      montoInternet: lastPiso?.montoInternet || 20,
      montoServicios: lastPiso?.montoServicios || 0,
    });
  };

  const totalHabitaciones = watchedData.pisos?.reduce((sum, p) => sum + (p.cantidadHabitaciones || 0), 0) || 0;
  const ingresoMensualEstimado = watchedData.pisos?.reduce(
    (sum, p) => sum + (p.cantidadHabitaciones || 0) * ((p.montoAlquiler || 0) + (p.montoInternet || 0)),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {STEPS.map((step, stepIdx) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <li key={step.id} className={`relative ${stepIdx !== STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex items-center">
                  <div
                    className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-primary-600 text-white',
                      isCompleted && 'bg-primary-100 text-primary-700',
                      !isActive && !isCompleted && 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div
                      className={cn(
                        'ml-4 h-0.5 flex-1',
                        isCompleted ? 'bg-primary-600' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'absolute -bottom-6 left-0 w-max text-xs',
                    currentStep >= step.id ? 'text-primary-600 font-medium' : 'text-slate-500'
                  )}
                >
                  {step.name}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-10">
        {/* Paso 1: Datos del Edificio */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
              <p className="fieldset-title mb-3">Datos del edificio</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ciudad *</label>
                  <select
                    {...register('ciudadId', { required: 'Seleccione una ciudad' })}
                    className={cn('select', errors.ciudadId && 'input-error')}
                  >
                    <option value="">Seleccionar ciudad...</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad.id} value={ciudad.id}>
                        {ciudad.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.ciudadId && <p className="form-error">{errors.ciudadId.message}</p>}
                </div>

                <div>
                  <label className="label">Nombre del Edificio *</label>
                  <input
                    {...register('nombre', { required: 'Ingrese el nombre' })}
                    className={cn('input', errors.nombre && 'input-error')}
                    placeholder="Ej: Edificio Los Rosales"
                  />
                  {errors.nombre && <p className="form-error">{errors.nombre.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Dirección *</label>
                  <input
                    {...register('direccion', { required: 'Ingrese la direccion' })}
                    className={cn('input', errors.direccion && 'input-error')}
                    placeholder="Ej: Jr. Lima 123"
                  />
                  {errors.direccion && <p className="form-error">{errors.direccion.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Descripción</label>
                  <textarea
                    {...register('descripcion')}
                    className="input"
                    rows={2}
                    placeholder="Descripción breve del edificio..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Configurar Pisos */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Configurar Pisos</h3>
              <button type="button" onClick={addPiso} className="btn btn-outline btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Agregar Piso
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Configure cada piso con la cantidad de habitaciones y los montos base.
            </p>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2 text-slate-900">
                      <Layers className="w-4 h-4 text-primary-600" />
                      Piso {index + 1}
                    </h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input type="hidden" {...register(`pisos.${index}.numero`)} value={index + 1} />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Habitaciones *</label>
                      <input
                        type="number"
                        {...register(`pisos.${index}.cantidadHabitaciones`, {
                          required: true,
                          min: 1,
                          valueAsNumber: true,
                        })}
                        className="input tabular-nums"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Alquiler (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`pisos.${index}.montoAlquiler`, { valueAsNumber: true })}
                        className="input tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Internet (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`pisos.${index}.montoInternet`, { valueAsNumber: true })}
                        className="input tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Servicios (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`pisos.${index}.montoServicios`, { valueAsNumber: true })}
                        className="input tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="bg-primary-50 rounded-xl p-4 mt-4 border border-primary-100">
              <h4 className="font-semibold text-primary-900 mb-2">Resumen</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Total de pisos:</span>
                  <span className="ml-2 font-semibold tabular-nums">{fields.length}</span>
                </div>
                <div>
                  <span className="text-slate-600">Total de habitaciones:</span>
                  <span className="ml-2 font-semibold tabular-nums">{totalHabitaciones}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-600">Ingreso mensual estimado (100% ocupación):</span>
                  <span className="ml-2 font-semibold text-emerald-600 tabular-nums">{formatCurrency(ingresoMensualEstimado)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paso 3: Confirmar */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Confirmar creación</h3>

            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-200">
              {/* Datos del edificio */}
              <div>
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  Edificio
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Nombre:</span>
                    <span className="ml-2 font-medium">{watchedData.nombre}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ciudad:</span>
                    <span className="ml-2 font-medium">
                      {ciudades.find((c) => c.id === watchedData.ciudadId)?.nombre}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Dirección:</span>
                    <span className="ml-2">{watchedData.direccion}</span>
                  </div>
                  {watchedData.descripcion && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Descripción:</span>
                      <span className="ml-2">{watchedData.descripcion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pisos y habitaciones */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4" />
                  Pisos y habitaciones
                </h4>
                <div className="space-y-2">
                  {watchedData.pisos?.map((piso, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg border border-slate-200">
                      <span>
                        <span className="font-semibold">Piso {idx + 1}</span>
                        <span className="text-slate-500 ml-2">
                          ({piso.cantidadHabitaciones} hab.)
                        </span>
                      </span>
                      <span className="text-slate-600 tabular-nums">
                        Alq: {formatCurrency(piso.montoAlquiler)} | Int: {formatCurrency(piso.montoInternet)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                  <DoorOpen className="w-4 h-4" />
                  Resumen final
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-2xl font-bold text-primary-600 tabular-nums">{fields.length}</p>
                    <p className="text-xs text-slate-500">Pisos</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-2xl font-bold text-primary-600 tabular-nums">{totalHabitaciones}</p>
                    <p className="text-xs text-slate-500">Habitaciones</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(ingresoMensualEstimado)}</p>
                    <p className="text-xs text-slate-500">Ingreso est./mes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between pt-5 border-t border-slate-200 mt-6">
          <div>
            {currentStep > 1 ? (
              <button type="button" onClick={prevStep} className="btn btn-outline">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </button>
            ) : (
              <button type="button" onClick={onCancel} className="btn btn-outline">
                Cancelar
              </button>
            )}
          </div>
          <div>
            {currentStep < 3 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Edificio'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
