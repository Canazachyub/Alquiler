import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { GastoFijo, GastoFijoInput } from '@/types';

const ENDPOINT = '/api/gastos-fijos';

export const gastosFijosApi = {
  getAll: () => apiGet<GastoFijo[]>(ENDPOINT),

  getByEdificio: (edificioId: string) =>
    apiGet<GastoFijo[]>(ENDPOINT, { params: { edificioId } }),

  getById: (id: string) => apiGet<GastoFijo>(`${ENDPOINT}/${id}`),

  create: (data: GastoFijoInput) =>
    apiPost<GastoFijo, GastoFijoInput>(ENDPOINT, data),

  update: (id: string, data: Partial<GastoFijoInput>) =>
    apiPut<GastoFijo, Partial<GastoFijoInput>>(`${ENDPOINT}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),
};
