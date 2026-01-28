// API URL - Cambiar por la URL real del deployment de Apps Script
export const API_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbxpWGNuWzi5b2ejNtZdCNbhZ1ujagSzuFywPGk-6PeGx5nOUBBg2ybbwAMq-xSTrzk/exec';

// Meses del año
export const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
] as const;

// Estados de habitación
export const ESTADOS_HABITACION = {
  vacant: { label: 'Vacante', color: 'gray' },
  occupied: { label: 'Ocupada', color: 'blue' },
  maintenance: { label: 'Mantenimiento', color: 'yellow' },
} as const;

// Estados de pago
export const ESTADOS_PAGO = {
  pagado: { label: 'Pagado', color: 'green' },
  pendiente: { label: 'Pendiente', color: 'red' },
  anulado: { label: 'Anulado', color: 'gray' },
} as const;

// Métodos de pago
export const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transferencia', label: 'Transferencia' },
] as const;

// Conceptos de pago
export const CONCEPTOS_PAGO = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'internet', label: 'Internet' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'otro', label: 'Otro' },
] as const;

// Categorías de gasto
export const CATEGORIAS_GASTO = [
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'otros', label: 'Otros' },
] as const;

// Ubicaciones de habitación
export const UBICACIONES_HABITACION = [
  { value: 'izquierda', label: 'Izquierda' },
  { value: 'derecha', label: 'Derecha' },
  { value: 'centro', label: 'Centro' },
  { value: 'unica', label: 'Única' },
] as const;

// Prioridades de incidencia
export const PRIORIDADES_INCIDENCIA = {
  alta: { label: 'Alta', color: 'red' },
  media: { label: 'Media', color: 'yellow' },
  baja: { label: 'Baja', color: 'green' },
} as const;

// Tipos de incidencia
export const TIPOS_INCIDENCIA = [
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'dano', label: 'Daño' },
  { value: 'queja', label: 'Queja' },
  { value: 'emergencia', label: 'Emergencia' },
  { value: 'otro', label: 'Otro' },
] as const;
