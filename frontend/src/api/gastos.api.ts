import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Gasto, GastoInput, FiltrosGasto, CategoriaGasto } from '@/types';

const ENDPOINT = '/api/gastos';

export const gastosApi = {
  getAll: (filtros?: FiltrosGasto) =>
    apiGet<Gasto[]>(ENDPOINT, { params: filtros }),

  getByMes: (mes: number, anio: number, edificioId?: string) =>
    apiGet<Gasto[]>(ENDPOINT, { params: { mes, anio, edificioId } }),

  getByEdificio: (edificioId: string) =>
    apiGet<Gasto[]>(ENDPOINT, { params: { edificioId } }),

  getById: (id: string) => apiGet<Gasto>(`${ENDPOINT}/${id}`),

  create: (data: GastoInput) => apiPost<Gasto, GastoInput>(ENDPOINT, data),

  update: (id: string, data: Partial<GastoInput>) =>
    apiPut<Gasto, Partial<GastoInput>>(`${ENDPOINT}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),

  // Obtener resumen de gastos por categoría
  getResumenPorCategoria: (mes: number, anio: number, edificioId?: string) =>
    apiGet<Record<CategoriaGasto, number>>(`${ENDPOINT}/resumen-categoria`, {
      params: { mes, anio, edificioId },
    }),
};
