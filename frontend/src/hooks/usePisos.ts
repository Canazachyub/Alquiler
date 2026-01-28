import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pisosApi } from '@/api';
import type { PisoInput } from '@/types';

export const PISOS_KEY = ['pisos'];

export function usePisos(edificioId?: string) {
  return useQuery({
    queryKey: edificioId ? [...PISOS_KEY, { edificioId }] : PISOS_KEY,
    queryFn: () => pisosApi.getAll(edificioId),
  });
}

export function usePisosByEdificio(edificioId: string) {
  return useQuery({
    queryKey: [...PISOS_KEY, { edificioId }],
    queryFn: () => pisosApi.getByEdificio(edificioId),
    enabled: !!edificioId,
  });
}

export function usePiso(id: string) {
  return useQuery({
    queryKey: [...PISOS_KEY, id],
    queryFn: () => pisosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PisoInput) => pisosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PISOS_KEY });
    },
  });
}

export function useUpdatePiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PisoInput> }) =>
      pisosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PISOS_KEY });
    },
  });
}

export function useDeletePiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pisosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PISOS_KEY });
    },
  });
}
