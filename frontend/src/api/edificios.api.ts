import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Edificio, EdificioInput, Piso, Habitacion } from '@/types';

const ENDPOINT = '/api/edificios';

// Tipo para configuración de piso en creación de edificio completo
export interface PisoConfig {
  numero: number;
  descripcion?: string;
  cantidadHabitaciones: number;
  montoAlquiler: number;
  montoInternet: number;
  montoServicios?: number;
}

export interface EdificioCompletoInput {
  edificio: Omit<EdificioInput, 'totalPisos'>;
  pisos: PisoConfig[];
}

export interface EdificioCompletoResponse {
  edificio: Edificio;
  pisos: Piso[];
  habitaciones: Habitacion[];
}

export const edificiosApi = {
  getAll: (ciudadId?: string) =>
    apiGet<Edificio[]>(ENDPOINT, {
      params: ciudadId ? { ciudadId } : undefined,
    }),

  getByCiudad: (ciudadId: string) =>
    apiGet<Edificio[]>(ENDPOINT, { params: { ciudadId } }),

  getById: (id: string) => apiGet<Edificio>(`${ENDPOINT}/${id}`),

  create: (data: EdificioInput) => apiPost<Edificio, EdificioInput>(ENDPOINT, data),

  // Crear edificio completo con pisos y habitaciones
  createCompleto: (data: EdificioCompletoInput) =>
    apiPost<EdificioCompletoResponse, EdificioCompletoInput>(`${ENDPOINT}/completo`, data),

  update: (id: string, data: Partial<EdificioInput>) =>
    apiPut<Edificio, Partial<EdificioInput>>(`${ENDPOINT}/${id}`, data),

  delete: (id: string) => apiDelete<void>(`${ENDPOINT}/${id}`),
};
