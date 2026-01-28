import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui';
import { useDashboard, useReporteHistorico } from '@/hooks';
import { useConfigStore } from '@/store';
import { formatCurrency, formatMonthYear, getMonthName } from '@/utils/formatters';
import { MESES } from '@/utils/constants';

export function Reportes() {
  const { mesActual, anioActual, setMesAnio } = useConfigStore();
  const [mesesHistorico, setMesesHistorico] = useState(6);

  const { data: stats, isLoading: loadingStats } = useDashboard();
  const { data: historico, isLoading: loadingHistorico } = useReporteHistorico(mesesHistorico);

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  if (loadingStats || loadingHistorico) {
    return <LoadingPage />;
  }

  const maxIngreso = Math.max(...(historico?.map((h) => h.ingresos) || [1]));
  const maxGasto = Math.max(...(historico?.map((h) => h.gastos) || [1]));
  const maxValue = Math.max(maxIngreso, maxGasto);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Analisis financiero y estadisticas</p>
        </div>
        <button className="btn btn-outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </button>
      </div>

      {/* Selector de periodo */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => navigateMonth(-1)} className="btn btn-outline btn-sm">
            <ChevronLeft className="w-4 h-4" />
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

          <button onClick={() => navigateMonth(1)} className="btn btn-outline btn-sm">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Historico:</span>
            <select
              value={mesesHistorico}
              onChange={(e) => setMesesHistorico(Number(e.target.value))}
              className="select w-28"
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="bg-primary-600 text-white py-3 px-4 rounded-lg text-center font-medium">
        Reporte de {formatMonthYear(mesActual, anioActual)}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.ingresosMes || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gastos</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats?.gastosMes || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p
                className={`text-2xl font-bold ${
                  (stats?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(stats?.balance || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ocupacion</p>
              <p className="text-2xl font-bold text-primary-600">
                {(stats?.tasaOcupacion || 0).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de habitaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-primary-600">{stats?.totalHabitaciones || 0}</div>
          <p className="text-gray-500 mt-1">Total Habitaciones</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-green-600">{stats?.habitacionesOcupadas || 0}</div>
          <p className="text-gray-500 mt-1">Ocupadas</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-gray-400">{stats?.habitacionesVacantes || 0}</div>
          <p className="text-gray-500 mt-1">Vacantes</p>
        </div>
      </div>

      {/* Grafico de barras historico */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Historico de Ingresos y Gastos</h2>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">Gastos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Balance</span>
          </div>
        </div>

        {/* Grafico simple de barras */}
        <div className="space-y-4">
          {historico?.map((mes, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium w-24">
                  {getMonthName(mes.mes).slice(0, 3)} {mes.anio}
                </span>
                <div className="flex-1 mx-4">
                  <div className="flex gap-1 h-6">
                    {/* Barra de ingresos */}
                    <div
                      className="bg-green-500 rounded-sm transition-all duration-300"
                      style={{
                        width: `${maxValue > 0 ? (mes.ingresos / maxValue) * 100 : 0}%`,
                      }}
                    />
                    {/* Barra de gastos */}
                    <div
                      className="bg-red-500 rounded-sm transition-all duration-300"
                      style={{
                        width: `${maxValue > 0 ? (mes.gastos / maxValue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right w-32">
                  <span
                    className={`font-medium ${mes.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(mes.balance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla resumen */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Detalle por Mes</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th className="text-right">Ingresos</th>
              <th className="text-right">Gastos</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {historico?.map((mes, index) => (
              <tr key={index}>
                <td className="font-medium">
                  {getMonthName(mes.mes)} {mes.anio}
                </td>
                <td className="text-right text-green-600">{formatCurrency(mes.ingresos)}</td>
                <td className="text-right text-red-600">{formatCurrency(mes.gastos)}</td>
                <td
                  className={`text-right font-medium ${
                    mes.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(mes.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="font-bold">TOTAL</td>
              <td className="text-right font-bold text-green-600">
                {formatCurrency(historico?.reduce((sum, m) => sum + m.ingresos, 0) || 0)}
              </td>
              <td className="text-right font-bold text-red-600">
                {formatCurrency(historico?.reduce((sum, m) => sum + m.gastos, 0) || 0)}
              </td>
              <td
                className={`text-right font-bold ${
                  (historico?.reduce((sum, m) => sum + m.balance, 0) || 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(historico?.reduce((sum, m) => sum + m.balance, 0) || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
