import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Piso, PisoInput } from '@/types';

const ENDPOINT = '/api/pisos';

export const pisosApi = {
  getAll: (edificioId?: string) =>
    apiGet<Piso[]>(ENDPOINT, {
      params: edificioId ? { edificioId } : undefined,
    }),

  getByEdificio: (edificioId: string) =>
    apiGet<Piso[]>(ENDPOINT, { params: { edificioId } }),

  getById: (id: string) => apiGet<Piso>(`${ENDPOINT}/${id}`),

  create: (data: PisoInput) => apiPost<Piso, PisoInput>(ENDPOINT, data),

  update: (id: string, data: Partial<PisoInput>) =>
    apiPut<Piso, Partial<PisoInput>>(`${ENDPOINT}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),
};
