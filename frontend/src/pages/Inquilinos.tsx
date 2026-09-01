import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Home, FileText, UploadCloud, ExternalLink } from 'lucide-react';
import { InquilinoForm, type CapturaDniValue } from '@/components/forms';
import { Modal, ConfirmDialog, LoadingPage, EmptyState } from '@/components/ui';
import { Fab } from '@/components/ui/Fab';
import { generateContratoPDF, getContratoBlob } from '@/components/voucher';
import {
  useInquilinos,
  useCreateInquilino,
  useUpdateInquilino,
  useDeleteInquilino,
  useHabitacionesConEstadoPago,
  useCiudades,
  useEdificios,
  INQUILINOS_KEY,
} from '@/hooks';
import { driveApi } from '@/api';
import { useConfigStore, useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import { archivoADataUrl } from '@/utils/imagen';
import { formatDate, formatPhone, formatDNI } from '@/utils/formatters';
import type { Inquilino, InquilinoInput, Habitacion, TipoDocumentoDrive } from '@/types';

export function Inquilinos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInquilino, setSelectedInquilino] = useState<Inquilino | null>(null);
  const [deletingInquilino, setDeletingInquilino] = useState<Inquilino | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactivos, setShowInactivos] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [newInquilinoData, setNewInquilinoData] = useState<{ inquilino: Inquilino; habitacion: Habitacion } | null>(null);
  const [subiendoDni, setSubiendoDni] = useState(false);
  const [archivandoId, setArchivandoId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { mesActual, anioActual, ciudadSeleccionada, edificioSeleccionado } = useConfigStore();

  const { data: inquilinos, isLoading } = useInquilinos();
  // Con estado-pago porque es el unico endpoint que trae edificio y piso resueltos,
  // necesarios para agrupar el selector y para el contexto del formulario.
  const { data: habitaciones } = useHabitacionesConEstadoPago(mesActual, anioActual);
  const { data: ciudades } = useCiudades();
  const { data: edificios } = useEdificios();
  const createMutation = useCreateInquilino();
  const updateMutation = useUpdateInquilino();
  const deleteMutation = useDeleteInquilino();
  const { notify } = useNotifications();

  // El formulario solo ofrece habitaciones del edificio seleccionado en el header
  const habitacionesForm = edificioSeleccionado
    ? (habitaciones ?? []).filter((h) => h.edificioId === edificioSeleccionado)
    : habitaciones ?? [];

  const contexto = {
    ciudad: ciudades?.find((c) => c.id === ciudadSeleccionada)?.nombre ?? null,
    edificio: edificios?.find((e) => e.id === edificioSeleccionado)?.nombre ?? null,
  };

  // Filtrar inquilinos (coerción a string para tolerar numbers desde Google Sheets)
  const filteredInquilinos = inquilinos?.filter((inq) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      String(inq.nombre || '').toLowerCase().includes(searchLower) ||
      String(inq.apellido || '').toLowerCase().includes(searchLower) ||
      String(inq.dni || '').includes(searchTerm) ||
      String(inq.telefono || '').includes(searchTerm) ||
      String(inq.habitacion?.codigo || '').toLowerCase().includes(searchLower) ||
      String(inq.habitacion?.edificioNombre || '').toLowerCase().includes(searchLower);

    const matchesStatus = showInactivos || inq.estado === 'activo';

    return matchesSearch && matchesStatus;
  });

  // Totales para subtitle
  const totalActivos = inquilinos?.filter((i) => i.estado === 'activo').length || 0;
  const totalRegistrados = inquilinos?.length || 0;

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

  /**
   * Sube las fotos del DNI despues de guardar al inquilino.
   * Es un paso aparte a proposito: si Drive falla, el alta no se pierde.
   * Se suben en serie porque Apps Script serializa la escritura en la hoja igual.
   */
  const subirFotosDni = async (inquilinoId: string, fotos: CapturaDniValue) => {
    const tareas: Array<{ tipo: TipoDocumentoDrive; archivoBase64: string }> = [];
    if (fotos.frente) tareas.push({ tipo: 'dni-frente', archivoBase64: fotos.frente });
    if (fotos.reverso) tareas.push({ tipo: 'dni-reverso', archivoBase64: fotos.reverso });
    if (!tareas.length) return;

    setSubiendoDni(true);
    try {
      for (const tarea of tareas) {
        await driveApi.subir({ ...tarea, inquilinoId });
      }
      queryClient.invalidateQueries({ queryKey: INQUILINOS_KEY });
      notify.success(
        tareas.length === 2 ? 'Fotos del DNI guardadas en Drive' : 'Foto del DNI guardada en Drive'
      );
    } catch (error) {
      notify.error(
        'El inquilino se guardó, pero no se pudieron subir las fotos. Cargalas editándolo.'
      );
    } finally {
      setSubiendoDni(false);
    }
  };

  const handleSubmit = async (data: InquilinoInput, fotosDni: CapturaDniValue) => {
    try {
      if (selectedInquilino) {
        await updateMutation.mutateAsync({ id: selectedInquilino.id, data });
        notify.success('Inquilino actualizado');
        setIsModalOpen(false);
        await subirFotosDni(selectedInquilino.id, fotosDni);
      } else {
        const result = await createMutation.mutateAsync(data);
        notify.success('Inquilino registrado');
        setIsModalOpen(false);

        if (result?.id) {
          await subirFotosDni(result.id, fotosDni);
        }

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
      notify.error('No se pudo guardar. Intenta de nuevo.');
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

  /**
   * Genera el Reglamento y lo archiva en Drive, en la carpeta del inquilino.
   * Manual a proposito: solo sube cuando se pide.
   */
  const handleArchivarContrato = async (inq: Inquilino) => {
    const hab = habitaciones?.find((h) => h.id === inq.habitacionId);
    if (!hab) {
      notify.error('No se encontró la habitación del inquilino');
      return;
    }

    setArchivandoId(inq.id);
    try {
      const blob = await getContratoBlob({ inquilino: inq, habitacion: hab });
      const archivoBase64 = await archivoADataUrl(blob);
      await driveApi.subir({ tipo: 'contrato', inquilinoId: inq.id, archivoBase64 });
      queryClient.invalidateQueries({ queryKey: INQUILINOS_KEY });
      notify.success('Reglamento archivado en Drive');
    } catch (error) {
      notify.error('No se pudo archivar el Reglamento en Drive');
    } finally {
      setArchivandoId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deletingInquilino) return;
    try {
      await deleteMutation.mutateAsync(deletingInquilino.id);
      notify.success('Inquilino eliminado');
      setDeletingInquilino(null);
    } catch (error) {
      notify.error('No se pudo eliminar. Intenta de nuevo.');
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title">Inquilinos</h1>
          <p className="page-subtitle">
            {totalRegistrados > 0
              ? `${totalActivos} activos · ${totalRegistrados} registrados`
              : 'Sin registros todavía'}
          </p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary whitespace-nowrap hidden md:inline-flex">
          <Plus className="w-4 h-4" />
          <span>Nuevo Inquilino</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactivos}
              onChange={(e) => setShowInactivos(e.target.checked)}
              className="sr-only"
            />
            <div className={cn('w-9 h-5 rounded-full relative transition-colors', showInactivos ? 'bg-primary-600' : 'bg-slate-300')}>
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all', showInactivos ? 'left-[18px]' : 'left-0.5')} />
            </div>
            <span className="text-sm text-slate-600">Mostrar inactivos</span>
          </label>
        </div>
      </div>

      {/* Tabla de inquilinos */}
      {filteredInquilinos?.length === 0 ? (
        <EmptyState
          icon={User}
          title="Aún no hay inquilinos"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Registrar inquilino
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Inquilino</th>
                <th className="hidden md:table-cell">Contacto</th>
                <th>Hab.</th>
                <th className="hidden sm:table-cell">Ingreso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquilinos?.map((inq) => (
                <tr key={inq.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {inq.nombre} {inq.apellido}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">DNI: {inq.dni ? formatDNI(inq.dni) : '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm tabular-nums">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {formatPhone(inq.telefono)}
                      </div>
                      {inq.email && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {inq.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-start gap-1.5">
                      <Home className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">
                          {inq.habitacion?.codigo || inq.habitacionId}
                          {inq.habitacion?.pisoNumero != null && (
                            <span className="font-normal text-slate-400">
                              {' '}
                              · Piso {inq.habitacion.pisoNumero}
                            </span>
                          )}
                        </p>
                        {inq.habitacion?.edificioNombre && (
                          <p className="text-xs text-slate-500 truncate">
                            {inq.habitacion.edificioNombre}
                            {inq.habitacion.ciudadNombre ? ` · ${inq.habitacion.ciudadNombre}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell tabular-nums">{formatDate(inq.fechaIngreso)}</td>
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
                        className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Descargar contrato"
                      >
                        <FileText className="w-4 h-4 text-primary-500" />
                      </button>
                      {inq.contratoPdfUrl ? (
                        <a
                          href={inq.contratoPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-emerald-50 rounded-lg transition-colors inline-flex"
                          title="Reglamento archivado en Drive — abrir"
                        >
                          <ExternalLink className="w-4 h-4 text-emerald-600" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleArchivarContrato(inq)}
                          disabled={archivandoId === inq.id}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Guardar Reglamento en Drive"
                        >
                          <UploadCloud
                            className={cn(
                              'w-4 h-4 text-slate-500',
                              archivandoId === inq.id && 'animate-pulse'
                            )}
                          />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(inq)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(inq)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAB móvil */}
      <Fab onClick={handleCreate} label="Nuevo inquilino" />

      {/* Modal de creación/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedInquilino ? 'Editar Inquilino' : 'Nuevo Inquilino'}
        size="lg"
      >
        <InquilinoForm
          habitaciones={selectedInquilino ? habitaciones || [] : habitacionesForm}
          initialData={selectedInquilino || undefined}
          dniUrls={{
            frente: selectedInquilino?.dniFotoFrenteUrl,
            reverso: selectedInquilino?.dniFotoReversoUrl,
          }}
          contexto={contexto}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending || subiendoDni}
        />
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deletingInquilino}
        onClose={() => setDeletingInquilino(null)}
        onConfirm={confirmDelete}
        title="Eliminar Inquilino"
        message={`¿Eliminar a ${deletingInquilino?.nombre ?? ''} ${deletingInquilino?.apellido ?? ''}? Esta acción no se puede deshacer.`}
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
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <FileText className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {newInquilinoData?.inquilino.nombre} {newInquilinoData?.inquilino.apellido}
          </h3>
          <p className="text-slate-500 mb-6">
            El inquilino ha sido registrado exitosamente en la habitación{' '}
            <span className="font-medium">{newInquilinoData?.habitacion.codigo}</span>.
          </p>
          <p className="text-sm text-slate-600 mb-6">
            ¿Desea descargar el contrato de alquiler para imprimir?
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
              <FileText className="w-4 h-4" />
              Descargar Contrato
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
