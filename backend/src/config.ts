// Configuración global del sistema
const CONFIG = {
  // ID del Spreadsheet - CAMBIAR POR TU ID
  SPREADSHEET_ID: '1ugfqN_1yjbIjR_IB-oUR66gX0lbQemGpu0-cF39-m6E',

  // Nombres de las hojas
  SHEETS: {
    CIUDADES: 'Ciudades',
    EDIFICIOS: 'Edificios',
    PISOS: 'Pisos',
    HABITACIONES: 'Habitaciones',
    INQUILINOS: 'Inquilinos',
    PAGOS: 'Pagos',
    GASTOS: 'Gastos',
    INCIDENCIAS: 'Incidencias',
    CONFIGURACION: 'Configuracion',
  },

  // Headers de cada hoja
  HEADERS: {
    CIUDADES: ['ID', 'Nombre', 'Departamento', 'Activo', 'CreatedAt', 'UpdatedAt'],
    EDIFICIOS: ['ID', 'CiudadId', 'Nombre', 'Direccion', 'TotalPisos', 'Activo'],
    PISOS: ['ID', 'EdificioId', 'Numero', 'Descripcion'],
    HABITACIONES: [
      'ID', 'PisoId', 'Codigo', 'Ubicacion', 'MontoAlquiler', 'MontoInternet',
      'MontoServicios', 'Estado', 'Activo', 'Observaciones'
    ],
    INQUILINOS: [
      'ID', 'HabitacionId', 'Nombre', 'Apellido', 'DNI', 'Telefono', 'Email',
      'FechaIngreso', 'FechaSalida', 'Estado', 'ContactoEmergencia',
      'TelefonoEmergencia', 'Observaciones', 'Garantia', 'LlaveHabitacion', 'LlavePuertaCalle'
    ],
    PAGOS: [
      'ID', 'InquilinoId', 'HabitacionId', 'Fecha', 'Mes', 'Anio', 'Concepto',
      'Monto', 'MetodoPago', 'Referencia', 'Estado', 'Observaciones'
    ],
    GASTOS: [
      'ID', 'EdificioId', 'HabitacionId', 'Fecha', 'Concepto', 'Categoria',
      'Monto', 'ComprobanteUrl', 'Observaciones'
    ],
  },
};
