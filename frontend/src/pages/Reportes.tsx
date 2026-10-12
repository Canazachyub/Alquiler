import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Download,
} from 'lucide-react';
import { LoadingPage, IconChip, SelectorMes, Modal } from '@/components/ui';
import { AnaliticaCobranza } from '@/components/reportes/AnaliticaCobranza';
import { ResumenImprimible } from '@/components/voucher';
import { useDashboard, useReporteHistorico, useFiltroGlobal, useHabitacionesConEstadoPago, useEdificiosByCiudad } from '@/hooks';
import { useConfigStore } from '@/store';
import { formatCurrency, getMonthName } from '@/utils/formatters';

export function Reportes() {
  const { mesActual, anioActual, edificioSeleccionado, ciudadSeleccionada } = useConfigStore();
  const [mesesHistorico, setMesesHistorico] = useState(6);
  const [exportarOpen, setExportarOpen] = useState(false);
  const { data: habsEstado } = useHabitacionesConEstadoPago(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: edificiosCiudad } = useEdificiosByCiudad(ciudadSeleccionada || '');
  const habitaciones = (habsEstado ?? []).filter(
    (h) => edificioSeleccionado || !ciudadSeleccionada || !edificiosCiudad || edificiosCiudad.some((e) => e.id === h.edificioId)
  );

  const scope = useFiltroGlobal();
  const { data: stats, isLoading: loadingStats } = useDashboard(scope);
  const { data: historico, isLoading: loadingHistorico } = useReporteHistorico(mesesHistorico, scope);



  if (loadingStats || loadingHistorico) {
    return <LoadingPage />;
  }

  const maxIngreso = Math.max(...(historico?.map((h) => h.ingresos) || [1]));
  const maxGasto = Math.max(...(historico?.map((h) => h.gastos) || [1]));
  const maxValue = Math.max(maxIngreso, maxGasto);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IconChip icon={BarChart3} tone="olive" size="sm" />
            <span className="eyebrow">Analítica</span>
          </div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">{getMonthName(mesActual)} {anioActual}</p>
        </div>
        <button onClick={() => setExportarOpen(true)} className="btn btn-secondary">
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Selector de periodo */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SelectorMes />

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Histórico:</span>
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Ingresos</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                {formatCurrency(stats?.ingresosMes || 0)}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-emerald-100 items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Gastos</p>
              <p className="text-2xl font-bold text-red-600 tabular-nums">
                {formatCurrency(stats?.gastosMes || 0)}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-red-100 items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Balance</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  (stats?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(stats?.balance || 0)}
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary-100 items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Ocupación</p>
              <p className="text-2xl font-bold text-primary-600 tabular-nums">
                {(stats?.tasaOcupacion || 0).toFixed(1)}%
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary-100 items-center justify-center">
              <Home className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de habitaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-primary-600 tabular-nums">{stats?.totalHabitaciones || 0}</div>
          <p className="text-slate-500 mt-1">Total Habitaciones</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-emerald-600 tabular-nums">{stats?.habitacionesOcupadas || 0}</div>
          <p className="text-slate-500 mt-1">Ocupadas</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-4xl font-bold text-slate-400 tabular-nums">{stats?.habitacionesVacantes || 0}</div>
          <p className="text-slate-500 mt-1">Vacantes</p>
        </div>
      </div>

      {/* Grafico de barras historico */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold">Histórico de Ingresos y Gastos</h2>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-sm text-slate-600">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-slate-600">Gastos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary-500"></div>
            <span className="text-sm text-slate-600">Balance</span>
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
                      className="bg-emerald-500 rounded-sm transition-all duration-300"
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
                    className={`font-medium tabular-nums ${mes.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
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
        <div className="p-4 border-b border-slate-200">
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
                <td className="text-right text-emerald-600 tabular-nums">{formatCurrency(mes.ingresos)}</td>
                <td className="text-right text-red-600 tabular-nums">{formatCurrency(mes.gastos)}</td>
                <td
                  className={`text-right font-medium tabular-nums ${
                    mes.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(mes.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="font-bold">TOTAL</td>
              <td className="text-right font-bold text-emerald-600 tabular-nums">
                {formatCurrency(historico?.reduce((sum, m) => sum + m.ingresos, 0) || 0)}
              </td>
              <td className="text-right font-bold text-red-600 tabular-nums">
                {formatCurrency(historico?.reduce((sum, m) => sum + m.gastos, 0) || 0)}
              </td>
              <td
                className={`text-right font-bold tabular-nums ${
                  (historico?.reduce((sum, m) => sum + m.balance, 0) || 0) >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(historico?.reduce((sum, m) => sum + m.balance, 0) || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Analítica de cobranza */}
      <AnaliticaCobranza habitaciones={habitaciones} mesFin={mesActual} anioFin={anioActual} meses={mesesHistorico} />

      <Modal isOpen={exportarOpen} onClose={() => setExportarOpen(false)} title="Exportar resumen en PDF" size="2xl">
        {exportarOpen && (
          <ResumenImprimible habitaciones={habsEstado ?? []} mesFin={mesActual} anioFin={anioActual} edificioInicial={edificioSeleccionado} />
        )}
      </Modal>
    </div>
  );
}
