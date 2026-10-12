import { useConfigStore } from '@/store';

/** Alcance de los filtros globales del header, listo para mandar al backend. */
export function useFiltroGlobal() {
  const { mesActual, anioActual, edificioSeleccionado, ciudadSeleccionada } = useConfigStore();
  return {
    mes: mesActual,
    anio: anioActual,
    edificioId: edificioSeleccionado || undefined,
    // El backend prioriza edificio; ciudad solo aplica si no hay edificio elegido
    ciudadId: edificioSeleccionado ? undefined : ciudadSeleccionada || undefined,
  };
}
