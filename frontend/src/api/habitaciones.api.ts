import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Habitacion, HabitacionInput, HabitacionConDetalles, EstadoHabitacion, FiltrosHabitacion } from '@/types';

const ENDPOINT = '/api/habitaciones';

export const habitacionesApi = {
  getAll: (filtros?: FiltrosHabitacion) =>
    apiGet<HabitacionConDetalles[]>(ENDPOINT, { params: filtros }),

  getByPiso: (pisoId: string) =>
    apiGet<HabitacionConDetalles[]>(ENDPOINT, { params: { pisoId } }),

  getByEdificio: (edificioId: string) =>
    apiGet<HabitacionConDetalles[]>(ENDPOINT, { params: { edificioId } }),

  getByCiudad: (ciudadId: string) =>
    apiGet<HabitacionConDetalles[]>(ENDPOINT, { params: { ciudadId } }),

  getById: (id: string) => apiGet<Habitacion>(`${ENDPOINT}/${id}`),

  create: (data: HabitacionInput) => apiPost<Habitacion, HabitacionInput>(ENDPOINT, data),

  update: (id: string, data: Partial<HabitacionInput>) =>
    apiPut<Habitacion, Partial<HabitacionInput>>(`${ENDPOINT}/${id}`, data),

  updateEstado: (id: string, estado: EstadoHabitacion) =>
    apiPut<Habitacion, { estado: EstadoHabitacion }>(`${ENDPOINT}/${id}/estado`, { estado }),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),

  // Obtener habitaciones con detalles de pago para un mes específico
  getConEstadoPago: (mes: number, anio: number, edificioId?: string) =>
    apiGet<HabitacionConDetalles[]>(`${ENDPOINT}/estado-pago`, {
      params: { mes, anio, edificioId },
    }),
};
