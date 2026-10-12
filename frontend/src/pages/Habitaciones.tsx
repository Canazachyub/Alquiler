import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, RefreshCw, Home, LayoutGrid, Building2, DoorOpen, UserRound, CreditCard, FileText, CalendarCheck, Sheet } from 'lucide-react';
import { VistaPlanos } from '@/components/plano';
import { TarjetasPorPiso } from '@/components/cards';
import { ResumenImprimible } from '@/components/voucher';
import { HabitacionForm, InquilinoDeHabitacion, RegistrarPagoHabitacion, DocumentoHabitacion } from '@/components/forms';
import { Modal, LoadingPage, EmptyState, IconChip, SeccionesTabs, type Seccion } from '@/components/ui';
import { Fab } from '@/components/ui/Fab';
import {
  useHabitacionesConEstadoPago,
  useCreateHabitacion,
  useUpdateHabitacion,
  usePisos,
  useEdificiosByCiudad,
  useCobros,
} from '@/hooks';
import { useConfigStore, useNotifications } from '@/store';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { HabitacionConDetalles, HabitacionInput } from '@/types';

type FilterType = 'all' | 'paid' | 'soon' | 'debt' | 'vacant';
type PestanaHab = 'habitacion' | 'inquilino' | 'pago' | 'contrato' | 'tracking' | 'resumen';

