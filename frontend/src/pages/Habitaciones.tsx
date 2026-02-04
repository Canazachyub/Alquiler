import { useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { RoomCard } from '@/components/cards';
import { HabitacionForm } from '@/components/forms';
import { Modal, LoadingPage, EmptyState } from '@/components/ui';
import {
  useHabitacionesConEstadoPago,
  useCreateHabitacion,
  useUpdateHabitacion,
  usePisos,
} from '@/hooks';
import { useConfigStore, useNotifications } from '@/store';
import { formatCurrency } from '@/utils/formatters';
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
    // Filtro por búsqueda
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      hab.codigo.toLowerCase().includes(searchLower) ||
      hab.nombreInquilino?.toLowerCase().includes(searchLower);

    // Filtro por estado
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

  // Calcular estadísticas
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habitaciones</h1>
          <p className="text-gray-500">Gestiona el estado de las habitaciones</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn btn-outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Habitación
          </button>
        </div>
      </div>

      {/* Panel de resumen */}
      <div className="card p-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h2 className="text-lg font-semibold mb-4">Resumen de Cobros del Mes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-80">Total por Cobrar</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalPorCobrar)}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-80">Con Deuda</p>
            <p className="text-2xl font-bold">{stats.conDeuda}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-80">Al Día</p>
            <p className="text-2xl font-bold">{stats.pagadas}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-80">Vacantes</p>
            <p className="text-2xl font-bold">{stats.vacantes}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Botones de filtro */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              Todas ({stats.total})
            </button>
            <button
              onClick={() => setFilter('debt')}
              className={`btn btn-sm ${filter === 'debt' ? 'btn-danger' : 'btn-outline'}`}
            >
              Con Deuda ({stats.conDeuda})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`btn btn-sm ${filter === 'paid' ? 'btn-success' : 'btn-outline'}`}
            >
              Al Día ({stats.pagadas})
            </button>
            <button
              onClick={() => setFilter('vacant')}
              className={`btn btn-sm ${filter === 'vacant' ? 'bg-gray-500 text-white' : 'btn-outline'}`}
            >
              Vacantes ({stats.vacantes})
            </button>
          </div>

          {/* Búsqueda */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código o inquilino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    </div>
  );
}
