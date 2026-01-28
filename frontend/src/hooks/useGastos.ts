import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gastosApi } from '@/api';
import type { GastoInput, FiltrosGasto } from '@/types';

export const GASTOS_KEY = ['gastos'];

export function useGastos(filtros?: FiltrosGasto) {
  return useQuery({
    queryKey: filtros ? [...GASTOS_KEY, filtros] : GASTOS_KEY,
    queryFn: () => gastosApi.getAll(filtros),
  });
}

export function useGastosByMes(mes: number, anio: number, edificioId?: string) {
  return useQuery({
    queryKey: [...GASTOS_KEY, { mes, anio, edificioId }],
    queryFn: () => gastosApi.getByMes(mes, anio, edificioId),
  });
}

export function useResumenGastosPorCategoria(mes: number, anio: number, edificioId?: string) {
  return useQuery({
    queryKey: [...GASTOS_KEY, 'resumen-categoria', { mes, anio, edificioId }],
    queryFn: () => gastosApi.getResumenPorCategoria(mes, anio, edificioId),
  });
}

export function useCreateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GastoInput) => gastosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}

export function useUpdateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GastoInput> }) =>
      gastosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}

export function useDeleteGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gastosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}
