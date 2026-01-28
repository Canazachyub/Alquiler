import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Inquilino, InquilinoInput } from '@/types';

const ENDPOINT = '/api/inquilinos';

export const inquilinosApi = {
  getAll: (activos?: boolean) =>
    apiGet<Inquilino[]>(ENDPOINT, {
      params: activos !== undefined ? { activos } : undefined,
    }),

  getActivos: () => apiGet<Inquilino[]>(ENDPOINT, { params: { activos: true } }),

  getById: (id: string) => apiGet<Inquilino>(`${ENDPOINT}/${id}`),

  getByHabitacion: (habitacionId: string) =>
    apiGet<Inquilino | null>(`${ENDPOINT}/habitacion/${habitacionId}`),

  create: (data: InquilinoInput) => apiPost<Inquilino, InquilinoInput>(ENDPOINT, data),

  update: (id: string, data: Partial<InquilinoInput>) =>
    apiPut<Inquilino, Partial<InquilinoInput>>(`${ENDPOINT}/${id}`, data),

  darBaja: (id: string, fechaSalida: string) =>
    apiPut<Inquilino, { fechaSalida: string; estado: 'inactivo' }>(`${ENDPOINT}/${id}`, {
      fechaSalida,
      estado: 'inactivo',
    }),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),
};
