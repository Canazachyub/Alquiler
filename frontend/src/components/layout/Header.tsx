import { Bell, Calendar } from 'lucide-react';
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
  } = useConfigStore();

  const { data: ciudades } = useCiudades();
  const { data: edificios } = useEdificiosByCiudad(ciudadSeleccionada || '');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Filtros globales */}
      <div className="flex items-center gap-4">
        {/* Selector de Ciudad */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Ciudad:</label>
          <select
            value={ciudadSeleccionada || ''}
            onChange={(e) => setCiudadSeleccionada(e.target.value || null)}
            className="select w-40"
          >
            <option value="">Todas</option>
            {ciudades?.map((ciudad) => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Edificio */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Edificio:</label>
          <select
            value={edificioSeleccionado || ''}
            onChange={(e) => setEdificioSeleccionado(e.target.value || null)}
            className="select w-48"
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
      </div>

      {/* Selector de Mes/Año y Notificaciones */}
      <div className="flex items-center gap-4">
        {/* Selector de Mes */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={mesActual}
            onChange={(e) => setMesAnio(Number(e.target.value), anioActual)}
            className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
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
            className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Botón de notificaciones */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
