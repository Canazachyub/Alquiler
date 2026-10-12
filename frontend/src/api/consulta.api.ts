import { apiGet } from './client';

/** Lo único que ve el inquilino al escanear el QR de su cuarto */
export interface ConsultaPublica {
  habitacionId: string;
  codigo: string;
  estado: string;
  edificio: string;
  montoAlquiler: number;
  inquilino: { nombre: string; fechaIngreso: string; modalidadPago: 'adelantado' | 'vencido' } | null;
  pagos: { mes: number; anio: number; fecha: string; monto: number; concepto: string; estado: string }[];
}

export const consultaApi = {
  porHabitacion: (habitacionId: string) => apiGet<ConsultaPublica>(`/api/consulta/${habitacionId}`),
};
