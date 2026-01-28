import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gastosFijosApi } from '@/api';
import type { GastoFijoInput } from '@/types';

export const GASTOS_FIJOS_KEY = ['gastos-fijos'];

export function useGastosFijos() {
  return useQuery({
    queryKey: GASTOS_FIJOS_KEY,
    queryFn: gastosFijosApi.getAll,
  });
}

export function useGastosFijosByEdificio(edificioId?: string) {
  return useQuery({
    queryKey: [...GASTOS_FIJOS_KEY, { edificioId }],
    queryFn: () => gastosFijosApi.getByEdificio(edificioId!),
    enabled: !!edificioId,
  });
}

export function useCreateGastoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GastoFijoInput) => gastosFijosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GASTOS_FIJOS_KEY });
    },
  });
}

export function useUpdateGastoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GastoFijoInput> }) =>
      gastosFijosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GASTOS_FIJOS_KEY });
    },
  });
}

export function useDeleteGastoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gastosFijosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GASTOS_FIJOS_KEY });
    },
  });
}
