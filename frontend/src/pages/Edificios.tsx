import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, Layers, Receipt, Calendar, DollarSign, Wand2 } from 'lucide-react';
import { Modal, ConfirmDialog, LoadingPage, EmptyState } from '@/components/ui';
import { EdificioWizard } from '@/components/forms';
import {
  useEdificios,
  useCreateEdificio,
  useUpdateEdificio,
  useDeleteEdificio,
  useCreateEdificioCompleto,
  useCiudades,
  useGastosFijosByEdificio,
  useCreateGastoFijo,
  useUpdateGastoFijo,
  useDeleteGastoFijo,
} from '@/hooks';
import { useNotifications, useConfigStore } from '@/store';
import type { Edificio, EdificioInput, GastoFijo, GastoFijoInput, Ciudad, TipoGastoFijo } from '@/types';
import type { EdificioCompletoInput } from '@/api/edificios.api';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatters';

const TIPOS_GASTO_FIJO: { value: TipoGastoFijo; label: string }[] = [
  { value: 'agua', label: 'Agua' },
  { value: 'luz', label: 'Luz' },
  { value: 'internet', label: 'Internet' },
  { value: 'gas', label: 'Gas' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'vigilancia', label: 'Vigilancia' },
  { value: 'otro', label: 'Otro' },
];

