import { useQuery } from '@tanstack/react-query';
import { reportesApi, type ReporteScope } from '@/api/reportes.api';

export const REPORTES_KEY = ['reportes'];

export function useDashboard(scope: ReporteScope = {}) {
  return useQuery({
    queryKey: [...REPORTES_KEY, 'dashboard', scope],
    queryFn: () => reportesApi.getDashboard(scope),
  });
}

export function useReporteMensual(mes: number, anio: number, edificioId?: string, ciudadId?: string) {
  return useQuery({
    queryKey: [...REPORTES_KEY, 'mensual', { mes, anio, edificioId, ciudadId }],
    queryFn: () => reportesApi.getMensual(mes, anio, edificioId, ciudadId),
  });
}

export function useReporteHistorico(meses: number = 6, scope: ReporteScope = {}) {
  return useQuery({
    queryKey: [...REPORTES_KEY, 'historico', { meses, ...scope }],
    queryFn: () => reportesApi.getHistorico(meses, scope),
  });
}
