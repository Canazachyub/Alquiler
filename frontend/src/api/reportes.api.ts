import { apiGet } from './client';
import type { DashboardStats, ReporteMensual } from '@/types';

const ENDPOINT = '/api/reportes';

/** Filtro de alcance: edificio tiene prioridad sobre ciudad en el backend */
export interface ReporteScope {
  mes?: number;
  anio?: number;
  edificioId?: string;
  ciudadId?: string;
}

const clean = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const reportesApi = {
  getDashboard: (scope: ReporteScope = {}) =>
    apiGet<DashboardStats>(`${ENDPOINT}/dashboard`, { params: clean({ ...scope }) }),

  getMensual: (mes: number, anio: number, edificioId?: string, ciudadId?: string) =>
    apiGet<ReporteMensual>(`${ENDPOINT}/mensual`, {
      params: clean({ mes, anio, edificioId, ciudadId }),
    }),

  getHistorico: (meses: number = 6, scope: ReporteScope = {}) =>
    apiGet<ReporteMensual[]>(`${ENDPOINT}/historico`, {
      params: clean({ meses, ...scope }),
    }),

  exportarMensual: (mes: number, anio: number, edificioId?: string) =>
    apiGet<{ url: string }>(`${ENDPOINT}/exportar`, {
      params: { mes, anio, edificioId },
    }),
};
