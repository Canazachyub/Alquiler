import {
  Building2,
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/cards';
import { LoadingPage, EmptyState } from '@/components/ui';
import { PaymentCalendar } from '@/components/calendar';
import { useDashboard, useReporteHistorico, useHabitacionesConEstadoPago, usePagosByMes } from '@/hooks';
import { useConfigStore } from '@/store';
import { formatCurrency, formatPercentage, getMonthName } from '@/utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function Dashboard() {
  const { edificioSeleccionado, mesActual, anioActual, setMesAnio } = useConfigStore();
  const { data: stats, isLoading } = useDashboard(edificioSeleccionado || undefined);
  const { data: historico } = useReporteHistorico(6, edificioSeleccionado || undefined);
  const { data: habitaciones = [] } = useHabitacionesConEstadoPago(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: pagos = [] } = usePagosByMes(mesActual, anioActual, edificioSeleccionado || undefined);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!stats) {
    return (
      <EmptyState
        title="Sin datos"
        description="No hay datos disponibles para mostrar"
      />
    );
  }

  // Preparar datos para el gráfico
  const chartData =
    historico?.map((r) => ({
      mes: getMonthName(r.mes).substring(0, 3),
      ingresos: r.ingresos,
      gastos: r.gastos,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Resumen de {getMonthName(mesActual)} {anioActual}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Habitaciones"
          value={stats.totalHabitaciones}
          icon={Home}
          subtitle={`${stats.habitacionesOcupadas} ocupadas`}
        />
        <StatCard
          title="Tasa de Ocupación"
          value={formatPercentage(stats.tasaOcupacion)}
          icon={Building2}
          variant={stats.tasaOcupacion >= 80 ? 'success' : stats.tasaOcupacion >= 50 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(stats.ingresosMes)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Gastos del Mes"
          value={formatCurrency(stats.gastosMes)}
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* Segunda fila de stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Balance"
          value={formatCurrency(stats.balance)}
          icon={DollarSign}
          variant={stats.balance >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Habitaciones Pagadas"
          value={`${stats.habitacionesPagadas}/${stats.habitacionesOcupadas}`}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Pagos Pendientes"
          value={stats.habitacionesPendientes}
          icon={AlertCircle}
          variant={stats.habitacionesPendientes > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Gráfico y Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de tendencias */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold mb-4">Ingresos vs Gastos (Últimos 6 meses)</h2>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Sin datos históricos"
              description="No hay datos suficientes para mostrar el gráfico"
            />
          )}
        </div>

        {/* Calendario de pagos - muestra cada inquilino en su dia de pago segun fecha de ingreso */}
        <div className="lg:col-span-1">
          <PaymentCalendar
            habitaciones={habitaciones}
            pagos={pagos}
            mes={mesActual}
            anio={anioActual}
            onMonthChange={setMesAnio}
          />
        </div>
      </div>

      {/* Alertas rápidas */}
      {stats.habitacionesPendientes > 0 && (
        <div className="card p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                {stats.habitacionesPendientes} habitación(es) con pagos pendientes
              </p>
              <p className="text-sm text-red-600">
                Revisa la sección de habitaciones para ver el detalle
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
