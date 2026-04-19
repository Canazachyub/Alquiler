import { useEffect, useState } from 'react';
import { Bell, Calendar, Menu, SlidersHorizontal, X } from 'lucide-react';
import { useConfigStore } from '@/store';
import { useCiudades, useEdificiosByCiudad, useAlertas } from '@/hooks';
import { MESES } from '@/utils/constants';
import { getMonthName } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { AlertsPopover } from './AlertsPopover';

export function Header() {
  const {
    mesActual,
    anioActual,
    ciudadSeleccionada,
    edificioSeleccionado,
    setMesAnio,
    setCiudadSeleccionada,
    setEdificioSeleccionado,
    setSidebarMobileOpen,
  } = useConfigStore();

  const { data: ciudades } = useCiudades();
  const { data: edificios } = useEdificiosByCiudad(ciudadSeleccionada || '');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersAnimIn, setFiltersAnimIn] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alertas = useAlertas();
  const alertCount = alertas.length;
  const highestSeverity: 'danger' | 'warning' | 'info' | null =
    alertas.some((a) => a.severidad === 'danger') ? 'danger' :
    alertas.some((a) => a.severidad === 'warning') ? 'warning' :
    alertas.some((a) => a.severidad === 'info') ? 'info' :
    null;
  const dotColor =
    highestSeverity === 'danger' ? 'bg-red-500' :
    highestSeverity === 'warning' ? 'bg-amber-500' :
    highestSeverity === 'info' ? 'bg-primary-500' :
    null;

  // Animate drawer in after mount
  useEffect(() => {
    if (filtersOpen) {
      const id = requestAnimationFrame(() => setFiltersAnimIn(true));
      return () => cancelAnimationFrame(id);
    }
    setFiltersAnimIn(false);
  }, [filtersOpen]);

  const closeDrawer = () => {
    setFiltersAnimIn(false);
    setTimeout(() => setFiltersOpen(false), 200);
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-3 md:px-6 py-2.5 md:py-0 md:h-16 md:flex md:items-center md:justify-between">
      {/* Mobile row */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            Filtros
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMonthOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
            >
              <Calendar className="w-4 h-4 text-primary-500" />
              {getMonthName(mesActual)} {anioActual}
              <span aria-hidden className="text-slate-400">▾</span>
            </button>
            {monthOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMonthOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-popover border border-slate-200 p-3 z-50 space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Mes
                  </label>
                  <select
                    value={mesActual}
                    onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
                    className="select w-full text-sm"
                  >
                    {MESES.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Año
                  </label>
                  <select
                    value={anioActual}
                    onChange={(e) => setMesAnio(mesActual, Number(e.target.value))}
                    className="select w-full text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAlertsOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={`Notificaciones${alertCount > 0 ? ` (${alertCount})` : ''}`}
              aria-expanded={alertsOpen}
            >
              <Bell className="w-5 h-5 text-slate-500" />
              {dotColor && (
                <span className={cn(
                  'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-semibold text-white tabular-nums',
                  dotColor
                )}>
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
            {alertsOpen && (
              <AlertsPopover alertas={alertas} onClose={() => setAlertsOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Desktop: filtros globales */}
      <div className="hidden md:flex items-center gap-3">
        <select
          value={ciudadSeleccionada || ''}
          onChange={(e) => setCiudadSeleccionada(e.target.value || null)}
          className="select w-40 text-sm !py-2"
        >
          <option value="">Ciudades</option>
          {ciudades?.map((ciudad) => (
            <option key={ciudad.id} value={ciudad.id}>
              {ciudad.nombre}
            </option>
          ))}
        </select>

        <select
          value={edificioSeleccionado || ''}
          onChange={(e) => setEdificioSeleccionado(e.target.value || null)}
          className="select w-48 text-sm !py-2"
          disabled={!ciudadSeleccionada}
        >
          <option value="">Edificios</option>
          {edificios?.map((edificio) => (
            <option key={edificio.id} value={edificio.id}>
              {edificio.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: mes/ano + notificaciones */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
          <Calendar className="w-4 h-4 text-primary-500" />
          <select
            value={mesActual}
            onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
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
            className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAlertsOpen((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={`Notificaciones${alertCount > 0 ? ` (${alertCount})` : ''}`}
            aria-expanded={alertsOpen}
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {dotColor && (
              <span className={cn(
                'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-semibold text-white tabular-nums',
                dotColor
              )}>
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <AlertsPopover alertas={alertas} onClose={() => setAlertsOpen(false)} />
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="md:hidden">
          <div
            className={cn(
              'fixed inset-0 bg-slate-900/40 z-40 transition-opacity duration-200',
              filtersAnimIn ? 'opacity-100' : 'opacity-0'
            )}
            onClick={closeDrawer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className={cn(
              'fixed bottom-0 inset-x-0 rounded-t-2xl bg-white shadow-popover p-5 z-50',
              'transform transition-transform duration-200 ease-out',
              filtersAnimIn ? 'translate-y-0' : 'translate-y-full'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Filtros</h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Ciudad
                </label>
                <select
                  value={ciudadSeleccionada || ''}
                  onChange={(e) => setCiudadSeleccionada(e.target.value || null)}
                  className="select w-full text-sm"
                >
                  <option value="">Todas</option>
                  {ciudades?.map((ciudad) => (
                    <option key={ciudad.id} value={ciudad.id}>
                      {ciudad.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Edificio
                </label>
                <select
                  value={edificioSeleccionado || ''}
                  onChange={(e) => setEdificioSeleccionado(e.target.value || null)}
                  className="select w-full text-sm"
                  disabled={!ciudadSeleccionada}
                >
                  <option value="">Todos</option>
                  {edificios?.map((edificio) => (
                    <option key={edificio.id} value={edificio.id}>
                      {edificio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Mes
                  </label>
                  <select
                    value={mesActual}
                    onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
                    className="select w-full text-sm"
                  >
                    {MESES.map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Año
                  </label>
                  <select
                    value={anioActual}
                    onChange={(e) => setMesAnio(mesActual, Number(e.target.value))}
                    className="select w-full text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="btn btn-primary w-full mt-2"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
