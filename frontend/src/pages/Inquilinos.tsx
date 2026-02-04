import { useState } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Home, FileText } from 'lucide-react';
import { InquilinoForm } from '@/components/forms';
import { Modal, ConfirmDialog, LoadingPage, EmptyState } from '@/components/ui';
import { generateContratoPDF } from '@/components/voucher';
import {
  useInquilinos,
  useCreateInquilino,
  useUpdateInquilino,
  useDeleteInquilino,
  useHabitaciones,
} from '@/hooks';
import { useNotifications } from '@/store';
import { formatDate, formatPhone } from '@/utils/formatters';
import type { Inquilino, InquilinoInput, Habitacion } from '@/types';

export function Inquilinos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInquilino, setSelectedInquilino] = useState<Inquilino | null>(null);
  const [deletingInquilino, setDeletingInquilino] = useState<Inquilino | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactivos, setShowInactivos] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [newInquilinoData, setNewInquilinoData] = useState<{ inquilino: Inquilino; habitacion: Habitacion } | null>(null);

  const { data: inquilinos, isLoading } = useInquilinos();
  const { data: habitaciones } = useHabitaciones();
  const createMutation = useCreateInquilino();
  const updateMutation = useUpdateInquilino();
  const deleteMutation = useDeleteInquilino();
  const { notify } = useNotifications();

  // Filtrar inquilinos
  const filteredInquilinos = inquilinos?.filter((inq) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      inq.nombre.toLowerCase().includes(searchLower) ||
      inq.apellido.toLowerCase().includes(searchLower) ||
      inq.dni.includes(searchTerm) ||
      inq.telefono.includes(searchTerm);

    const matchesStatus = showInactivos || inq.estado === 'activo';

    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedInquilino(null);
    setIsModalOpen(true);
  };

  const handleEdit = (inquilino: Inquilino) => {
    setSelectedInquilino(inquilino);
    setIsModalOpen(true);
  };

  const handleDelete = (inquilino: Inquilino) => {
    setDeletingInquilino(inquilino);
  };

  const handleSubmit = async (data: InquilinoInput) => {
    try {
      if (selectedInquilino) {
        await updateMutation.mutateAsync({ id: selectedInquilino.id, data });
        notify.success('Inquilino actualizado');
        setIsModalOpen(false);
      } else {
        const result = await createMutation.mutateAsync(data);
        notify.success('Inquilino registrado');
        setIsModalOpen(false);

        // Mostrar dialogo para descargar contrato
        const habitacion = habitaciones?.find(h => h.id === data.habitacionId);
        if (habitacion && result) {
          const nuevoInquilino: Inquilino = {
            id: result.id || '',
            habitacionId: data.habitacionId,
            nombre: data.nombre,
            apellido: data.apellido,
            dni: data.dni,
            telefono: data.telefono,
            email: data.email,
            fechaIngreso: data.fechaIngreso,
            estado: 'activo',
            contactoEmergencia: data.contactoEmergencia,
            telefonoEmergencia: data.telefonoEmergencia,
            observaciones: data.observaciones,
            garantia: data.garantia,
            llaveHabitacion: data.llaveHabitacion,
            llavePuertaCalle: data.llavePuertaCalle,
          };
          setNewInquilinoData({ inquilino: nuevoInquilino, habitacion });
          setShowContractDialog(true);
        }
      }
    } catch (error) {
      notify.error('Error al guardar');
    }
  };

  const handleDownloadContract = async () => {
    if (newInquilinoData) {
      await generateContratoPDF({
        inquilino: newInquilinoData.inquilino,
        habitacion: newInquilinoData.habitacion,
      });
      notify.success('Contrato descargado');
    }
    setShowContractDialog(false);
    setNewInquilinoData(null);
  };

  const handleSkipContract = () => {
    setShowContractDialog(false);
    setNewInquilinoData(null);
  };

  const confirmDelete = async () => {
    if (!deletingInquilino) return;
    try {
      await deleteMutation.mutateAsync(deletingInquilino.id);
      notify.success('Inquilino eliminado');
      setDeletingInquilino(null);
    } catch (error) {
      notify.error('Error al eliminar');
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
          <h1 className="text-2xl font-bold text-gray-900">Inquilinos</h1>
          <p className="text-gray-500">Gestiona los inquilinos de tus propiedades</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Inquilino
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Toggle inactivos */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactivos}
              onChange={(e) => setShowInactivos(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Mostrar inactivos</span>
          </label>
        </div>
      </div>

      {/* Tabla de inquilinos */}
      {filteredInquilinos?.length === 0 ? (
        <EmptyState
          icon={User}
          title="No hay inquilinos"
          description="Registra tu primer inquilino para empezar"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Inquilino
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Contacto</th>
                <th>Habitación</th>
                <th>Fecha Ingreso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquilinos?.map((inq) => (
                <tr key={inq.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {inq.nombre} {inq.apellido}
                        </p>
                        <p className="text-sm text-gray-500">DNI: {inq.dni}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {formatPhone(inq.telefono)}
                      </div>
                      {inq.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {inq.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span>{inq.habitacion?.codigo || inq.habitacionId}</span>
                    </div>
                  </td>
                  <td>{formatDate(inq.fechaIngreso)}</td>
                  <td>
                    <span
                      className={`badge ${
                        inq.estado === 'activo' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {inq.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={async () => {
                          const hab = habitaciones?.find(h => h.id === inq.habitacionId);
                          if (hab) {
                            await generateContratoPDF({ inquilino: inq, habitacion: hab });
                            notify.success('Contrato descargado');
                          }
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg"
                        title="Descargar contrato"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleEdit(inq)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(inq)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedInquilino ? 'Editar Inquilino' : 'Nuevo Inquilino'}
        size="lg"
      >
        <InquilinoForm
          habitaciones={habitaciones || []}
          initialData={selectedInquilino || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deletingInquilino}
        onClose={() => setDeletingInquilino(null)}
        onConfirm={confirmDelete}
        title="Eliminar Inquilino"
        message={`¿Estás seguro de eliminar a "${deletingInquilino?.nombre} ${deletingInquilino?.apellido}"?`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />

      {/* Dialogo para descargar contrato */}
      <Modal
        isOpen={showContractDialog}
        onClose={handleSkipContract}
        title="Inquilino Registrado"
        size="md"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {newInquilinoData?.inquilino.nombre} {newInquilinoData?.inquilino.apellido}
          </h3>
          <p className="text-gray-500 mb-6">
            El inquilino ha sido registrado exitosamente en la habitacion{' '}
            <span className="font-medium">{newInquilinoData?.habitacion.codigo}</span>.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Desea descargar el contrato de alquiler para imprimir?
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSkipContract}
              className="btn btn-outline"
            >
              Omitir
            </button>
            <button
              onClick={handleDownloadContract}
              className="btn btn-primary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar Contrato
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
