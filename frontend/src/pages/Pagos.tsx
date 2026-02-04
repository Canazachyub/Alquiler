import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar, CreditCard, Printer, FileDown } from 'lucide-react';
import { PagoForm } from '@/components/forms';
import { Modal, LoadingPage, EmptyState } from '@/components/ui';
import { VoucherPago, printVoucher, generateVoucherPDF } from '@/components/voucher';
import {
  usePagosByMes,
  useResumenPagosMes,
  useCreatePago,
  useHabitacionesConEstadoPago,
  useInquilinos,
} from '@/hooks';
import { useConfigStore, useNotifications } from '@/store';
import { formatCurrency, formatDate, formatMonthYear, getMonthName } from '@/utils/formatters';
import { MESES } from '@/utils/constants';
import type { Pago, PagoInput } from '@/types';

export function Pagos() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [conceptoFilter, setConceptoFilter] = useState<string>('');
  const [voucherPago, setVoucherPago] = useState<Pago | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [preselectedHabitacionId, setPreselectedHabitacionId] = useState<string | null>(null);

  const { mesActual, anioActual, edificioSeleccionado, setMesAnio } = useConfigStore();
  const { notify } = useNotifications();

  const { data: pagos, isLoading } = usePagosByMes(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: resumen } = useResumenPagosMes(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: habitaciones } = useHabitacionesConEstadoPago(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: inquilinos } = useInquilinos();
  const createMutation = useCreatePago();

  // Auto-abrir modal si viene con parámetro hab en URL
  useEffect(() => {
    const habParam = searchParams.get('hab');
    if (habParam && habitaciones && habitaciones.length > 0) {
      setPreselectedHabitacionId(habParam);
      setIsModalOpen(true);
      // Limpiar el parámetro de la URL
      navigate('/pagos', { replace: true });
    }
  }, [searchParams, habitaciones, navigate]);

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

  const goToCurrentMonth = () => {
    const now = new Date();
    setMesAnio(now.getMonth() + 1, now.getFullYear());
  };

  // Filtrar pagos
  const filteredPagos = pagos?.filter((pago) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      pago.habitacion?.codigo.toLowerCase().includes(searchLower) ||
      pago.concepto.toLowerCase().includes(searchLower);

    const matchesConcepto = !conceptoFilter || pago.concepto === conceptoFilter;

    return matchesSearch && matchesConcepto;
  });

  const handleCreate = () => {
    setPreselectedHabitacionId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPreselectedHabitacionId(null);
  };

  const handleSubmit = async (data: PagoInput) => {
    try {
      const nuevoPago = await createMutation.mutateAsync(data);
      notify.success('Pago registrado correctamente');
      setIsModalOpen(false);
      // Mostrar voucher despues de registrar el pago
      if (nuevoPago) {
        setVoucherPago(nuevoPago);
        setIsVoucherModalOpen(true);
      }
    } catch (error) {
      notify.error('Error al registrar el pago');
    }
  };

  const handleViewVoucher = (pago: Pago) => {
    setVoucherPago(pago);
    setIsVoucherModalOpen(true);
  };

  const handlePrintVoucher = () => {
    printVoucher('voucher-pago');
  };

  const handleGeneratePDF = () => {
    if (!voucherPago) return;
    generateVoucherPDF({
      pago: voucherPago,
      inquilino: getInquilinoForPago(voucherPago),
      habitacion: getHabitacionForPago(voucherPago),
    });
  };

  const getInquilinoForPago = (pago: Pago) => {
    return inquilinos?.find((i) => i.habitacionId === pago.habitacionId && i.estado === 'activo');
  };

  const getHabitacionForPago = (pago: Pago) => {
    return habitaciones?.find((h) => h.id === pago.habitacionId);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500">Registro y seguimiento de pagos</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Registrar Pago
        </button>
      </div>

      {/* Navegación de meses */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Controles de navegación */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
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
            </div>

            <button
              onClick={() => navigateMonth(1)}
              className="btn btn-outline btn-sm"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>

            <button onClick={goToCurrentMonth} className="btn btn-success btn-sm">
              Mes Actual
            </button>
          </div>
        </div>

        {/* Resumen del mes */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Total Recaudado</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(resumen.totalRecaudado)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pagos Registrados</p>
              <p className="text-xl font-bold text-primary-600">{resumen.totalPagos}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Habitaciones Pagadas</p>
              <p className="text-xl font-bold text-green-600">{resumen.habitacionesPagadas}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-red-600">{resumen.habitacionesPendientes}</p>
            </div>
          </div>
        )}
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
                placeholder="Buscar por habitación o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Filtro por concepto */}
          <select
            value={conceptoFilter}
            onChange={(e) => setConceptoFilter(e.target.value)}
            className="select w-40"
          >
            <option value="">Todos</option>
            <option value="alquiler">Alquiler</option>
            <option value="internet">Internet</option>
            <option value="servicios">Servicios</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      {/* Indicador del mes */}
      <div className="bg-primary-600 text-white py-2 px-4 rounded-lg text-center font-medium">
        Mostrando pagos de {formatMonthYear(mesActual, anioActual)}
      </div>

      {/* Tabla de pagos */}
      {filteredPagos?.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No hay pagos registrados"
          description={`No hay pagos para ${getMonthName(mesActual)} ${anioActual}`}
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pago
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Habitacion</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Metodo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos?.map((pago) => (
                <tr key={pago.id}>
                  <td>{formatDate(pago.fecha)}</td>
                  <td>
                    <span className="font-medium">{pago.habitacion?.codigo || pago.habitacionId}</span>
                  </td>
                  <td className="capitalize">{pago.concepto}</td>
                  <td className="font-medium">{formatCurrency(pago.monto)}</td>
                  <td className="capitalize">{pago.metodoPago}</td>
                  <td>
                    <span
                      className={`badge ${
                        pago.estado === 'pagado'
                          ? 'badge-success'
                          : pago.estado === 'pendiente'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {pago.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewVoucher(pago)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver Voucher"
                    >
                      <Printer className="w-4 h-4 text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de registro de pago */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Registrar Pago"
        size="lg"
      >
        <PagoForm
          habitaciones={habitaciones || []}
          mesActual={mesActual}
          anioActual={anioActual}
          initialData={preselectedHabitacionId ? { habitacionId: preselectedHabitacionId } : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Modal de Voucher */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Voucher de Pago"
        size="sm"
      >
        <div className="space-y-4">
          {voucherPago && (
            <div id="voucher-pago">
              <VoucherPago
                pago={voucherPago}
                inquilino={getInquilinoForPago(voucherPago)}
                habitacion={getHabitacionForPago(voucherPago)}
              />
            </div>
          )}
          <div className="flex justify-center gap-3 pt-4 border-t">
            <button
              onClick={() => setIsVoucherModalOpen(false)}
              className="btn btn-outline"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrintVoucher}
              className="btn btn-outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </button>
            <button
              onClick={handleGeneratePDF}
              className="btn btn-primary"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Generar PDF
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