export function Habitaciones() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabitacion, setSelectedHabitacion] = useState<HabitacionConDetalles | null>(null);
  const [pestanaModal, setPestanaModal] = useState<PestanaHab>('habitacion');
  const [searchParams] = useSearchParams();
  const filtroInicial: Record<string, FilterType> = { deuda: 'debt', pagado: 'paid', vencer: 'soon', vacante: 'vacant' };
  const [filter, setFilter] = useState<FilterType>(filtroInicial[searchParams.get('filtro') ?? ''] ?? 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vista, setVistaState] = useState<'tarjetas' | 'plano'>(() => {
    try {
      return localStorage.getItem('alquiler-vista-hab') === 'plano' ? 'plano' : 'tarjetas';
    } catch {
      return 'tarjetas';
    }
  });
  const setVista = (v: 'tarjetas' | 'plano') => {
    setVistaState(v);
    try {
      localStorage.setItem('alquiler-vista-hab', v);
    } catch {
      /* sin almacenamiento */
    }
  };

  const { mesActual, anioActual, edificioSeleccionado, ciudadSeleccionada } = useConfigStore();
  const { data: edificiosCiudad } = useEdificiosByCiudad(ciudadSeleccionada || '');
  const { notify } = useNotifications();
  const cobros = useCobros();

  const { data: habitacionesTodas, isLoading, refetch } = useHabitacionesConEstadoPago(
    mesActual,
    anioActual,
    edificioSeleccionado || undefined
  );
  // Filtro global de ciudad (el endpoint solo filtra por edificio)
  const habitaciones =
    ciudadSeleccionada && !edificioSeleccionado && edificiosCiudad
      ? habitacionesTodas?.filter((h) => edificiosCiudad.some((e) => e.id === h.edificioId))
      : habitacionesTodas;

  const { data: pisos } = usePisos(edificioSeleccionado || undefined);

  const createMutation = useCreateHabitacion();
  const updateMutation = useUpdateHabitacion();

  // Filtrar habitaciones
  const filteredHabitaciones = habitaciones?.filter((hab) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      hab.codigo.toLowerCase().includes(searchLower) ||
      hab.nombreInquilino?.toLowerCase().includes(searchLower);

    let matchesFilter = true;
    if (filter === 'paid') {
      matchesFilter = cobros.estado(hab) === 'al-dia';
    } else if (filter === 'debt') {
      matchesFilter = cobros.estado(hab) === 'vencido';
    } else if (filter === 'soon') {
      matchesFilter = cobros.estado(hab) === 'por-vencer';
    } else if (filter === 'vacant') {
      matchesFilter = hab.estado === 'vacant';
    }

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: habitaciones?.length || 0,
    ocupadas: habitaciones?.filter((h) => h.estado === 'occupied').length || 0,
    pagadas: habitaciones?.filter((h) => cobros.estado(h) === 'al-dia').length || 0,
    porVencer: habitaciones?.filter((h) => cobros.estado(h) === 'por-vencer').length || 0,
    conDeuda: habitaciones?.filter((h) => cobros.estado(h) === 'vencido').length || 0,
    vacantes: habitaciones?.filter((h) => h.estado === 'vacant').length || 0,
    exonerados: habitaciones?.filter((h) => h.estado === 'exonerated').length || 0,
    totalPorCobrar:
      habitaciones
        ?.filter((h) => h.estado === 'occupied')
        .reduce((sum, h) => sum + cobros.deuda(h), 0) || 0,
  };

  const handleCreate = () => {
    setSelectedHabitacion(null);
    setPestanaModal('habitacion');
    setIsModalOpen(true);
  };

  const handleCardClick = (hab: HabitacionConDetalles, pestana: PestanaHab = 'habitacion') => {
    setSelectedHabitacion(hab);
    setPestanaModal(pestana);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: HabitacionInput) => {
    try {
      if (selectedHabitacion) {
        await updateMutation.mutateAsync({ id: selectedHabitacion.id, data });
        notify.success('Habitación actualizada');
      } else {
        await createMutation.mutateAsync(data);
        notify.success('Habitación creada');
      }
      setIsModalOpen(false);
    } catch (error) {
      notify.error('Error al guardar');
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  const segments: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: stats.total },
    { key: 'debt', label: 'Vencidos', count: stats.conDeuda },
    { key: 'soon', label: 'Por vencer', count: stats.porVencer },
    { key: 'paid', label: 'Al día', count: stats.pagadas },
    { key: 'vacant', label: 'Vacantes', count: stats.vacantes },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <IconChip icon={Home} tone="teal" size="sm" />
            <span className="eyebrow">Operación</span>
          </div>
          <h1 className="page-title">Habitaciones</h1>
          <p className="page-subtitle hidden sm:block">
            {stats.ocupadas} ocupadas · {stats.conDeuda} vencidos · {stats.porVencer} por vencer · {stats.vacantes} vacantes
            {stats.exonerados > 0 && ` · ${stats.exonerados} exonerados`}
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <button onClick={() => refetch()} className="btn btn-outline">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Nueva habitación
          </button>
        </div>
      </div>

      {/* Filtros + selector de vista */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="segmented max-w-full overflow-x-auto no-scrollbar">
          {segments.map((seg) => (
            <button
              key={seg.key}
              onClick={() => setFilter(seg.key)}
              data-active={filter === seg.key}
              className="segmented-item"
            >
              <span>{seg.label}</span>
              <span
                className={cn(
                  'px-1.5 rounded-full text-[11px] font-semibold tabular-nums',
                  filter === seg.key ? 'bg-slate-900 text-white' : 'bg-white/70 text-slate-600'
                )}
              >
                {seg.count}
              </span>
            </button>
          ))}
        </div>

        <div className="segmented" role="tablist" aria-label="Vista">
          <button role="tab" aria-selected={vista === 'tarjetas'} data-active={vista === 'tarjetas'} onClick={() => setVista('tarjetas')} className="segmented-item">
            <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
          </button>
          <button role="tab" aria-selected={vista === 'plano'} data-active={vista === 'plano'} onClick={() => setVista('plano')} className="segmented-item">
            <Building2 className="w-3.5 h-3.5" /> Edificio
          </button>
        </div>
      </div>

      {/* Search + KPI mini */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar habitación o inquilino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="card px-4 py-2.5 flex items-center gap-4 text-sm">
          <div>
            <p className="text-[11px] text-slate-500">Deuda vencida</p>
            <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(stats.totalPorCobrar)}</p>
          </div>
        </div>
      </div>

      {/* Grid de habitaciones */}
      {filteredHabitaciones?.length === 0 && !(vista === 'plano' && habitaciones?.length) ? (
        <EmptyState
          title="No hay habitaciones"
          description={
            filter !== 'all'
              ? 'No hay habitaciones que coincidan con el filtro'
              : 'Crea tu primera habitación para empezar'
          }
          action={
            filter === 'all' && (
              <button onClick={handleCreate} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Habitación
              </button>
            )
          }
        />
      ) : vista === 'plano' ? (
        <VistaPlanos
          habitaciones={habitaciones || []}
          pisos={pisos || []}
          resaltadas={new Set(filteredHabitaciones?.map((h) => h.id))}
          onHabitacionClick={handleCardClick}
        />
      ) : (
        <TarjetasPorPiso
          habitaciones={filteredHabitaciones || []}
          pisos={pisos || []}
          onClick={(hab) => handleCardClick(hab)}
        />
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedHabitacion ? `Habitación ${selectedHabitacion.codigo}${selectedHabitacion.nombreInquilino ? ` · ${selectedHabitacion.nombreInquilino.split(' ')[0]}` : ''}` : 'Nueva habitación'}
        size={pestanaModal === 'contrato' || pestanaModal === 'tracking' || pestanaModal === 'resumen' ? '2xl' : 'lg'}
      >
        {selectedHabitacion && (
          <SeccionesTabs
            etiqueta="Secciones de la habitación"
            valor={pestanaModal}
            onCambiar={setPestanaModal}
            secciones={[
              { id: 'habitacion', label: 'Habitación', icon: DoorOpen, activo: 'bg-teal-600', icono: 'text-teal-600' },
              {
                id: 'inquilino',
                label: 'Inquilino',
                icon: UserRound,
                activo: 'bg-sky-600',
                icono: 'text-sky-600',
                detalle: selectedHabitacion.nombreInquilino?.split(' ')[0],
              },
              ...(selectedHabitacion.estado === 'occupied'
                ? ([
                    { id: 'pago', label: 'Registrar pago', icon: CreditCard, activo: 'bg-leaf-600', icono: 'text-leaf-600' },
                    { id: 'contrato', label: 'Contrato', icon: FileText, activo: 'bg-violet-600', icono: 'text-violet-600' },
                    { id: 'tracking', label: 'Tracking', icon: CalendarCheck, activo: 'bg-ochre-600', icono: 'text-ochre-600' },
                    { id: 'resumen', label: 'Resumen', icon: Sheet, activo: 'bg-primary-600', icono: 'text-primary-600' },
                  ] as Seccion<PestanaHab>[])
                : []),
            ]}
          />
        )}
        {selectedHabitacion && pestanaModal === 'resumen' ? (
          <ResumenImprimible
            habitaciones={habitacionesTodas ?? []}
            mesFin={mesActual}
            anioFin={anioActual}
            edificioInicial={selectedHabitacion.edificioId}
          />
        ) : selectedHabitacion && (pestanaModal === 'contrato' || pestanaModal === 'tracking') ? (
          <DocumentoHabitacion
            key={`${pestanaModal}-${selectedHabitacion.id}`}
            habitacion={selectedHabitacion}
            tipo={pestanaModal}
          />
        ) : selectedHabitacion && pestanaModal === 'pago' ? (
          <RegistrarPagoHabitacion
            key={`pago-${selectedHabitacion.id}`}
            habitacion={selectedHabitacion}
            onListo={() => setIsModalOpen(false)}
          />
        ) : selectedHabitacion && pestanaModal === 'inquilino' ? (
          <InquilinoDeHabitacion
            key={selectedHabitacion.id}
            habitacion={selectedHabitacion}
            onListo={() => setIsModalOpen(false)}
          />
        ) : (
          <HabitacionForm
            pisos={pisos || []}
            initialData={selectedHabitacion || undefined}
            inquilinoActivo={selectedHabitacion?.nombreInquilino}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </Modal>

      {/* FAB móvil */}
      <Fab onClick={handleCreate} icon={Plus} label="Nueva habitación" />
    </div>
  );
}
