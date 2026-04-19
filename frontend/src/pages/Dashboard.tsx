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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Resumen de {getMonthName(mesActual)} {anioActual}
        </p>
      </div>

      {/* Fila 1 — 3 KPIs prominentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <StatCard
          prominent
          title="Tasa de Ocupación"
          value={formatPercentage(stats.tasaOcupacion)}
          icon={Building2}
          variant={
            stats.tasaOcupacion >= 80
              ? 'success'
              : stats.tasaOcupacion >= 50
              ? 'warning'
              : 'danger'
          }
          subtitle={`${stats.habitacionesOcupadas} de ${stats.totalHabitaciones} habitaciones`}
        />
        <StatCard
          prominent
          title="Ingresos del mes"
          value={formatCurrency(stats.ingresosMes)}
          icon={TrendingUp}
          variant="success"
          subtitle={`Balance: ${formatCurrency(stats.balance)}`}
        />
        <StatCard
          prominent
          title="Pagos Pendientes"
          value={stats.habitacionesPendientes}
          icon={AlertCircle}
          variant={stats.habitacionesPendientes > 0 ? 'danger' : 'success'}
          subtitle={
            stats.habitacionesPendientes > 0
              ? 'Revisa Habitaciones'
              : 'Al día este mes'
          }
        />
      </div>

      {/* Fila 2 — 4 KPIs secundarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Habitaciones"
          value={stats.totalHabitaciones}
          icon={Home}
          subtitle={`${stats.habitacionesOcupadas} ocupadas`}
        />
        <StatCard
          title="Habitaciones Pagadas"
          value={`${stats.habitacionesPagadas}/${stats.habitacionesOcupadas}`}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Gastos del mes"
          value={formatCurrency(stats.gastosMes)}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Balance"
          value={formatCurrency(stats.balance)}
          icon={DollarSign}
          variant={stats.balance >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Gráfico y Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Gráfico de tendencias */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Ingresos vs Gastos (6 meses)
          </h2>
          {chartData.length > 0 ? (
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                      fontSize: '12px',
                      color: '#1e293b',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#dc2626" radius={[4, 4, 0, 0]} />
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

        {/* Calendario de pagos */}
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
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">
                {stats.habitacionesPendientes} habitación(es) con pagos pendientes
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Revisa la sección de habitaciones para ver el detalle
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
