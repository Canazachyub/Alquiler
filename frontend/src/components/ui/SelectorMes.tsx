import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useConfigStore } from '@/store';
import { getMonthName } from '@/utils/formatters';

/** Píldora ‹ Octubre 2026 › para cambiar el mes global, igual en todas las páginas. */
export function SelectorMes() {
  const { mesActual, anioActual, setMesAnio } = useConfigStore();
  const hoy = new Date();
  const esActual = mesActual === hoy.getMonth() + 1 && anioActual === hoy.getFullYear();

  const mover = (delta: number) => {
    const d = new Date(anioActual, mesActual - 1 + delta, 1);
    setMesAnio(d.getMonth() + 1, d.getFullYear());
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1">
        <button type="button" onClick={() => mover(-1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Mes anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 text-sm font-bold text-slate-900 min-w-[128px] text-center capitalize">
          {getMonthName(mesActual)} {anioActual}
        </span>
        <button type="button" onClick={() => mover(1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Mes siguiente">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {!esActual && (
        <button
          type="button"
          onClick={() => setMesAnio(hoy.getMonth() + 1, hoy.getFullYear())}
          className="link-arrow text-xs"
        >
          Volver al mes actual
        </button>
      )}
    </div>
  );
}