export function Edificios() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingEdificio, setEditingEdificio] = useState<Edificio | null>(null);
  const [deletingEdificio, setDeletingEdificio] = useState<Edificio | null>(null);
  const [selectedEdificio, setSelectedEdificio] = useState<Edificio | null>(null);
  const [isGastoFijoModalOpen, setIsGastoFijoModalOpen] = useState(false);
  const [editingGastoFijo, setEditingGastoFijo] = useState<GastoFijo | null>(null);
  const [deletingGastoFijo, setDeletingGastoFijo] = useState<GastoFijo | null>(null);

  const { ciudadSeleccionada } = useConfigStore();
  const { data: edificios, isLoading } = useEdificios(ciudadSeleccionada || undefined);
  const { data: ciudades } = useCiudades();
  const createMutation = useCreateEdificio();
  const createCompletoMutation = useCreateEdificioCompleto();
  const updateMutation = useUpdateEdificio();
  const deleteMutation = useDeleteEdificio();
  const { notify } = useNotifications();

  // Gastos fijos del edificio seleccionado
  const { data: gastosFijos } = useGastosFijosByEdificio(selectedEdificio?.id);
  const createGastoFijoMutation = useCreateGastoFijo();
  const updateGastoFijoMutation = useUpdateGastoFijo();
  const deleteGastoFijoMutation = useDeleteGastoFijo();

  const handleCreate = () => {
    setIsWizardOpen(true);
  };

  const handleCreateSimple = () => {
    setEditingEdificio(null);
    setIsModalOpen(true);
  };

  const handleEdit = (edificio: Edificio) => {
    setEditingEdificio(edificio);
    setIsModalOpen(true);
  };

  const handleDelete = (edificio: Edificio) => {
    setDeletingEdificio(edificio);
  };

  const handleViewGastosFijos = (edificio: Edificio) => {
    setSelectedEdificio(edificio);
  };

  const handleSubmit = async (data: EdificioInput) => {
    try {
      if (editingEdificio) {
        await updateMutation.mutateAsync({ id: editingEdificio.id, data });
        notify.success('Edificio actualizado correctamente');
      } else {
        await createMutation.mutateAsync(data);
        notify.success('Edificio creado correctamente');
      }
      setIsModalOpen(false);
    } catch (error) {
      notify.error('Error al guardar el edificio');
    }
  };

  const handleWizardSubmit = async (data: EdificioCompletoInput) => {
    try {
      const result = await createCompletoMutation.mutateAsync(data);
      notify.success(`Edificio creado con ${result.pisos.length} pisos y ${result.habitaciones.length} habitaciones`);
      setIsWizardOpen(false);
    } catch (error) {
      notify.error('Error al crear el edificio');
    }
  };

  const confirmDelete = async () => {
    if (!deletingEdificio) return;
    try {
      await deleteMutation.mutateAsync(deletingEdificio.id);
      notify.success('Edificio eliminado correctamente');
      setDeletingEdificio(null);
      if (selectedEdificio?.id === deletingEdificio.id) {
        setSelectedEdificio(null);
      }
    } catch (error) {
      notify.error('Error al eliminar el edificio');
    }
  };

  // Gastos Fijos handlers
  const handleAddGastoFijo = () => {
    setEditingGastoFijo(null);
    setIsGastoFijoModalOpen(true);
  };

  const handleEditGastoFijo = (gasto: GastoFijo) => {
    setEditingGastoFijo(gasto);
    setIsGastoFijoModalOpen(true);
  };

  const handleDeleteGastoFijo = (gasto: GastoFijo) => {
    setDeletingGastoFijo(gasto);
  };

  const handleSubmitGastoFijo = async (data: GastoFijoInput) => {
    try {
      if (editingGastoFijo) {
        await updateGastoFijoMutation.mutateAsync({ id: editingGastoFijo.id, data });
        notify.success('Gasto fijo actualizado');
      } else {
        await createGastoFijoMutation.mutateAsync(data);
        notify.success('Gasto fijo registrado');
      }
      setIsGastoFijoModalOpen(false);
    } catch (error) {
      notify.error('Error al guardar el gasto fijo');
    }
  };

  const confirmDeleteGastoFijo = async () => {
    if (!deletingGastoFijo) return;
    try {
      await deleteGastoFijoMutation.mutateAsync(deletingGastoFijo.id);
      notify.success('Gasto fijo eliminado');
      setDeletingGastoFijo(null);
    } catch (error) {
      notify.error('Error al eliminar el gasto fijo');
    }
  };

  const getCiudadNombre = (ciudadId: string) => {
    const ciudad = ciudades?.find((c) => c.id === ciudadId);
    return ciudad?.nombre || ciudadId;
  };

  const getTipoGastoLabel = (tipo: TipoGastoFijo) => {
    return TIPOS_GASTO_FIJO.find(t => t.value === tipo)?.label || tipo;
  };

  const totalGastosFijos = gastosFijos?.reduce((sum, g) => sum + (g.activo ? Number(g.monto) : 0), 0) || 0;

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edificios</h1>
          <p className="text-gray-500">Gestiona los edificios y sus gastos fijos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCreateSimple} className="btn btn-outline">
            <Plus className="w-4 h-4 mr-2" />
            Simple
          </button>
          <button onClick={handleCreate} className="btn btn-primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Nuevo con Asistente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de edificios */}
        <div className="lg:col-span-2 space-y-4">
          {edificios?.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No hay edificios"
              description="Crea tu primer edificio para empezar a gestionar habitaciones"
              action={
                <button onClick={handleCreate} className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Edificio
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edificios?.map((edificio) => (
                <div
                  key={edificio.id}
                  className={`card p-5 cursor-pointer transition-all ${
                    selectedEdificio?.id === edificio.id
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleViewGastosFijos(edificio)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{edificio.nombre}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {getCiudadNombre(edificio.ciudadId)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(edificio);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(edificio);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {edificio.descripcion && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{edificio.descripcion}</p>
                  )}

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-sm text-gray-600">{edificio.direccion}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span>{edificio.totalPisos} pisos</span>
                      </div>
                      <span
                        className={`badge ${edificio.activo ? 'badge-success' : 'badge-danger'}`}
                      >
                        {edificio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de gastos fijos */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-4">
            {selectedEdificio ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary-600" />
                      Gastos Fijos
                    </h3>
                    <p className="text-sm text-gray-500">{selectedEdificio.nombre}</p>
                  </div>
                  <button onClick={handleAddGastoFijo} className="btn btn-primary btn-sm">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Total mensual */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-500">Total mensual</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(totalGastosFijos)}
                  </p>
                </div>

                {/* Lista de gastos fijos */}
                {gastosFijos && gastosFijos.length > 0 ? (
                  <div className="space-y-3">
                    {gastosFijos.map((gasto) => (
                      <div
                        key={gasto.id}
                        className={`p-3 rounded-lg border ${
                          gasto.activo ? 'bg-white' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {getTipoGastoLabel(gasto.tipo)}
                              </span>
                              {!gasto.activo && (
                                <span className="badge badge-danger text-xs">Inactivo</span>
                              )}
                            </div>
                            {gasto.descripcion && (
                              <p className="text-sm text-gray-500 mt-1">{gasto.descripcion}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(gasto.monto)}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Calendar className="w-3 h-3" />
                                Vence el {gasto.diaVencimiento}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditGastoFijo(gasto)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteGastoFijo(gasto)}
                              className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay gastos fijos registrados</p>
                    <button
                      onClick={handleAddGastoFijo}
                      className="btn btn-outline btn-sm mt-3"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar gasto fijo
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Selecciona un edificio</p>
                <p className="text-sm mt-1">
                  Haz clic en un edificio para ver y gestionar sus gastos fijos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Wizard de creacion de edificio completo */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Asistente de Creacion de Edificio"
        size="lg"
      >
        <EdificioWizard
          ciudades={ciudades || []}
          onSubmit={handleWizardSubmit}
          onCancel={() => setIsWizardOpen(false)}
          isLoading={createCompletoMutation.isPending}
        />
      </Modal>

      {/* Modal de creacion/edicion simple de edificio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEdificio ? 'Editar Edificio' : 'Nuevo Edificio'}
        size="md"
      >
        <EdificioForm
          ciudades={ciudades || []}
          initialData={editingEdificio || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Modal de gasto fijo */}
      <Modal
        isOpen={isGastoFijoModalOpen}
        onClose={() => setIsGastoFijoModalOpen(false)}
        title={editingGastoFijo ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
        size="sm"
      >
        {selectedEdificio && (
          <GastoFijoForm
            edificioId={selectedEdificio.id}
            initialData={editingGastoFijo || undefined}
            onSubmit={handleSubmitGastoFijo}
            onCancel={() => setIsGastoFijoModalOpen(false)}
            isLoading={createGastoFijoMutation.isPending || updateGastoFijoMutation.isPending}
          />
        )}
      </Modal>

      {/* Confirmacion de eliminacion de edificio */}
      <ConfirmDialog
        isOpen={!!deletingEdificio}
        onClose={() => setDeletingEdificio(null)}
        onConfirm={confirmDelete}
        title="Eliminar Edificio"
        message={`¿Estas seguro de eliminar el edificio "${deletingEdificio?.nombre}"? Se eliminaran todos los pisos, habitaciones y gastos fijos asociados.`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />

      {/* Confirmacion de eliminacion de gasto fijo */}
      <ConfirmDialog
        isOpen={!!deletingGastoFijo}
        onClose={() => setDeletingGastoFijo(null)}
        onConfirm={confirmDeleteGastoFijo}
        title="Eliminar Gasto Fijo"
        message={`¿Estas seguro de eliminar el gasto fijo "${getTipoGastoLabel(deletingGastoFijo?.tipo || 'otro')}"?`}
        confirmText="Eliminar"
        isLoading={deleteGastoFijoMutation.isPending}
      />
    </div>
  );
}

// Formulario de Edificio
function EdificioForm({
  ciudades,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  ciudades: Ciudad[];
  initialData?: Partial<EdificioInput> & { id?: string };
  onSubmit: (data: EdificioInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EdificioInput>({
    defaultValues: {
      ciudadId: initialData?.ciudadId || '',
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      direccion: initialData?.direccion || '',
      totalPisos: initialData?.totalPisos || 1,
      activo: initialData?.activo ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Ciudad *</label>
        <select
          {...register('ciudadId', { required: 'Seleccione una ciudad' })}
          className="select"
        >
          <option value="">Seleccionar ciudad...</option>
          {ciudades.map((ciudad) => (
            <option key={ciudad.id} value={ciudad.id}>
              {ciudad.nombre}
            </option>
          ))}
        </select>
        {errors.ciudadId && (
          <p className="text-sm text-red-500 mt-1">{errors.ciudadId.message}</p>
        )}
      </div>

      <div>
        <label className="label">Nombre *</label>
        <input
          {...register('nombre', { required: 'Ingrese el nombre' })}
          className="input"
          placeholder="Ej: Edificio Central"
        />
        {errors.nombre && (
          <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label className="label">Descripcion</label>
        <textarea
          {...register('descripcion')}
          className="input"
          rows={2}
          placeholder="Descripcion breve del edificio..."
        />
      </div>

      <div>
        <label className="label">Direccion *</label>
        <input
          {...register('direccion', { required: 'Ingrese la direccion' })}
          className="input"
          placeholder="Ej: Jr. Lima 123"
        />
        {errors.direccion && (
          <p className="text-sm text-red-500 mt-1">{errors.direccion.message}</p>
        )}
      </div>

      <div>
        <label className="label">Total de Pisos *</label>
        <input
          type="number"
          {...register('totalPisos', {
            required: 'Ingrese el numero de pisos',
            min: { value: 1, message: 'Minimo 1 piso' },
            valueAsNumber: true,
          })}
          className="input"
          min={1}
        />
        {errors.totalPisos && (
          <p className="text-sm text-red-500 mt-1">{errors.totalPisos.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('activo')}
          id="activo"
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="activo" className="text-sm text-gray-700">
          Edificio activo
        </label>
      </div>

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

// Formulario de Gasto Fijo
function GastoFijoForm({
  edificioId,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  edificioId: string;
  initialData?: Partial<GastoFijoInput> & { id?: string };
  onSubmit: (data: GastoFijoInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<GastoFijoInput>({
    defaultValues: {
      edificioId,
      tipo: initialData?.tipo || 'otro',
      descripcion: initialData?.descripcion || '',
      monto: initialData?.monto || 0,
      diaVencimiento: initialData?.diaVencimiento || 15,
      activo: initialData?.activo ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('edificioId')} />

      <div>
        <label className="label">Tipo de Gasto *</label>
        <select {...register('tipo', { required: 'Seleccione el tipo' })} className="select">
          {TIPOS_GASTO_FIJO.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
        {errors.tipo && (
          <p className="text-sm text-red-500 mt-1">{errors.tipo.message}</p>
        )}
      </div>

      <div>
        <label className="label">Descripcion</label>
        <input
          {...register('descripcion')}
          className="input"
          placeholder="Ej: Recibo de agua potable"
        />
      </div>

      <div>
        <label className="label">Monto Mensual *</label>
        <input
          type="number"
          step="0.01"
          {...register('monto', {
            required: 'Ingrese el monto',
            min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
            valueAsNumber: true,
          })}
          className="input"
          placeholder="0.00"
        />
        {errors.monto && (
          <p className="text-sm text-red-500 mt-1">{errors.monto.message}</p>
        )}
      </div>

      <div>
        <label className="label">Dia de Vencimiento *</label>
        <input
          type="number"
          {...register('diaVencimiento', {
            required: 'Ingrese el dia de vencimiento',
            min: { value: 1, message: 'Minimo dia 1' },
            max: { value: 31, message: 'Maximo dia 31' },
            valueAsNumber: true,
          })}
          className="input"
          min={1}
          max={31}
          placeholder="15"
        />
        <p className="text-xs text-gray-500 mt-1">Dia del mes en que vence el pago (1-31)</p>
        {errors.diaVencimiento && (
          <p className="text-sm text-red-500 mt-1">{errors.diaVencimiento.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('activo')}
          id="gasto-activo"
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="gasto-activo" className="text-sm text-gray-700">
          Gasto activo
        </label>
      </div>

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
