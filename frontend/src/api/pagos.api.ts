import { apiGet, apiPost, apiPut } from './client';
import type { Pago, PagoInput, FiltrosPago } from '@/types';

const ENDPOINT = '/api/pagos';

export const pagosApi = {
  getAll: (filtros?: FiltrosPago) =>
    apiGet<Pago[]>(ENDPOINT, { params: filtros }),

  getByMes: (mes: number, anio: number, edificioId?: string) =>
    apiGet<Pago[]>(ENDPOINT, { params: { mes, anio, edificioId } }),

  getByHabitacion: (habitacionId: string, mes?: number, anio?: number) =>
    apiGet<Pago[]>(ENDPOINT, { params: { habitacionId, mes, anio } }),

  getById: (id: string) => apiGet<Pago>(`${ENDPOINT}/${id}`),

  create: (data: PagoInput) => apiPost<Pago, PagoInput>(ENDPOINT, data),

  update: (id: string, data: Partial<PagoInput>) =>
    apiPut<Pago, Partial<PagoInput>>(`${ENDPOINT}/${id}`, data),

  anular: (id: string) =>
    apiPut<Pago, { estado: 'anulado' }>(`${ENDPOINT}/${id}`, { estado: 'anulado' }),

  // Resetear estado de pagos para un nuevo mes
  resetMes: (mes: number, anio: number, edificioId?: string) =>
    apiPost<{ affected: number }, { mes: number; anio: number; edificioId?: string }>(
      `${ENDPOINT}/reset-mes`,
      { mes, anio, edificioId }
    ),

  // Obtener resumen de pagos del mes
  getResumenMes: (mes: number, anio: number, edificioId?: string) =>
    apiGet<{
      totalRecaudado: number;
      totalPagos: number;
      habitacionesPagadas: number;
      habitacionesPendientes: number;
    }>(`${ENDPOINT}/resumen`, { params: { mes, anio, edificioId } }),
};
