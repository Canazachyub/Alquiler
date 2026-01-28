import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  // Mes y año actual seleccionado
  mesActual: number;
  anioActual: number;

  // Filtros globales
  ciudadSeleccionada: string | null;
  edificioSeleccionado: string | null;

  // UI
  sidebarCollapsed: boolean;

  // Actions
  setMesAnio: (mes: number, anio: number) => void;
  setCiudadSeleccionada: (ciudadId: string | null) => void;
  setEdificioSeleccionado: (edificioId: string | null) => void;
  toggleSidebar: () => void;
  resetFiltros: () => void;
}

const now = new Date();

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      mesActual: now.getMonth() + 1,
      anioActual: now.getFullYear(),
      ciudadSeleccionada: null,
      edificioSeleccionado: null,
      sidebarCollapsed: false,

      setMesAnio: (mes, anio) => set({ mesActual: mes, anioActual: anio }),

      setCiudadSeleccionada: (ciudadId) =>
        set({
          ciudadSeleccionada: ciudadId,
          edificioSeleccionado: null, // Reset edificio al cambiar ciudad
        }),

      setEdificioSeleccionado: (edificioId) => set({ edificioSeleccionado: edificioId }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      resetFiltros: () =>
        set({
          ciudadSeleccionada: null,
          edificioSeleccionado: null,
        }),
    }),
    {
      name: 'alquiler-config',
      partialize: (state) => ({
        mesActual: state.mesActual,
        anioActual: state.anioActual,
        ciudadSeleccionada: state.ciudadSeleccionada,
        edificioSeleccionado: state.edificioSeleccionado,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
