import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar, CreditCard, Printer, FileDown, Zap } from 'lucide-react';
import { PagoForm } from '@/components/forms';
import { Modal, LoadingPage, EmptyState } from '@/components/ui';
import { Fab } from '@/components/ui/Fab';
import { VoucherPago, printVoucher, generateVoucherPDF } from '@/components/voucher';
import { printThermalVoucher, isThermalPrinterAvailable, connectThermalPrinter, checkThermalPrinter } from '@/utils/thermalPrint';
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
  const [thermalAvailable, setThermalAvailable] = useState(false);
  const [thermalPrinting, setThermalPrinting] = useState(false);
  const [thermalConnected, setThermalConnected] = useState(false);
  const [thermalConnecting, setThermalConnecting] = useState(false);

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
      notify.success('Pago registrado');
      setIsModalOpen(false);
      // Mostrar voucher despues de registrar el pago
      if (nuevoPago) {
        setVoucherPago(nuevoPago);
        setIsVoucherModalOpen(true);
      }
    } catch (error) {
      notify.error('No se pudo guardar. Intenta de nuevo.');
    }
  };

  const handleViewVoucher = (pago: Pago) => {
    setVoucherPago(pago);
    setIsVoucherModalOpen(true);
  };

  // Check if thermal printer server is running
  useEffect(() => {
    if (isVoucherModalOpen) {
      isThermalPrinterAvailable().then(setThermalAvailable);
      checkThermalPrinter()
        .then((s) => setThermalConnected(s.printer_connected))
        .catch(() => setThermalConnected(false));
    }
  }, [isVoucherModalOpen]);

  const handleThermalConnect = async () => {
    setThermalConnecting(true);
    try {
      await connectThermalPrinter();
      setThermalConnected(true);
      notify.success('Impresora termica conectada');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al conectar';
      notify.error(msg);
    } finally {
      setThermalConnecting(false);
    }
  };

  const handlePrintVoucher = () => {
    printVoucher('voucher-pago');
  };

  const handleThermalPrint = async () => {
    if (!voucherPago || thermalPrinting) return;
    setThermalPrinting(true);
    try {
      await printThermalVoucher({
        pago: voucherPago,
        inquilino: getInquilinoForPago(voucherPago),
        habitacion: getHabitacionForPago(voucherPago),
      });
      notify.success('Voucher impreso en impresora termica');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al imprimir';
      notify.error(msg);
    } finally {
      setThermalPrinting(false);
    }
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
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title">Pagos</h1>
          <p className="page-subtitle">
            {formatCurrency(resumen?.totalRecaudado || 0)} · {getMonthName(mesActual)} {anioActual}
          </p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary whitespace-nowrap hidden md:inline-flex">
          <Plus className="w-4 h-4" />
          <span>Registrar Pago</span>
        </button>
      </div>

      {/* Navegación de meses */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
          {/* Controles de navegación */}
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
            <button
              onClick={() => navigateMonth(-1)}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1 md:gap-2">
              <Calendar className="w-4 h-4 text-slate-400 hidden md:block" />
              <select
                value={mesActual}
                onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
                className="select w-24 md:w-32 text-xs md:text-sm"
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
                className="select w-20 md:w-24 text-xs md:text-sm"
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
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button onClick={goToCurrentMonth} className="btn btn-success btn-sm">
              Hoy
            </button>
          </div>
        </div>

        {/* Resumen del mes */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-500 normal-case">Total Recaudado</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatCurrency(resumen.totalRecaudado)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 normal-case">Pagos</p>
              <p className="text-lg md:text-xl font-bold text-primary-700 mt-1 tabular-nums">{resumen.totalPagos}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 normal-case">Pagadas</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 mt-1 tabular-nums">{resumen.habitacionesPagadas}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 normal-case">Pendientes</p>
              <p className="text-lg md:text-xl font-bold text-red-700 mt-1 tabular-nums">{resumen.habitacionesPendientes}</p>
            </div>
          </div>
        )}
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
                placeholder="Buscar..."
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
            className="select w-32 md:w-40"
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2.5 px-4 rounded-xl text-center font-semibold text-sm md:text-base tracking-wide shadow-sm">
        Pagos de {formatMonthYear(mesActual, anioActual)}
      </div>

      {/* Tabla de pagos */}
      {filteredPagos?.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aún no hay pagos"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Registrar pago
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="hidden sm:table-cell">Fecha</th>
                <th>Hab.</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th className="hidden md:table-cell">Método</th>
                <th>Estado</th>
                <th>Acc.</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos?.map((pago) => (
                <tr key={pago.id}>
                  <td className="hidden sm:table-cell tabular-nums">{formatDate(pago.fecha)}</td>
                  <td>
                    <span className="font-medium">{pago.habitacion?.codigo || pago.habitacionId}</span>
                  </td>
                  <td className="capitalize">{pago.concepto}</td>
                  <td className="font-medium tabular-nums">{formatCurrency(pago.monto)}</td>
                  <td className="capitalize hidden md:table-cell">{pago.metodoPago}</td>
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
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Ver Voucher"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAB móvil */}
      <Fab onClick={handleCreate} label="Registrar pago" />

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
          <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsVoucherModalOpen(false)}
              className="btn btn-outline"
            >
              Cerrar
            </button>
            {thermalAvailable && !thermalConnected && (
              <button
                onClick={handleThermalConnect}
                disabled={thermalConnecting}
                className="btn bg-slate-600 hover:bg-slate-700 text-white"
              >
                <Zap className="w-4 h-4" />
                {thermalConnecting ? 'Conectando...' : 'Conectar Impresora'}
              </button>
            )}
            {thermalAvailable && thermalConnected && (
              <button
                onClick={handleThermalPrint}
                disabled={thermalPrinting}
                className="btn bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Zap className="w-4 h-4" />
                {thermalPrinting ? 'Imprimiendo...' : 'Imp. Térmica'}
              </button>
            )}
            <button
              onClick={handlePrintVoucher}
              className="btn btn-outline"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleGeneratePDF}
              className="btn btn-primary"
            >
              <FileDown className="w-4 h-4" />
              Generar PDF
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
