import { Bell, Calendar, Menu } from 'lucide-react';
import { useConfigStore } from '@/store';
import { useCiudades, useEdificiosByCiudad } from '@/hooks';
import { MESES } from '@/utils/constants';

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

  return (
    <header className="bg-white border-b border-gray-200/80 px-3 md:px-6 py-2.5 md:py-0 md:h-16 md:flex md:items-center md:justify-between">
      <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {/* Filtros globales */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 md:flex-none overflow-x-auto">
          <select
            value={ciudadSeleccionada || ''}
            onChange={(e) => setCiudadSeleccionada(e.target.value || null)}
            className="select w-28 md:w-40 text-xs md:text-sm !py-2"
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
            className="select w-28 md:w-48 text-xs md:text-sm !py-2"
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

        {/* Notifications - visible on mobile header row */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
        </button>
      </div>

      {/* Selector de Mes/Ano y Notificaciones */}
      <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 mt-2 md:mt-0">
        <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 rounded-lg px-2.5 md:px-3 py-1.5 border border-gray-200/60">
          <Calendar className="w-4 h-4 text-primary-500 hidden md:block" />
          <select
            value={mesActual}
            onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
            className="bg-transparent border-none text-xs md:text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
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
            className="bg-transparent border-none text-xs md:text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications - desktop only */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors hidden md:block">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
