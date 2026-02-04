// Tipos para el backend de Google Apps Script

interface Ciudad {
  id: string;
  nombre: string;
  departamento: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Edificio {
  id: string;
  ciudadId: string;
  nombre: string;
  direccion: string;
  totalPisos: number;
  activo: boolean;
}

interface Piso {
  id: string;
  edificioId: string;
  numero: number;
  descripcion: string;
}

interface Habitacion {
  id: string;
  pisoId: string;
  codigo: string;
  ubicacion: 'izquierda' | 'derecha' | 'centro' | 'unica';
  montoAlquiler: number;
  montoInternet: number;
  montoServicios: number;
  estado: 'vacant' | 'occupied' | 'maintenance';
  activo: boolean;
  observaciones: string;
}

interface Inquilino {
  id: string;
  habitacionId: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  fechaIngreso: string;
  fechaSalida: string;
  estado: 'activo' | 'inactivo';
  contactoEmergencia: string;
  telefonoEmergencia: string;
  observaciones: string;
  // Campos del contrato
  garantia: boolean;
  llaveHabitacion: boolean;
  llavePuertaCalle: boolean;
}

interface Pago {
  id: string;
  inquilinoId: string;
  habitacionId: string;
  fecha: string;
  mes: number;
  anio: number;
  concepto: 'alquiler' | 'internet' | 'servicios' | 'otro';
  monto: number;
  metodoPago: 'efectivo' | 'yape' | 'plin' | 'transferencia';
  referencia: string;
  estado: 'pagado' | 'pendiente' | 'anulado';
  observaciones: string;
}

interface Gasto {
  id: string;
  edificioId: string;
  habitacionId: string;
  fecha: string;
  concepto: string;
  categoria: 'mantenimiento' | 'servicios' | 'limpieza' | 'reparacion' | 'otros';
  monto: number;
  comprobanteUrl: string;
  observaciones: string;
}

interface ApiRequest {
  action: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: unknown;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface DashboardStats {
  totalCiudades: number;
  totalEdificios: number;
  totalHabitaciones: number;
  habitacionesOcupadas: number;
  habitacionesVacantes: number;
  tasaOcupacion: number;
  ingresosMes: number;
  gastosMes: number;
  balance: number;
  habitacionesPagadas: number;
  habitacionesPendientes: number;
}
