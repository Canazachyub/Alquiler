function createDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Crear hoja de Habitaciones
  let sheet = ss.getSheetByName(SHEET_HABITACIONES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_HABITACIONES);
    sheet.appendRow(['ID', 'Nombre', 'Celular', 'MontoAlquiler', 'MontoInternet', 
                    'AlquilerPagado', 'InternetPagado', 'Piso', 'Ubicacion', 'Estado', 'Observaciones']);
  }
  
  // Crear hoja de Inquilinos
  sheet = ss.getSheetByName(SHEET_INQUILINOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_INQUILINOS);
    sheet.appendRow(['ID', 'Nombre', 'Apellido', 'DNI', 'Telefono', 'Email', 
                    'FechaIngreso', 'HabitacionAsignada', 'EstadoActual', 
                    'ContactoEmergencia', 'TelefonoEmergencia', 'Observaciones']);
  }
  
  // Crear hoja de Pagos
  sheet = ss.getSheetByName(SHEET_PAGOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PAGOS);
    sheet.appendRow(['ID', 'Fecha', 'TipoPago', 'Monto', 'Estado', 
                    'MetodoPago', 'Referencia', 'Observaciones']);
  }
  
  // Crear hoja de Gastos
  sheet = ss.getSheetByName(SHEET_GASTOS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_GASTOS);
    sheet.appendRow(['ID', 'Fecha', 'Concepto', 'Categoria', 'Monto', 
                    'HabitacionAsociada', 'ComprobanteURL', 'Observaciones']);
  }
  
  // Crear hoja de Configuración
  sheet = ss.getSheetByName(SHEET_CONFIGURACION);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CONFIGURACION);
    sheet.appendRow(['Clave', 'Valor']);
    sheet.appendRow(['mesActual', new Date().getMonth() + 1]);
    sheet.appendRow(['anoActual', new Date().getFullYear()]);
    sheet.appendRow(['diaVencimiento', 5]);
  }
  
  return 'Base de datos creada correctamente';
}