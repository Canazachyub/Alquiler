import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { edificiosApi, type EdificioCompletoInput } from '@/api';
import type { EdificioInput } from '@/types';
import { PISOS_KEY } from './usePisos';
import { HABITACIONES_KEY } from './useHabitaciones';

export const EDIFICIOS_KEY = ['edificios'];

export function useEdificios(ciudadId?: string) {
  return useQuery({
    queryKey: ciudadId ? [...EDIFICIOS_KEY, { ciudadId }] : EDIFICIOS_KEY,
    queryFn: () => edificiosApi.getAll(ciudadId),
  });
}

export function useEdificiosByCiudad(ciudadId: string) {
  return useQuery({
    queryKey: [...EDIFICIOS_KEY, { ciudadId }],
    queryFn: () => edificiosApi.getByCiudad(ciudadId),
    enabled: !!ciudadId,
  });
}

export function useEdificio(id: string) {
  return useQuery({
    queryKey: [...EDIFICIOS_KEY, id],
    queryFn: () => edificiosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateEdificio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EdificioInput) => edificiosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDIFICIOS_KEY });
    },
  });
}

export function useUpdateEdificio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EdificioInput> }) =>
      edificiosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDIFICIOS_KEY });
    },
  });
}

export function useDeleteEdificio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => edificiosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDIFICIOS_KEY });
    },
  });
}

export function useCreateEdificioCompleto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EdificioCompletoInput) => edificiosApi.createCompleto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDIFICIOS_KEY });
      queryClient.invalidateQueries({ queryKey: PISOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}
