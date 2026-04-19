import { useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { RoomCard } from '@/components/cards';
import { HabitacionForm } from '@/components/forms';
import { Modal, LoadingPage, EmptyState } from '@/components/ui';
import { Fab } from '@/components/ui/Fab';
import {
  useHabitacionesConEstadoPago,
  useCreateHabitacion,
  useUpdateHabitacion,
  usePisos,
} from '@/hooks';
import { useConfigStore, useNotifications } from '@/store';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { HabitacionConDetalles, HabitacionInput } from '@/types';

type FilterType = 'all' | 'paid' | 'debt' | 'vacant';

export function Habitaciones() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabitacion, setSelectedHabitacion] = useState<HabitacionConDetalles | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { mesActual, anioActual, edificioSeleccionado } = useConfigStore();
  const { notify } = useNotifications();

  const { data: habitaciones, isLoading, refetch } = useHabitacionesConEstadoPago(
    mesActual,
    anioActual,
    edificioSeleccionado || undefined
  );

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
      matchesFilter = hab.estado === 'occupied' && hab.alquilerPagado === true;
    } else if (filter === 'debt') {
      matchesFilter = hab.estado === 'occupied' && !hab.alquilerPagado;
    } else if (filter === 'vacant') {
      matchesFilter = hab.estado === 'vacant';
    }

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: habitaciones?.length || 0,
    ocupadas: habitaciones?.filter((h) => h.estado === 'occupied').length || 0,
    pagadas: habitaciones?.filter((h) => h.estado === 'occupied' && h.alquilerPagado).length || 0,
    conDeuda: habitaciones?.filter((h) => h.estado === 'occupied' && !h.alquilerPagado).length || 0,
    vacantes: habitaciones?.filter((h) => h.estado === 'vacant').length || 0,
    totalPorCobrar:
      habitaciones
        ?.filter((h) => h.estado === 'occupied' && !h.alquilerPagado)
        .reduce((sum, h) => sum + h.montoAlquiler + (h.internetPagado ? 0 : h.montoInternet), 0) || 0,
  };

  const handleCreate = () => {
    setSelectedHabitacion(null);
    setIsModalOpen(true);
  };

  const handleCardClick = (hab: HabitacionConDetalles) => {
    setSelectedHabitacion(hab);
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
    { key: 'debt', label: 'Con deuda', count: stats.conDeuda },
    { key: 'paid', label: 'Al día', count: stats.pagadas },
    { key: 'vacant', label: 'Vacantes', count: stats.vacantes },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title">Habitaciones</h1>
          <p className="page-subtitle hidden sm:block">
            {stats.ocupadas} ocupadas · {stats.conDeuda} con deuda · {stats.vacantes} vacantes
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

      {/* Segmented control de filtros */}
      <div className="card p-2 flex items-center gap-1 overflow-x-auto">
        {segments.map((seg) => (
          <button
            key={seg.key}
            onClick={() => setFilter(seg.key)}
            className={cn(
              'flex items-center gap-2 px-3 md:px-4 h-9 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150',
              filter === seg.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <span>{seg.label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums',
                filter === seg.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {seg.count}
            </span>
          </button>
        ))}
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
            <p className="text-[11px] text-slate-500">Por cobrar</p>
            <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(stats.totalPorCobrar)}</p>
          </div>
        </div>
      </div>

      {/* Grid de habitaciones */}
      {filteredHabitaciones?.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filteredHabitaciones?.map((hab) => (
            <RoomCard
              key={hab.id}
              habitacion={hab}
              onClick={() => handleCardClick(hab)}
            />
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedHabitacion ? `Habitación ${selectedHabitacion.codigo}` : 'Nueva Habitación'}
        size="lg"
      >
        <HabitacionForm
          pisos={pisos || []}
          initialData={selectedHabitacion || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* FAB móvil */}
      <Fab onClick={handleCreate} icon={Plus} label="Nueva habitación" />
    </div>
  );
}
