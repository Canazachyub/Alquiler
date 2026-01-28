import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitacionesApi } from '@/api';
import type { HabitacionInput, EstadoHabitacion, FiltrosHabitacion } from '@/types';

export const HABITACIONES_KEY = ['habitaciones'];

export function useHabitaciones(filtros?: FiltrosHabitacion) {
  return useQuery({
    queryKey: filtros ? [...HABITACIONES_KEY, filtros] : HABITACIONES_KEY,
    queryFn: () => habitacionesApi.getAll(filtros),
  });
}

export function useHabitacionesByEdificio(edificioId: string) {
  return useQuery({
    queryKey: [...HABITACIONES_KEY, { edificioId }],
    queryFn: () => habitacionesApi.getByEdificio(edificioId),
    enabled: !!edificioId,
  });
}

export function useHabitacionesConEstadoPago(mes: number, anio: number, edificioId?: string) {
  return useQuery({
    queryKey: [...HABITACIONES_KEY, 'estado-pago', { mes, anio, edificioId }],
    queryFn: () => habitacionesApi.getConEstadoPago(mes, anio, edificioId),
  });
}

export function useHabitacion(id: string) {
  return useQuery({
    queryKey: [...HABITACIONES_KEY, id],
    queryFn: () => habitacionesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateHabitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HabitacionInput) => habitacionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useUpdateHabitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HabitacionInput> }) =>
      habitacionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useUpdateEstadoHabitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoHabitacion }) =>
      habitacionesApi.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useDeleteHabitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => habitacionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}
