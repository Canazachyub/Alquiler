import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ciudadesApi } from '@/api';
import type { CiudadInput } from '@/types';

export const CIUDADES_KEY = ['ciudades'];

export function useCiudades() {
  return useQuery({
    queryKey: CIUDADES_KEY,
    queryFn: ciudadesApi.getAll,
  });
}

export function useCiudad(id: string) {
  return useQuery({
    queryKey: [...CIUDADES_KEY, id],
    queryFn: () => ciudadesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCiudad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CiudadInput) => ciudadesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIUDADES_KEY });
    },
  });
}

export function useUpdateCiudad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CiudadInput> }) =>
      ciudadesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIUDADES_KEY });
    },
  });
}

export function useDeleteCiudad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ciudadesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CIUDADES_KEY });
    },
  });
}
