import { apiGet } from './client';
import type { DashboardStats, ReporteMensual } from '@/types';

const ENDPOINT = '/api/reportes';

export const reportesApi = {
  getDashboard: (edificioId?: string) =>
    apiGet<DashboardStats>(`${ENDPOINT}/dashboard`, {
      params: edificioId ? { edificioId } : undefined,
    }),

  getMensual: (mes: number, anio: number, edificioId?: string) =>
    apiGet<ReporteMensual>(`${ENDPOINT}/mensual`, {
      params: { mes, anio, edificioId },
    }),

  getHistorico: (meses: number = 6, edificioId?: string) =>
    apiGet<ReporteMensual[]>(`${ENDPOINT}/historico`, {
      params: { meses, edificioId },
    }),

  exportarMensual: (mes: number, anio: number, edificioId?: string) =>
    apiGet<{ url: string }>(`${ENDPOINT}/exportar`, {
      params: { mes, anio, edificioId },
    }),
};
