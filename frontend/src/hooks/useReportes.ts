import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '@/api';

export const REPORTES_KEY = ['reportes'];

export function useDashboard(edificioId?: string) {
  return useQuery({
    queryKey: [...REPORTES_KEY, 'dashboard', edificioId],
    queryFn: () => reportesApi.getDashboard(edificioId),
  });
}

export function useReporteMensual(mes: number, anio: number, edificioId?: string) {
  return useQuery({
    queryKey: [...REPORTES_KEY, 'mensual', { mes, anio, edificioId }],
    queryFn: () => reportesApi.getMensual(mes, anio, edificioId),
  });
}

export function useReporteHistorico(meses: number = 6, edificioId?: string) {
  return useQuery({
    queryKey: [...REPORTES_KEY, 'historico', { meses, edificioId }],
    queryFn: () => reportesApi.getHistorico(meses, edificioId),
  });
}
