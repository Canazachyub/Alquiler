import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { Modal, ConfirmDialog, LoadingPage, EmptyState } from '@/components/ui';
import { useCiudades, useCreateCiudad, useUpdateCiudad, useDeleteCiudad } from '@/hooks';
import { useNotifications } from '@/store';
import type { Ciudad, CiudadInput } from '@/types';
import { useForm } from 'react-hook-form';

export function Ciudades() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCiudad, setEditingCiudad] = useState<Ciudad | null>(null);
  const [deletingCiudad, setDeletingCiudad] = useState<Ciudad | null>(null);

  const { data: ciudades, isLoading } = useCiudades();
  const createMutation = useCreateCiudad();
  const updateMutation = useUpdateCiudad();
  const deleteMutation = useDeleteCiudad();
  const { notify } = useNotifications();

  const handleCreate = () => {
    setEditingCiudad(null);
    setIsModalOpen(true);
  };

  const handleEdit = (ciudad: Ciudad) => {
    setEditingCiudad(ciudad);
    setIsModalOpen(true);
  };

  const handleDelete = (ciudad: Ciudad) => {
    setDeletingCiudad(ciudad);
  };

  const handleSubmit = async (data: CiudadInput) => {
    try {
      if (editingCiudad) {
        await updateMutation.mutateAsync({ id: editingCiudad.id, data });
        notify.success('Ciudad actualizada correctamente');
      } else {
        await createMutation.mutateAsync(data);
        notify.success('Ciudad creada correctamente');
      }
      setIsModalOpen(false);
    } catch (error) {
      notify.error('Error al guardar la ciudad');
    }
  };

  const confirmDelete = async () => {
    if (!deletingCiudad) return;
    try {
      await deleteMutation.mutateAsync(deletingCiudad.id);
      notify.success('Ciudad eliminada correctamente');
      setDeletingCiudad(null);
    } catch (error) {
      notify.error('Error al eliminar la ciudad');
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ciudades</h1>
          <p className="text-gray-500">Gestiona las ciudades donde tienes propiedades</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ciudad
        </button>
      </div>

      {/* Lista de ciudades */}
      {ciudades?.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No hay ciudades"
          description="Crea tu primera ciudad para empezar"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Ciudad
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ciudades?.map((ciudad) => (
            <div key={ciudad.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{ciudad.nombre}</h3>
                    <p className="text-sm text-gray-500">{ciudad.departamento}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(ciudad)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(ciudad)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <span
                  className={`badge ${ciudad.activo ? 'badge-success' : 'badge-danger'}`}
                >
                  {ciudad.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCiudad ? 'Editar Ciudad' : 'Nueva Ciudad'}
        size="sm"
      >
        <CiudadForm
          initialData={editingCiudad || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deletingCiudad}
        onClose={() => setDeletingCiudad(null)}
        onConfirm={confirmDelete}
        title="Eliminar Ciudad"
        message={`¿Estás seguro de eliminar la ciudad "${deletingCiudad?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// Formulario interno
function CiudadForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData?: Partial<CiudadInput>;
  onSubmit: (data: CiudadInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CiudadInput>({
    defaultValues: {
      nombre: initialData?.nombre || '',
      departamento: initialData?.departamento || 'Puno',
      activo: initialData?.activo ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nombre *</label>
        <input
          {...register('nombre', { required: 'Ingrese el nombre' })}
          className="input"
          placeholder="Ej: Puno, Juli"
        />
        {errors.nombre && (
          <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label className="label">Departamento</label>
        <input
          {...register('departamento')}
          className="input"
          placeholder="Ej: Puno"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('activo')}
          id="activo"
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="activo" className="text-sm text-gray-700">
          Ciudad activa
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
