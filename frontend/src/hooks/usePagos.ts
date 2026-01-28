import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagosApi } from '@/api';
import type { PagoInput, FiltrosPago } from '@/types';
import { HABITACIONES_KEY } from './useHabitaciones';

export const PAGOS_KEY = ['pagos'];

export function usePagos(filtros?: FiltrosPago) {
  return useQuery({
    queryKey: filtros ? [...PAGOS_KEY, filtros] : PAGOS_KEY,
    queryFn: () => pagosApi.getAll(filtros),
  });
}

export function usePagosByMes(mes: number, anio: number, edificioId?: string) {
  return useQuery({
    queryKey: [...PAGOS_KEY, { mes, anio, edificioId }],
    queryFn: () => pagosApi.getByMes(mes, anio, edificioId),
  });
}

export function usePagosByHabitacion(habitacionId: string, mes?: number, anio?: number) {
  return useQuery({
    queryKey: [...PAGOS_KEY, { habitacionId, mes, anio }],
    queryFn: () => pagosApi.getByHabitacion(habitacionId, mes, anio),
    enabled: !!habitacionId,
  });
}

export function useResumenPagosMes(mes: number, anio: number, edificioId?: string) {
  return useQuery({
    queryKey: [...PAGOS_KEY, 'resumen', { mes, anio, edificioId }],
    queryFn: () => pagosApi.getResumenMes(mes, anio, edificioId),
  });
}

export function useCreatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PagoInput) => pagosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useUpdatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PagoInput> }) =>
      pagosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useAnularPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pagosApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}

export function useResetPagosMes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mes, anio, edificioId }: { mes: number; anio: number; edificioId?: string }) =>
      pagosApi.resetMes(mes, anio, edificioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGOS_KEY });
      queryClient.invalidateQueries({ queryKey: HABITACIONES_KEY });
    },
  });
}
