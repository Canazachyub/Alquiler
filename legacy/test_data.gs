function createTestData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Verificar si ya existen datos en habitaciones
    const roomsSheet = ss.getSheetByName(SHEET_HABITACIONES);
    if (!roomsSheet) {
      return 'Error: Primero debe inicializar el sistema con initializeSheets()';
    }
    
    if (roomsSheet.getLastRow() > 1) {
      return 'Ya existen datos en el sistema. Elimine los datos existentes antes de crear datos de prueba.';
    }
    
    // Crear habitaciones de prueba
    const testRooms = [
      ['A1', 'Juan Pérez', '987654321', 150, 20, true, true, '1', 'izquierda', 'occupied', ''],
      ['A2', 'María López', '912345678', 150, 20, true, false, '1', 'derecha', 'occupied', ''],
      ['B1', '', '', 150, 20, false, false, '2', 'izquierda', 'vacant', ''],
      ['B2', 'Carlos Ruiz', '934567812', 150, 20, false, false, '2', 'derecha', 'occupied', ''],
      ['C1', '', '', 150, 20, false, false, '3', 'izquierda', 'vacant', ''],
      ['C2', '', '', 150, 20, false, false, '3', 'derecha', 'vacant', '']
    ];
    
    testRooms.forEach(room => {
      roomsSheet.appendRow(room);
    });
    
    // Crear inquilinos de prueba
    const tenantsSheet = ss.getSheetByName(SHEET_INQUILINOS);
    const testTenants = [
      ['I001', 'Juan', 'Pérez', '45678912', '987654321', 'juan@email.com', new Date('2024-01-15'), 'A1', 'Activo', 'Ana Pérez', '987123456', ''],
      ['I002', 'María', 'López', '42345678', '912345678', 'maria@email.com', new Date('2024-02-10'), 'A2', 'Activo', 'José López', '987123789', ''],
      ['I003', 'Carlos', 'Ruiz', '39012345', '934567812', 'carlos@email.com', new Date('2024-02-15'), 'B2', 'Activo', 'Rosa Ruiz', '988777666', '']
    ];
    
    testTenants.forEach(tenant => {
      tenantsSheet.appendRow(tenant);
    });
    
    // Crear pagos de prueba
    const paymentsSheet = ss.getSheetByName(SHEET_PAGOS);
    const currentDate = new Date();
    const testPayments = [
      ['P001', new Date(currentDate.getFullYear(), currentDate.getMonth(), 5), 'Alquiler', 150, 'Pagado', 'Efectivo', '', 'Pago puntual'],
      ['P002', new Date(currentDate.getFullYear(), currentDate.getMonth(), 5), 'Internet', 20, 'Pagado', 'Yape', 'REF123', ''],
      ['P003', new Date(currentDate.getFullYear(), currentDate.getMonth(), 6), 'Alquiler', 150, 'Pagado', 'Transferencia', 'TRF456', 'Pago completo']
    ];
    
    testPayments.forEach(payment => {
      paymentsSheet.appendRow(payment);
    });
    
    // Crear gastos de prueba
    const expensesSheet = ss.getSheetByName(SHEET_GASTOS);
    const testExpenses = [
      ['G001', new Date(currentDate.getFullYear(), currentDate.getMonth(), 10), 'Limpieza áreas comunes', 'Limpieza', 50, '', '', 'Limpieza mensual'],
      ['G002', new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), 'Reparación puerta', 'Mantenimiento', 80, 'A1', '', 'Puerta atascada'],
      ['G003', new Date(currentDate.getFullYear(), currentDate.getMonth(), 20), 'Recibo de luz', 'Servicios', 120, '', '', 'Consumo mensual']
    ];
    
    testExpenses.forEach(expense => {
      expensesSheet.appendRow(expense);
    });
    
    // Crear incidencias de prueba
    const incidentsSheet = ss.getSheetByName(SHEET_INCIDENCIAS);
    const testIncidents = [
      ['INC001', new Date(), 'A1', 'I001', 'Mantenimiento', 'Fuga en el baño', 'Alta', 'Pendiente', '', 0, '', ''],
      ['INC002', new Date(currentDate.getFullYear(), currentDate.getMonth(), 5), 'B2', 'I003', 'Daño', 'Ventana rota', 'Media', 'Resuelto', new Date(currentDate.getFullYear(), currentDate.getMonth(), 7), 50, 'Técnico externo', 'Reemplazada']
    ];
    
    testIncidents.forEach(incident => {
      incidentsSheet.appendRow(incident);
    });
    
    return 'Datos de prueba creados correctamente con ' + 
           testRooms.length + ' habitaciones, ' + 
           testTenants.length + ' inquilinos, ' + 
           testPayments.length + ' pagos, ' + 
           testExpenses.length + ' gastos y ' + 
           testIncidents.length + ' incidencias.';
  } catch (error) {
    console.error('Error en createTestData:', error);
    return 'Error al crear datos de prueba: ' + error.toString();
  }
}

// Función para limpiar todos los datos (útil para reiniciar)
function clearAllData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = [
      SHEET_HABITACIONES,
      SHEET_INQUILINOS,
      SHEET_PAGOS,
      SHEET_GASTOS,
      SHEET_INCIDENCIAS,
      SHEET_NOTIFICACIONES,
      SHEET_VOUCHERS
    ];
    
    sheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }
    });
    
    return 'Todos los datos han sido eliminados (excepto encabezados)';
  } catch (error) {
    console.error('Error en clearAllData:', error);
    return 'Error al limpiar datos: ' + error.toString();
  }
}