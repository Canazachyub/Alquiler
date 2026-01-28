import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inquilinosApi } from '@/api';
import type { InquilinoInput } from '@/types';
import { HABITACIONES_KEY } from './useHabitaciones';

export const INQUILINOS_KEY = ['inquilinos'];

export function useInquilinos(activos?: boolean) {
  return useQuery({
    queryKey: activos !== undefined ? [...INQUILINOS_KEY, { activos }] : INQUILINOS_KEY,
    queryFn: () => inquilinosApi.getAll(activos),
  });
}

export function useInquilinosActivos() {
  return useQuery({
    queryKey: [...INQUILINOS_KEY, { activos: true }],
    queryFn: () => inquilinosApi.getActivos(),
  });
}

export function useInquilino(id: string) {
  return useQuery({
    queryKey: [...INQUILINOS_KEY, id],
    queryFn: () => inquilinosApi.getById(id),
    enabled: !!id,
  });
}

export function useInquilinoByHabitacion(habitacionId: string) {
  return useQuery({
    queryKey: [...INQUILINOS_KEY, 'habitacion', habitacionId],
    queryFn: () => inquilinosApi.getByHabitacion(habitacionId),
    enabled: !!habitacionId,
  });
}

export function useCreateInquilino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InquilinoInput) => inquilinosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INQUILINOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useUpdateInquilino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InquilinoInput> }) =>
      inquilinosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INQUILINOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useDarBajaInquilino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fechaSalida }: { id: string; fechaSalida: string }) =>
      inquilinosApi.darBaja(id, fechaSalida),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INQUILINOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useDeleteInquilino() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inquilinosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INQUILINOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}
