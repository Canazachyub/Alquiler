import { useMemo } from 'react';
import { useHabitacionesConEstadoPago } from './useHabitaciones';
import { useInquilinos } from './useInquilinos';
import { useGastosFijos } from './useGastosFijos';
import { useConfigStore } from '@/store';

export type AlertaSeveridad = 'danger' | 'warning' | 'info';
export type AlertaCategoria = 'pago-pendiente' | 'pago-proximo' | 'gasto-fijo' | 'contrato-incompleto';

export interface Alerta {
  id: string;
  severidad: AlertaSeveridad;
  categoria: AlertaCategoria;
  titulo: string;
  detalle?: string;
  link?: string;
  monto?: number;
}

const DIAS_PROXIMO_VENCIMIENTO = 3;

/**
 * Deriva alertas activas a partir de los datos ya cacheados.
 * No hace requests adicionales: combina habitaciones con estado de pago,
 * inquilinos activos y gastos fijos del edificio seleccionado.
 */
export function useAlertas() {
  const { mesActual, anioActual, edificioSeleccionado } = useConfigStore();

  const { data: habitaciones = [] } = useHabitacionesConEstadoPago(
    mesActual,
    anioActual,
    edificioSeleccionado || undefined
  );
  const { data: inquilinos = [] } = useInquilinos();
  const { data: gastosFijos = [] } = useGastosFijos();

  return useMemo<Alerta[]>(() => {
    const alertas: Alerta[] = [];
    const hoy = new Date();
    const diaHoy = hoy.getDate();

    // 1. Pagos del mes pendientes (danger) — habitaciones ocupadas sin pago de alquiler
    habitaciones.forEach((hab) => {
      if (hab.estado === 'occupied' && !hab.alquilerPagado) {
        const vencido = hab.diaPago !== undefined && hab.diaPago < diaHoy;
        alertas.push({
          id: `pago-${hab.id}`,
          severidad: 'danger',
          categoria: 'pago-pendiente',
          titulo: `${hab.codigo} · ${hab.nombreInquilino || 'Sin inquilino'}`,
          detalle: vencido
            ? `Vencido · debía pagar el ${hab.diaPago}`
            : `Pago pendiente del mes`,
          link: '/habitaciones',
          monto: hab.montoAlquiler,
        });
      }
    });

    // 2. Pagos próximos a vencer (warning) — ocupadas con diaPago dentro de los próximos N días
    habitaciones.forEach((hab) => {
      if (
        hab.estado === 'occupied' &&
        !hab.alquilerPagado &&
        hab.diaPago !== undefined &&
        hab.diaPago >= diaHoy &&
        hab.diaPago <= diaHoy + DIAS_PROXIMO_VENCIMIENTO
      ) {
        const dias = hab.diaPago - diaHoy;
        alertas.push({
          id: `proximo-${hab.id}`,
          severidad: 'warning',
          categoria: 'pago-proximo',
          titulo: `${hab.codigo} · ${hab.nombreInquilino || 'Sin inquilino'}`,
          detalle: dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`,
          link: '/habitaciones',
          monto: hab.montoAlquiler,
        });
      }
    });

    // 3. Gastos fijos próximos a vencer (warning)
    gastosFijos
      .filter((g) => g.activo)
      .forEach((g) => {
        const dias = g.diaVencimiento - diaHoy;
        if (dias >= 0 && dias <= DIAS_PROXIMO_VENCIMIENTO) {
          alertas.push({
            id: `gasto-${g.id}`,
            severidad: 'warning',
            categoria: 'gasto-fijo',
            titulo: g.descripcion || g.tipo,
            detalle: dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`,
            link: '/gastos',
            monto: g.monto,
          });
        }
      });

    // 4. Inquilinos con contrato incompleto (info) — solo los activos
    inquilinos
      .filter((i) => i.estado === 'activo')
      .forEach((inq) => {
        const faltantes: string[] = [];
        if (!inq.dni || String(inq.dni).trim() === '') faltantes.push('DNI');
        if (!inq.garantia) faltantes.push('garantía');
        if (!inq.llaveHabitacion) faltantes.push('llave habitación');
        if (!inq.llavePuertaCalle) faltantes.push('llave puerta');

        if (faltantes.length > 0) {
          alertas.push({
            id: `contrato-${inq.id}`,
            severidad: 'info',
            categoria: 'contrato-incompleto',
            titulo: `${inq.nombre} ${inq.apellido}`,
            detalle: `Falta: ${faltantes.join(', ')}`,
            link: '/inquilinos',
          });
        }
      });

    // Orden: danger → warning → info
    const orden: Record<AlertaSeveridad, number> = { danger: 0, warning: 1, info: 2 };
    return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
  }, [habitaciones, inquilinos, gastosFijos]);
}
