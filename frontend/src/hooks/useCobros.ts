import { useMemo } from 'react';
import { usePagos } from './usePagos';
import { useInquilinos } from './useInquilinos';
import { actualizarModalidades } from '@/utils/modalidad';
import { calcularCobro, estadoDesdeCobro, deudaVencida, type EstadoCobro } from '@/utils/cobro';
import type { HabitacionConDetalles } from '@/types';

/**
 * Estado de cobro de cada cuarto a partir de todos los pagos (una sola consulta
 * compartida). Devuelve funciones para no recalcular el ciclo en cada render.
 */
export function useCobros() {
  const { data: pagos } = usePagos();
  const { data: inquilinos } = useInquilinos();
  return useMemo(() => {
    actualizarModalidades(inquilinos);
    const cache = new Map<string, EstadoCobro>();
    const cobro = (h: HabitacionConDetalles): EstadoCobro | undefined => {
      if (!pagos) return undefined;
      const k = `${h.id}|${h.fechaIngreso ?? ''}|${h.diaPago ?? ''}`;
      let c = cache.get(k);
      if (!c) {
        c = calcularCobro(h, pagos);
        cache.set(k, c);
      }
      return c;
    };
    return {
      cargado: !!pagos,
      cobro,
      estado: (h: HabitacionConDetalles) => estadoDesdeCobro(h, cobro(h)),
      deuda: (h: HabitacionConDetalles) => deudaVencida(h, cobro(h)),
    };
  }, [pagos, inquilinos]);
}
