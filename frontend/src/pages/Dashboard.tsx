import {
  Building2,
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '@/components/cards';
import { CobrarModal } from '@/components/forms';
import { Fab } from '@/components/ui/Fab';
import { LoadingPage, EmptyState, IconChip } from '@/components/ui';
import { PaymentCalendar } from '@/components/calendar';
import { useFiltroGlobal, useDashboard, useReporteHistorico, useHabitacionesConEstadoPago, usePagosByMes } from '@/hooks';
import { useConfigStore } from '@/store';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const { edificioSeleccionado, mesActual, anioActual, setMesAnio } = useConfigStore();
  const scope = useFiltroGlobal();
  const { data: stats, isLoading } = useDashboard(scope);
  const { data: historico } = useReporteHistorico(6, scope);
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
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <IconChip icon={LayoutDashboard} tone="primary" size="sm" />
            <span className="eyebrow">Resumen general</span>
          </div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Resumen de {getMonthName(mesActual)} {anioActual}
          </p>
        </div>
        <button onClick={() => setCobrarOpen(true)} className="btn btn-primary btn-lg whitespace-nowrap hidden sm:inline-flex">
          <CreditCard className="w-4 h-4" /> Registrar pago
        </button>
      </div>

      {/* Fila 1 — 3 KPIs prominentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <StatCard
          prominent
          title="Tasa de Ocupación"
          value={formatPercentage(stats.tasaOcupacion)}
          icon={Building2}
          tone="teal"
          progress={stats.tasaOcupacion}
          onClick={() => navigate('/habitaciones')}
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
          tone="leaf"
          variant="success"
          progress={stats.habitacionesOcupadas > 0 ? (stats.habitacionesPagadas / stats.habitacionesOcupadas) * 100 : 0}
          onClick={() => navigate('/pagos')}
          subtitle={`${stats.habitacionesPagadas} de ${stats.habitacionesOcupadas} habitaciones cobradas`}
        />
        <StatCard
          prominent
          title="Pagos Pendientes"
          value={stats.habitacionesPendientes}
          icon={AlertCircle}
          tone={stats.habitacionesPendientes > 0 ? 'coral' : 'leaf'}
          variant={stats.habitacionesPendientes > 0 ? 'danger' : 'success'}
          onClick={() => navigate('/habitaciones?filtro=deuda')}
          subtitle={
            stats.habitacionesPendientes > 0
              ? 'Toca para ver quién debe'
              : 'Todos al día este mes'
          }
        />
      </div>

      {/* Fila 2 — 4 KPIs secundarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Habitaciones"
          value={stats.totalHabitaciones}
          icon={Home}
          tone="teal"
          subtitle={`${stats.habitacionesOcupadas} ocupadas`}
        />
        <StatCard
          title="Habitaciones Pagadas"
          value={`${stats.habitacionesPagadas}/${stats.habitacionesOcupadas}`}
          icon={Users}
          tone="sky"
          variant="success"
        />
        <StatCard
          title="Gastos del mes"
          value={formatCurrency(stats.gastosMes)}
          icon={TrendingDown}
          tone="coral"
          onClick={() => navigate('/gastos')}
          variant="danger"
        />
        <StatCard
          title="Balance"
          value={formatCurrency(stats.balance)}
          icon={DollarSign}
          tone="olive"
          variant={stats.balance >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Gráfico y Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Gráfico de tendencias */}
        <div className="lg:col-span-2 card p-5 md:p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Ingresos vs gastos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Últimos 6 meses</p>
            </div>
            <button onClick={() => navigate('/reportes')} className="link-arrow text-xs">Ver reportes</button>
          </div>
          {chartData.length > 0 ? (
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DF" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6F717B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#A3A3AA' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E7E3DF',
                      boxShadow: '0 24px 48px -24px rgb(27 30 42 / 0.25)',
                      fontSize: '12px',
                      color: '#1B1E2A',
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#3F4350' }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#4FA65B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="gastos" name="Gastos" fill="#DF5E41" radius={[4, 4, 0, 0]} maxBarSize={28} />
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

      {/* Registrar pago rápido */}
      <CobrarModal isOpen={cobrarOpen} onClose={() => setCobrarOpen(false)} habitaciones={habitaciones} />
      <Fab onClick={() => setCobrarOpen(true)} icon={CreditCard} label="Registrar pago" />
    </div>
  );
}
