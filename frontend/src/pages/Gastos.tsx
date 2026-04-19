import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Receipt, Trash2 } from 'lucide-react';
import { GastoForm } from '@/components/forms';
import { Modal, ConfirmDialog, LoadingPage, EmptyState } from '@/components/ui';
import { Fab } from '@/components/ui/Fab';
import {
  useGastosByMes,
  useResumenGastosPorCategoria,
  useCreateGasto,
  useDeleteGasto,
  useEdificios,
  useHabitaciones,
} from '@/hooks';
import { useConfigStore, useNotifications } from '@/store';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatters';
import { MESES, CATEGORIAS_GASTO } from '@/utils/constants';
import type { Gasto, GastoInput } from '@/types';

export function Gastos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingGasto, setDeletingGasto] = useState<Gasto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');

  const { mesActual, anioActual, edificioSeleccionado, setMesAnio } = useConfigStore();
  const { notify } = useNotifications();

  const { data: gastos, isLoading } = useGastosByMes(
    mesActual,
    anioActual,
    edificioSeleccionado || undefined
  );
  const { data: resumenCategoria } = useResumenGastosPorCategoria(
    mesActual,
    anioActual,
    edificioSeleccionado || undefined
  );
  const { data: edificios } = useEdificios();
  const { data: habitaciones } = useHabitaciones();
  const createMutation = useCreateGasto();
  const deleteMutation = useDeleteGasto();

  // Navegar meses
  const navigateMonth = (delta: number) => {
    let newMonth = mesActual + delta;
    let newYear = anioActual;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setMesAnio(newMonth, newYear);
  };

  // Filtrar gastos
  const filteredGastos = gastos?.filter((gasto) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm || gasto.concepto.toLowerCase().includes(searchLower);

    const matchesCategoria = !categoriaFilter || gasto.categoria === categoriaFilter;

    return matchesSearch && matchesCategoria;
  });

  // Calcular total
  const totalGastos = filteredGastos?.reduce((sum, g) => sum + g.monto, 0) || 0;
  const totalMes = gastos?.reduce((sum, g) => sum + g.monto, 0) || 0;

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: GastoInput) => {
    try {
      await createMutation.mutateAsync(data);
      notify.success('Gasto registrado');
      setIsModalOpen(false);
    } catch (error) {
      notify.error('No se pudo guardar. Intenta de nuevo.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingGasto) return;
    try {
      await deleteMutation.mutateAsync(deletingGasto.id);
      notify.success('Gasto eliminado');
      setDeletingGasto(null);
    } catch (error) {
      notify.error('No se pudo eliminar. Intenta de nuevo.');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title">Gastos</h1>
          <p className="page-subtitle">
            {formatCurrency(totalMes)} · {getMonthName(mesActual)} {anioActual}
          </p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary whitespace-nowrap hidden md:inline-flex">
          <Plus className="w-4 h-4" />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      {/* Navegación de meses */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigateMonth(-1)} className="btn btn-outline btn-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={mesActual}
              onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
              className="select w-32"
            >
              {MESES.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
            <select
              value={anioActual}
              onChange={(e) => setMesAnio(mesActual, Number(e.target.value))}
              className="select w-24"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button onClick={() => navigateMonth(1)} className="btn btn-outline btn-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-lg font-bold text-red-700 tabular-nums">
            Total: {formatCurrency(totalGastos)}
          </div>
        </div>

        {/* Resumen por categoría */}
        {resumenCategoria && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200">
            {CATEGORIAS_GASTO.map((cat) => (
              <div key={cat.value}>
                <p className="text-xs font-semibold text-slate-500 normal-case">{cat.label}</p>
                <p className="text-base md:text-lg font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(resumenCategoria[cat.value] || 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="select w-36 md:w-40"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS_GASTO.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de gastos */}
      {filteredGastos?.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aún no hay gastos"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Nuevo gasto
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="hidden sm:table-cell">Fecha</th>
                <th>Concepto</th>
                <th className="hidden md:table-cell">Categoría</th>
                <th>Monto</th>
                <th className="hidden md:table-cell">Hab.</th>
                <th>Acc.</th>
              </tr>
            </thead>
            <tbody>
              {filteredGastos?.map((gasto) => (
                <tr key={gasto.id}>
                  <td className="hidden sm:table-cell tabular-nums">{formatDate(gasto.fecha)}</td>
                  <td>{gasto.concepto}</td>
                  <td className="hidden md:table-cell">
                    <span className="badge badge-info capitalize">{gasto.categoria}</span>
                  </td>
                  <td className="font-semibold text-red-700 tabular-nums">
                    {formatCurrency(gasto.monto)}
                  </td>
                  <td className="text-slate-500 hidden md:table-cell">
                    {gasto.habitacion?.codigo || 'General'}
                  </td>
                  <td>
                    <button
                      onClick={() => setDeletingGasto(gasto)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAB móvil */}
      <Fab onClick={handleCreate} label="Nuevo gasto" />

      {/* Modal de registro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Gasto"
        size="lg"
      >
        <GastoForm
          edificios={edificios || []}
          habitaciones={habitaciones || []}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deletingGasto}
        onClose={() => setDeletingGasto(null)}
        onConfirm={confirmDelete}
        title="Eliminar Gasto"
        message={`¿Eliminar el gasto "${deletingGasto?.concepto ?? ''}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
