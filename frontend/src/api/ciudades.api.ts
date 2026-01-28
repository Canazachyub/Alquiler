import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Ciudad, CiudadInput } from '@/types';

const ENDPOINT = '/api/ciudades';

export const ciudadesApi = {
  getAll: () => apiGet<Ciudad[]>(ENDPOINT),

  getById: (id: string) => apiGet<Ciudad>(`${ENDPOINT}/${id}`),

  create: (data: CiudadInput) => apiPost<Ciudad, CiudadInput>(ENDPOINT, data),

  update: (id: string, data: Partial<CiudadInput>) =>
    apiPut<Ciudad, Partial<CiudadInput>>(`${ENDPOINT}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),
};
