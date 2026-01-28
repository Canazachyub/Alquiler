// ============================================
// TIPOS BASE
// ============================================

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// CIUDAD
// ============================================

export interface Ciudad extends BaseEntity {
  nombre: string;
  departamento: string;
  activo: boolean;
}

export interface CiudadInput {
  nombre: string;
  departamento: string;
  activo?: boolean;
}

// ============================================
// EDIFICIO
// ============================================

export interface Edificio extends BaseEntity {
  ciudadId: string;
  nombre: string;
  descripcion?: string;
  direccion: string;
  totalPisos: number;
  activo: boolean;
  // Relaciones
  ciudad?: Ciudad;
}

export interface EdificioInput {
  ciudadId: string;
  nombre: string;
  descripcion?: string;
  direccion: string;
  totalPisos: number;
  activo?: boolean;
}

// ============================================
// PISO
// ============================================

export interface Piso extends BaseEntity {
  edificioId: string;
  numero: number;
  descripcion?: string;
  // Relaciones
  edificio?: Edificio;
}

export interface PisoInput {
  edificioId: string;
  numero: number;
  descripcion?: string;
}

// ============================================
// HABITACION
// ============================================

export type EstadoHabitacion = 'vacant' | 'occupied' | 'maintenance';
export type UbicacionHabitacion = 'izquierda' | 'derecha' | 'centro' | 'unica';

export interface Habitacion extends BaseEntity {
  pisoId: string;
  codigo: string;
  ubicacion: UbicacionHabitacion;
  montoAlquiler: number;
  montoInternet: number;
  montoServicios: number;
  estado: EstadoHabitacion;
  activo: boolean;
  observaciones?: string;
  // Campos calculados/relacionados
  piso?: Piso;
  inquilinoActual?: Inquilino;
  alquilerPagado?: boolean;
  internetPagado?: boolean;
}

export interface HabitacionInput {
  pisoId: string;
  codigo: string;
  ubicacion: UbicacionHabitacion;
  montoAlquiler: number;
  montoInternet: number;
  montoServicios?: number;
  estado?: EstadoHabitacion;
  activo?: boolean;
  observaciones?: string;
}

export interface HabitacionConDetalles extends Habitacion {
  nombreInquilino?: string;
  telefonoInquilino?: string;
  fechaIngreso?: string;
  diaPago?: number; // Dia del mes en que debe pagar (basado en fecha de ingreso)
  deudaTotal?: number;
  diasVencido?: number;
  pisoNumero?: number;
  edificioNombre?: string;
  edificioId?: string;
}

// ============================================
// INQUILINO
// ============================================

export type EstadoInquilino = 'activo' | 'inactivo';

export interface Inquilino extends BaseEntity {
  habitacionId: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email?: string;
  fechaIngreso: string;
  fechaSalida?: string;
  estado: EstadoInquilino;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  observaciones?: string;
  // Relaciones
  habitacion?: Habitacion;
}

export interface InquilinoInput {
  habitacionId: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email?: string;
  fechaIngreso: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  observaciones?: string;
}

// ============================================
// PAGO
// ============================================

export type ConceptoPago = 'alquiler' | 'internet' | 'servicios' | 'otro';
export type MetodoPago = 'efectivo' | 'yape' | 'plin' | 'transferencia';
export type EstadoPago = 'pagado' | 'pendiente' | 'anulado';

export interface Pago extends BaseEntity {
  inquilinoId: string;
  habitacionId: string;
  fecha: string;
  mes: number;
  anio: number;
  concepto: ConceptoPago;
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string;
  estado: EstadoPago;
  observaciones?: string;
  // Relaciones
  inquilino?: Inquilino;
  habitacion?: Habitacion;
}

export interface PagoInput {
  inquilinoId?: string;
  habitacionId: string;
  fecha?: string;
  mes: number;
  anio: number;
  concepto: ConceptoPago;
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string;
  observaciones?: string;
}

// ============================================
// GASTO FIJO DE EDIFICIO
// ============================================

export type TipoGastoFijo = 'agua' | 'luz' | 'internet' | 'gas' | 'limpieza' | 'vigilancia' | 'otro';

export interface GastoFijo extends BaseEntity {
  edificioId: string;
  tipo: TipoGastoFijo;
  descripcion: string;
  monto: number;
  diaVencimiento: number; // Día del mes (1-31)
  activo: boolean;
  // Relaciones
  edificio?: Edificio;
}

export interface GastoFijoInput {
  edificioId: string;
  tipo: TipoGastoFijo;
  descripcion: string;
  monto: number;
  diaVencimiento: number;
  activo?: boolean;
}

// ============================================
// GASTO
// ============================================

export type CategoriaGasto = 'mantenimiento' | 'servicios' | 'limpieza' | 'reparacion' | 'otros';

export interface Gasto extends BaseEntity {
  edificioId: string;
  habitacionId?: string;
  fecha: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  comprobanteUrl?: string;
  observaciones?: string;
  // Relaciones
  edificio?: Edificio;
  habitacion?: Habitacion;
}

export interface GastoInput {
  edificioId: string;
  habitacionId?: string;
  fecha: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  comprobanteUrl?: string;
  observaciones?: string;
}

// ============================================
// INCIDENCIA
// ============================================

export type TipoIncidencia = 'mantenimiento' | 'dano' | 'queja' | 'emergencia' | 'otro';
export type PrioridadIncidencia = 'alta' | 'media' | 'baja';
export type EstadoIncidencia = 'pendiente' | 'en_proceso' | 'resuelto';

export interface Incidencia extends BaseEntity {
  habitacionId: string;
  inquilinoId?: string;
  fecha: string;
  tipo: TipoIncidencia;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  fechaResolucion?: string;
  costoResolucion?: number;
  responsable?: string;
  observaciones?: string;
}

export interface IncidenciaInput {
  habitacionId: string;
  inquilinoId?: string;
  tipo: TipoIncidencia;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  observaciones?: string;
}

// ============================================
// REPORTES Y ESTADISTICAS
// ============================================

export interface DashboardStats {
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

export interface ReporteMensual {
  mes: number;
  anio: number;
  ingresos: number;
  gastos: number;
  balance: number;
  pagosRegistrados: number;
  habitacionesPagadas: number;
  detalleIngresos: {
    alquiler: number;
    internet: number;
    servicios: number;
    otros: number;
  };
  detalleGastos: {
    mantenimiento: number;
    servicios: number;
    limpieza: number;
    otros: number;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// FILTROS
// ============================================

export interface FiltrosPago {
  mes?: number;
  anio?: number;
  habitacionId?: string;
  estado?: EstadoPago;
  concepto?: ConceptoPago;
}

export interface FiltrosGasto {
  mes?: number;
  anio?: number;
  edificioId?: string;
  categoria?: CategoriaGasto;
}

export interface FiltrosHabitacion {
  pisoId?: string;
  edificioId?: string;
  ciudadId?: string;
  estado?: EstadoHabitacion;
}
