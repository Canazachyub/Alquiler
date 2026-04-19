import { useState } from 'react';
import { Plus, Edit, Trash2, Layers, Building2, Home } from 'lucide-react';
import { Modal, ConfirmDialog, LoadingPage, EmptyState } from '@/components/ui';
import { useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import type { Piso, PisoInput, Edificio } from '@/types';
import { useForm } from 'react-hook-form';
import { useEdificios } from '@/hooks';
import { usePisos, useCreatePiso, useUpdatePiso, useDeletePiso } from '@/hooks/usePisos';

export function Pisos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPiso, setEditingPiso] = useState<Piso | null>(null);
  const [deletingPiso, setDeletingPiso] = useState<Piso | null>(null);
  const [selectedEdificio, setSelectedEdificio] = useState<string>('');

  const { data: edificios, isLoading: loadingEdificios } = useEdificios();
  const { data: pisos, isLoading: loadingPisos } = usePisos(selectedEdificio || undefined);
  const createMutation = useCreatePiso();
  const updateMutation = useUpdatePiso();
  const deleteMutation = useDeletePiso();
  const { notify } = useNotifications();

  const handleCreate = () => {
    setEditingPiso(null);
    setIsModalOpen(true);
  };

  const handleEdit = (piso: Piso) => {
    setEditingPiso(piso);
    setIsModalOpen(true);
  };

  const handleDelete = (piso: Piso) => {
    setDeletingPiso(piso);
  };

  const handleSubmit = async (data: PisoInput) => {
    try {
      if (editingPiso) {
        await updateMutation.mutateAsync({ id: editingPiso.id, data });
        notify.success('Piso actualizado');
      } else {
        await createMutation.mutateAsync(data);
        notify.success('Piso creado');
      }
      setIsModalOpen(false);
    } catch (error) {
      notify.error('No se pudo guardar. Intenta de nuevo.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingPiso) return;
    try {
      await deleteMutation.mutateAsync(deletingPiso.id);
      notify.success('Piso eliminado');
      setDeletingPiso(null);
    } catch (error) {
      notify.error('No se pudo eliminar. Intenta de nuevo.');
    }
  };

  const getEdificioNombre = (edificioId: string) => {
    const edificio = edificios?.find((e) => e.id === edificioId);
    return edificio?.nombre || edificioId;
  };

  const isLoading = loadingEdificios || loadingPisos;

  if (isLoading) {
    return <LoadingPage />;
  }

  const total = pisos?.length || 0;
  const edificioNombre = selectedEdificio ? getEdificioNombre(selectedEdificio) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pisos</h1>
          <p className="page-subtitle">
            {edificioNombre
              ? `${total} pisos en ${edificioNombre}`
              : `${total} registrados`}
          </p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo Piso
        </button>
      </div>

      {/* Filtro por edificio */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Filtrar por edificio:</label>
          <select
            value={selectedEdificio}
            onChange={(e) => setSelectedEdificio(e.target.value)}
            className="select w-64"
          >
            <option value="">Todos los edificios</option>
            {edificios?.map((edificio) => (
              <option key={edificio.id} value={edificio.id}>
                {edificio.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de pisos */}
      {pisos?.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aún no hay pisos"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Nuevo piso
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pisos?.map((piso) => (
            <div key={piso.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600 tabular-nums">{piso.numero}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Piso {piso.numero}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="w-3 h-3" />
                      {getEdificioNombre(piso.edificioId)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(piso)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(piso)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {piso.descripcion && (
                <p className="mt-3 text-sm text-slate-600">{piso.descripcion}</p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                <Home className="w-3 h-3" />
                <span>ID: {piso.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creacion/edicion */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPiso ? 'Editar Piso' : 'Nuevo Piso'}
        size="sm"
      >
        <PisoForm
          edificios={edificios || []}
          initialData={editingPiso || undefined}
          defaultEdificioId={selectedEdificio}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Confirmacion de eliminacion */}
      <ConfirmDialog
        isOpen={!!deletingPiso}
        onClose={() => setDeletingPiso(null)}
        onConfirm={confirmDelete}
        title="Eliminar Piso"
        message={`¿Eliminar el piso ${deletingPiso?.numero ?? ''}? Se eliminarán todas las habitaciones asociadas. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// Formulario interno
function PisoForm({
  edificios,
  initialData,
  defaultEdificioId,
  onSubmit,
  onCancel,
  isLoading,
}: {
  edificios: Edificio[];
  initialData?: Partial<PisoInput> & { id?: string };
  defaultEdificioId?: string;
  onSubmit: (data: PisoInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<PisoInput>({
    defaultValues: {
      edificioId: initialData?.edificioId || defaultEdificioId || '',
      numero: initialData?.numero || 1,
      descripcion: initialData?.descripcion || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Edificio *</label>
        <select
          {...register('edificioId', { required: 'Seleccione un edificio' })}
          className={cn('select', errors.edificioId && 'input-error')}
        >
          <option value="">Seleccionar edificio...</option>
          {edificios.map((edificio) => (
            <option key={edificio.id} value={edificio.id}>
              {edificio.nombre}
            </option>
          ))}
        </select>
        {errors.edificioId && <p className="form-error">{errors.edificioId.message}</p>}
      </div>

      <div>
        <label className="label">Número de Piso *</label>
        <input
          type="number"
          {...register('numero', {
            required: 'Ingrese el numero de piso',
            min: { value: 1, message: 'Minimo piso 1' },
            valueAsNumber: true,
          })}
          className={cn('input tabular-nums', errors.numero && 'input-error')}
          min={1}
        />
        {errors.numero && <p className="form-error">{errors.numero.message}</p>}
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea
          {...register('descripcion')}
          className="input"
          rows={2}
          placeholder="Ej: Piso con vista a la calle principal"
        />
      </div>

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
