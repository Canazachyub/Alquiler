// Configuración global
const SPREADSHEET_ID = '1ugfqN_1yjbIjR_IB-oUR66gX0lbQemGpu0-cF39-m6E';
const SHEET_HABITACIONES = 'Habitaciones';
const SHEET_PAGOS = 'Pagos';
const SHEET_INQUILINOS = 'Inquilinos';
const SHEET_INCIDENCIAS = 'Incidencias';
const SHEET_GASTOS = 'Gastos';
const SHEET_NOTIFICACIONES = 'Notificaciones';
const SHEET_VOUCHERS = 'Vouchers';
const SHEET_CONFIGURACION = 'Configuracion';

// Función principal para servir el HTML
function doGet() {
  return HtmlService.createHtmlOutputFromFile('panel')
    .setTitle('Sistema de Alquiler')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

// Función auxiliar para convertir nombres de columnas
function toCamelCase(str) {
  const words = str.split(/(?=[A-Z])/);
  return words.map((word, index) => {
    if (index === 0) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}

// Función para obtener todas las habitaciones - VERSIÓN ROBUSTA
function getAllRooms() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_HABITACIONES);
    
    if (!sheet) {
      console.log('Hoja de habitaciones no encontrada');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const rooms = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      const room = {};
      for (let j = 0; j < headers.length; j++) {
        const fieldName = toCamelCase(headers[j]);
        room[fieldName] = data[i][j];
      }
      
      // Asegurar que los nombres estén disponibles
      room['id'] = room['iD'] || room['id'];
      room['nombre'] = room['nombre'] || '';
      room['montoalquiler'] = room['montoAlquiler'] || 0;
      room['montointernet'] = room['montoInternet'] || 0;
      room['alquilerpagado'] = room['alquilerPagado'] || false;
      room['internetpagado'] = room['internetPagado'] || false;
      room['estado'] = room['estado'] || 'vacant';
      room['celular'] = room['celular'] || '';
      room['ubicacion'] = room['ubicacion'] || '';
      room['piso'] = room['piso'] || '';
      room['observaciones'] = room['observaciones'] || '';
      
      rooms.push(room);
    }
    
    return rooms;
  } catch (error) {
    console.error('Error en getAllRooms:', error);
    return [];
  }
}

// Función para obtener todos los inquilinos - VERSIÓN ROBUSTA
// Función para obtener todos los inquilinos - VERSIÓN CORREGIDA
function getAllTenants() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INQUILINOS);
    
    if (!sheet) {
      console.error('Hoja de inquilinos no encontrada');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('No hay datos de inquilinos');
      return [];
    }
    
    const headers = data[0];
    const tenants = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      const tenant = {};
      for (let j = 0; j < headers.length; j++) {
        const fieldName = toCamelCase(headers[j]);
        let value = data[i][j];
        
        // Convertir fechas a string para evitar problemas de serialización
        if (value instanceof Date) {
          value = value.toISOString();
        }
        
        tenant[fieldName] = value;
      }
      
      // Asegurar compatibilidad
      tenant['habitacionasignada'] = tenant['habitacionAsignada'];
      tenant['estadoactual'] = tenant['estadoActual'];
      
      tenants.push(tenant);
    }
    
    console.log('Inquilinos a enviar:', tenants.length);
    return tenants;
  } catch (error) {
    console.error('Error en getAllTenants:', error);
    return [];
  }
}

// Función para actualizar datos de habitación - COMPLETA
function updateRoomData(roomData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_HABITACIONES);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de habitaciones no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === roomData.id) {
        sheet.getRange(i + 1, 1, 1, 11).setValues([[
          roomData.id,
          roomData.nombre,
          roomData.celular,
          roomData.montoAlquiler,
          roomData.montoInternet,
          roomData.alquilerPagado,
          roomData.internetPagado,
          roomData.piso,
          roomData.ubicacion,
          roomData.estado,
          roomData.observaciones
        ]]);
        break;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error en updateRoomData:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para agregar nuevo inquilino - COMPLETA
function addTenant(tenantData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INQUILINOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de inquilinos no encontrada' };
    }
    
    if (!tenantData.id) {
      tenantData.id = 'I' + new Date().getTime();
    }
    
    sheet.appendRow([
      tenantData.id,
      tenantData.nombre,
      tenantData.apellido || '',
      tenantData.dni,
      tenantData.telefono,
      tenantData.email || '',
      tenantData.fechaIngreso,
      tenantData.habitacionAsignada,
      'Activo',
      tenantData.contactoEmergencia || '',
      tenantData.telefonoEmergencia || '',
      tenantData.observaciones || ''
    ]);
    
    // Actualizar el estado de la habitación
    updateRoomStatus(tenantData.habitacionAsignada, 'occupied', tenantData.nombre);
    
    return { success: true, id: tenantData.id };
  } catch (error) {
    console.error('Error en addTenant:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para actualizar estado de habitación - CORREGIDA
function updateRoomStatus(roomId, status, tenantName = '') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_HABITACIONES);
    
    if (!sheet) return false;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === roomId) {
        sheet.getRange(i + 1, 2).setValue(tenantName); // Nombre
        sheet.getRange(i + 1, 10).setValue(status); // Estado
        break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error en updateRoomStatus:', error);
    return false;
  }
}

// Función para obtener pagos por mes - VERSIÓN CORREGIDA
function getPaymentsByMonth(year, month) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_PAGOS);
    
    if (!sheet) {
      console.log('Hoja de pagos no encontrada');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const payments = [];
    
    for (let i = 1; i < data.length; i++) {
      const fecha = data[i][1];
      if (fecha instanceof Date && 
          fecha.getMonth() + 1 === month && 
          fecha.getFullYear() === year) {
        
        payments.push({
          id: data[i][0],
          fecha: fecha.toISOString(),
          habitacionId: data[i][2],  // AÑADIR ESTA LÍNEA
          tipoPago: data[i][3],
          monto: data[i][4],
          estado: data[i][5],
          metodoPago: data[i][6],
          referencia: data[i][7],
          observaciones: data[i][8]
        });
      }
    }
    
    return payments;
  } catch (error) {
    console.error('Error en getPaymentsByMonth:', error);
    return [];
  }
}

// Función para registrar nuevo pago - CORREGIDA
function registerPayment(paymentData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_PAGOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de pagos no encontrada' };
    }
    
    const paymentId = 'P' + new Date().getTime();
    
    // CORRECCIÓN: Agregar habitacionId correctamente
    sheet.appendRow([
      paymentId,
      new Date(paymentData.fecha),
      paymentData.habitacionId,  // CAMPO FALTANTE
      paymentData.concepto,
      paymentData.monto,
      'Pagado',
      paymentData.metodoPago,
      paymentData.voucher || '',
      paymentData.observaciones || ''
    ]);
    
    // Actualizar estado de pago en habitaciones
    if (paymentData.concepto.toLowerCase().includes('alquiler')) {
      updateRoomPaymentStatus(paymentData.habitacionId, 'alquiler', true);
    } else if (paymentData.concepto.toLowerCase().includes('internet')) {
      updateRoomPaymentStatus(paymentData.habitacionId, 'internet', true);
    }
    
    return { success: true, paymentId: paymentId };
  } catch (error) {
    console.error('Error en registerPayment:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para actualizar estado de pago en habitación - CORREGIDA
function updateRoomPaymentStatus(roomId, type, paid) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_HABITACIONES);
    
    if (!sheet) return false;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === roomId) {
        if (type === 'alquiler') {
          sheet.getRange(i + 1, 6).setValue(paid); // AlquilerPagado
        } else if (type === 'internet') {
          sheet.getRange(i + 1, 7).setValue(paid); // InternetPagado
        }
        break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error en updateRoomPaymentStatus:', error);
    return false;
  }
}

// Función para obtener gastos por mes - VERSIÓN CORREGIDA
function getExpensesByMonth(year, month) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    
    if (!sheet) {
      console.log('Hoja de gastos no encontrada');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const expenses = [];
    
    for (let i = 1; i < data.length; i++) {
      const fecha = data[i][1];
      if (fecha instanceof Date && 
          fecha.getMonth() + 1 === month && 
          fecha.getFullYear() === year) {
        
        expenses.push({
          id: data[i][0],
          fecha: fecha.toISOString(), // Convertir a string
          concepto: data[i][2],
          categoria: data[i][3],
          monto: data[i][4],
          habitacionAsociada: data[i][5],
          observaciones: data[i][7]
        });
      }
    }
    
    return expenses;
  } catch (error) {
    console.error('Error en getExpensesByMonth:', error);
    return [];
  }
}

// Función para registrar nuevo gasto - CORREGIDA
function registerExpense(expenseData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de gastos no encontrada' };
    }
    
    const expenseId = 'G' + new Date().getTime();
    
    sheet.appendRow([
      expenseId,
      new Date(expenseData.fecha),
      expenseData.concepto,
      expenseData.categoria,
      expenseData.monto,
      expenseData.habitacionArea || '',
      expenseData.comprobante || '',
      expenseData.observaciones || ''
    ]);
    
    return { success: true, expenseId: expenseId };
  } catch (error) {
    console.error('Error en registerExpense:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para obtener reporte mensual
function getMonthlyReport() {
  try {
    const rooms = getAllRooms();
    const tenants = getAllTenants();
    const currentDate = new Date();
    const payments = getPaymentsByMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
    const expenses = getExpensesByMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
    
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.estado === 'occupied').length;
    const paidRooms = rooms.filter(r => r.alquilerPagado === true || r.alquilerPagado === 'TRUE').length;
    const totalIncome = payments.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0);
    
    return {
      totalRooms: totalRooms,
      occupiedRooms: occupiedRooms,
      occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0,
      paidRooms: paidRooms,
      pendingRooms: occupiedRooms - paidRooms,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      balance: totalIncome - totalExpenses
    };
  } catch (error) {
    console.error('Error en getMonthlyReport:', error);
    return {
      totalRooms: 0,
      occupiedRooms: 0,
      occupancyRate: 0,
      paidRooms: 0,
      pendingRooms: 0,
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0
    };
  }
}

// Función para obtener configuración actual - CORREGIDA
function getCurrentMonth() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_CONFIGURACION);
    
    if (!sheet) {
      const now = new Date();
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'mesActual') {
        const month = parseInt(data[i][1]) || new Date().getMonth() + 1;
        const year = parseInt(data[i+1] && data[i+1][1]) || new Date().getFullYear();
        return { month: month, year: year };
      }
    }
    
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  } catch (error) {
    console.error('Error en getCurrentMonth:', error);
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
}

// Función para actualizar mes actual - CORREGIDA
function updateCurrentMonth(year, month) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_CONFIGURACION);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_CONFIGURACION);
      sheet.appendRow(['Clave', 'Valor']);
    }
    
    const data = sheet.getDataRange().getValues();
    let monthRowIndex = -1;
    let yearRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'mesActual') monthRowIndex = i + 1;
      if (data[i][0] === 'anoActual') yearRowIndex = i + 1;
    }
    
    if (monthRowIndex > 0) {
      sheet.getRange(monthRowIndex, 2).setValue(month);
    } else {
      sheet.appendRow(['mesActual', month]);
    }
    
    if (yearRowIndex > 0) {
      sheet.getRange(yearRowIndex, 2).setValue(year);
    } else {
      sheet.appendRow(['anoActual', year]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error en updateCurrentMonth:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para inicializar el sistema - CORREGIDA
function initializeSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = [
      {
        name: SHEET_HABITACIONES, 
        headers: ['ID', 'Nombre', 'Celular', 'MontoAlquiler', 'MontoInternet', 'AlquilerPagado', 'InternetPagado', 'Piso', 'Ubicacion', 'Estado', 'Observaciones']
      },
      {
        name: SHEET_INQUILINOS, 
        headers: ['ID', 'Nombre', 'Apellido', 'DNI', 'Telefono', 'Email', 'FechaIngreso', 'HabitacionAsignada', 'EstadoActual', 'ContactoEmergencia', 'TelefonoEmergencia', 'Observaciones']
      },
      {
        name: SHEET_PAGOS, 
        headers: ['ID', 'Fecha', 'HabitacionID', 'TipoPago', 'Monto', 'Estado', 'MetodoPago', 'Referencia', 'Observaciones']
      },
      {
        name: SHEET_GASTOS, 
        headers: ['ID', 'Fecha', 'Concepto', 'Categoria', 'Monto', 'HabitacionAsociada', 'ComprobanteURL', 'Observaciones']
      },
      {
        name: SHEET_INCIDENCIAS, 
        headers: ['ID', 'Fecha', 'HabitacionID', 'InquilinoID', 'TipoIncidencia', 'Descripcion', 'Prioridad', 'Estado', 'FechaResolucion', 'CostoResolucion', 'ResponsableResolucion', 'Observaciones']
      },
      {
        name: SHEET_NOTIFICACIONES, 
        headers: ['ID', 'Fecha', 'Destinatario', 'Tipo', 'Mensaje', 'Estado', 'FechaEnvio', 'Observaciones']
      },
      {
        name: SHEET_VOUCHERS, 
        headers: ['ID', 'HabitacionID', 'Fecha', 'NumeroVoucher', 'Monto', 'Estado', 'URL']
      },
      {
        name: SHEET_CONFIGURACION, 
        headers: ['Clave', 'Valor']
      }
    ];
    
    sheets.forEach(sheetConfig => {
      let sheet = ss.getSheetByName(sheetConfig.name);
      if (!sheet) {
        sheet = ss.insertSheet(sheetConfig.name);
        sheet.appendRow(sheetConfig.headers);
        sheet.getRange(1, 1, 1, sheetConfig.headers.length).setFontWeight('bold');
      }
    });
    
    // Inicializar configuración
    const configSheet = ss.getSheetByName(SHEET_CONFIGURACION);
    if (configSheet.getLastRow() === 1) {
      const now = new Date();
      configSheet.appendRow(['mesActual', now.getMonth() + 1]);
      configSheet.appendRow(['anoActual', now.getFullYear()]);
      configSheet.appendRow(['diaVencimiento', 5]);
      configSheet.appendRow(['porcentajeMora', 5]);
    }
    
    return 'Sistema inicializado correctamente';
  } catch (error) {
    console.error('Error en initializeSheets:', error);
    return 'Error al inicializar: ' + error.toString();
  }
}

// Funciones de prueba y debug
function testGetTenants() {
  const tenants = getAllTenants();
  console.log('Test - Inquilinos obtenidos:');
  tenants.forEach((tenant, index) => {
    console.log(`Inquilino ${index + 1}:`, JSON.stringify(tenant));
  });
  return tenants;
}

function debugSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  console.log('Hojas existentes:');
  sheets.forEach(sheet => {
    console.log(`- ${sheet.getName()} (${sheet.getLastRow()} filas)`);
  });
}

// Función para crear datos de prueba
function createTestData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Crear habitaciones de prueba
    const roomsSheet = ss.getSheetByName(SHEET_HABITACIONES);
    if (roomsSheet && roomsSheet.getLastRow() === 1) {
      const testRooms = [
        ['A1', 'Juan Pérez', '987654321', 150, 20, true, true, '1', 'izquierda', 'occupied', ''],
        ['A2', 'María López', '912345678', 150, 20, true, false, '1', 'derecha', 'occupied', ''],
        ['B1', '', '', 150, 20, false, false, '2', 'izquierda', 'vacant', ''],
        ['B2', 'Carlos Ruiz', '934567812', 150, 20, false, false, '2', 'derecha', 'occupied', '']
      ];
      
      testRooms.forEach(room => {
        roomsSheet.appendRow(room);
      });
    }
    
    // VERIFICAR si ya hay inquilinos antes de agregar
    const tenantsSheet = ss.getSheetByName(SHEET_INQUILINOS);
    if (tenantsSheet && tenantsSheet.getLastRow() === 1) {  // Solo si no hay datos
      const testTenants = [
        ['I001', 'Juan', 'Pérez', '45678912', '987654321', 'juan@email.com', '2024-01-15', 'A1', 'Activo', 'Ana Pérez', '987123456', ''],
        ['I002', 'María', 'López', '42345678', '912345678', 'maria@email.com', '2024-02-10', 'A2', 'Activo', 'José López', '987123789', ''],
        ['I003', 'Carlos', 'Ruiz', '39012345', '934567812', 'carlos@email.com', '2024-02-15', 'B2', 'Activo', 'Rosa Ruiz', '988777666', '']
      ];
      
      testTenants.forEach(tenant => {
        tenantsSheet.appendRow(tenant);
      });
    }
    
    return 'Datos de prueba creados correctamente';
  } catch (error) {
    console.error('Error en createTestData:', error);
    return 'Error al crear datos de prueba: ' + error.toString();
  }
}


function updateTenant(tenantData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INQUILINOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de inquilinos no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tenantData.id) {
        // Actualizar fila del inquilino
        sheet.getRange(i + 1, 1, 1, 12).setValues([[
          tenantData.id,
          tenantData.nombre,
          tenantData.apellido || '',
          tenantData.dni,
          tenantData.telefono,
          tenantData.email || '',
          data[i][6], // Mantener fecha de ingreso original
          tenantData.habitacionAsignada,
          tenantData.estadoActual || 'Activo',
          tenantData.contactoEmergencia || '',
          tenantData.telefonoEmergencia || '',
          tenantData.observaciones || ''
        ]]);
        
        // Si cambió de habitación, actualizar las habitaciones correspondientes
        if (data[i][7] !== tenantData.habitacionAsignada) {
          // Liberar habitación anterior
          updateRoomStatus(data[i][7], 'vacant', '');
          // Ocupar nueva habitación
          updateRoomStatus(tenantData.habitacionAsignada, 'occupied', tenantData.nombre);
        }
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'Inquilino no encontrado' };
  } catch (error) {
    console.error('Error en updateTenant:', error);
    return { success: false, message: error.toString() };
  }
}

function deleteTenant(tenantId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INQUILINOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de inquilinos no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tenantId) {
        const habitacionId = data[i][7];
        
        // Eliminar inquilino
        sheet.deleteRow(i + 1);
        
        // Liberar habitación
        updateRoomStatus(habitacionId, 'vacant', '');
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'Inquilino no encontrado' };
  } catch (error) {
    console.error('Error en deleteTenant:', error);
    return { success: false, message: error.toString() };
  }
}

function getTenantById(tenantId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INQUILINOS);
    
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tenantId) {
        return {
          id: data[i][0],
          nombre: data[i][1],
          apellido: data[i][2],
          dni: data[i][3],
          telefono: data[i][4],
          email: data[i][5],
          fechaIngreso: data[i][6] instanceof Date ? data[i][6].toISOString() : data[i][6],
          habitacionAsignada: data[i][7],
          estadoActual: data[i][8],
          contactoEmergencia: data[i][9],
          telefonoEmergencia: data[i][10],
          observaciones: data[i][11]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error en getTenantById:', error);
    return null;
  }
}

// Función para menú personalizado - CORREGIDA
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Sistema de Alquiler')
      .addItem('Inicializar Sistema', 'initializeSheets')
      .addItem('Crear Datos de Prueba', 'createTestData')
      .addItem('Abrir Panel', 'openPanel')
      .addSeparator()
      .addItem('Debug: Verificar Sistema', 'verifySystemSetup')
      .addItem('Debug: Reparar Sistema', 'repairSystem')
      .addItem('Debug: Test Inquilinos Simple', 'testTenantsSimple')
      .addItem('Debug: Ver Hojas', 'debugSheets')
      .addToUi();
  } catch (error) {
    console.log('Error en onOpen:', error);
  }
}

// Función para abrir el panel web
function openPanel() {
  const html = HtmlService.createHtmlOutput('<script>window.open("' + ScriptApp.getService().getUrl() + '", "_blank");</script>')
    .setWidth(200)
    .setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo panel...');
}

// Función de verificación completa del sistema
function verifySystemSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  console.log('=== VERIFICACIÓN DEL SISTEMA ===');
  console.log('Spreadsheet ID:', ss.getId());
  
  // Verificar todas las hojas
  const requiredSheets = [
    SHEET_HABITACIONES,
    SHEET_INQUILINOS,
    SHEET_PAGOS,
    SHEET_GASTOS,
    SHEET_CONFIGURACION
  ];
  
  const existingSheets = ss.getSheets().map(sheet => sheet.getName());
  console.log('Hojas existentes:', existingSheets);
  
  requiredSheets.forEach(sheetName => {
    if (existingSheets.includes(sheetName)) {
      const sheet = ss.getSheetByName(sheetName);
      console.log(`✓ ${sheetName}: ${sheet.getLastRow()} filas, ${sheet.getLastColumn()} columnas`);
      
      // Mostrar encabezados
      if (sheet.getLastRow() > 0) {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        console.log(`  Encabezados: ${headers.join(', ')}`);
      }
    } else {
      console.log(`✗ ${sheetName}: NO EXISTE`);
    }
  });
  
  // Probar getAllTenants
  console.log('\n=== TEST getAllTenants ===');
  try {
    const tenants = getAllTenants();
    console.log('Resultado:', tenants);
    console.log('Número de inquilinos:', tenants.length);
    if (tenants.length > 0) {
      console.log('Primer inquilino:', JSON.stringify(tenants[0], null, 2));
    }
  } catch (error) {
    console.error('ERROR en getAllTenants:', error);
  }
  
  return 'Verificación completada - Ver logs';
}

// Función para reparar el sistema
function repairSystem() {
  console.log('=== REPARANDO SISTEMA ===');
  
  // Primero inicializar hojas
  const initResult = initializeSheets();
  console.log('Inicialización:', initResult);
  
  // Verificar que las hojas estén correctas
  const verifyResult = verifySystemSetup();
  console.log('Verificación:', verifyResult);
  
  return 'Sistema reparado - Ver logs';
}

// Función simple de prueba para inquilinos
function testTenantsSimple() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Inquilinos');
    
    if (!sheet) {
      return 'ERROR: Hoja Inquilinos no encontrada';
    }
    
    const data = sheet.getDataRange().getValues();
    console.log('Datos completos de la hoja:');
    data.forEach((row, index) => {
      console.log(`Fila ${index}:`, row);
    });
    
    return `Se encontraron ${data.length} filas en total`;
  } catch (error) {
    return 'ERROR: ' + error.toString();
  }
}

// Función de prueba directa
function testGetAllTenants() {
  const tenants = getAllTenants();
  console.log('Test directo - Inquilinos:', JSON.stringify(tenants, null, 2));
  return tenants;
}

function initializeSystem() {
  const result = initializeSheets();
  console.log(result);
  
  // Crear datos de prueba si es necesario
  const testResult = createTestData();
  console.log(testResult);
  
  // Verificar
  const tenants = getAllTenants();
  console.log('Inquilinos después de inicialización:', tenants);
  
  return 'Sistema inicializado';
}

function cleanDuplicates() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const tenantsSheet = ss.getSheetByName(SHEET_INQUILINOS);
    
    if (!tenantsSheet) return 'Hoja de inquilinos no encontrada';
    
    const data = tenantsSheet.getDataRange().getValues();
    const uniqueData = [data[0]]; // Mantener encabezados
    const seen = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const id = data[i][0];
      if (id && !seen.has(id)) {
        seen.add(id);
        uniqueData.push(data[i]);
      }
    }
    
    // Limpiar la hoja y agregar datos únicos
    tenantsSheet.clear();
    tenantsSheet.getRange(1, 1, uniqueData.length, uniqueData[0].length).setValues(uniqueData);
    
    return `Eliminados ${data.length - uniqueData.length} duplicados`;
  } catch (error) {
    console.error('Error en cleanDuplicates:', error);
    return 'Error: ' + error.toString();
  }
}

function resetSystem() {
  // 1. Limpiar duplicados
  console.log(cleanDuplicates());
  
  // 2. Verificar sistema
  console.log(verifySystemSetup());
  
  // 3. Probar funciones
  console.log('Test getAllTenants:', getAllTenants());
  console.log('Test getAllRooms:', getAllRooms());
  
  return 'Sistema reiniciado';
}

function diagnoseProblem() {
  console.log('=== DIAGNÓSTICO ===');
  
  // 1. Verificar acceso al spreadsheet
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✓ Spreadsheet accesible:', ss.getName());
  } catch (error) {
    console.error('✗ Error accediendo al spreadsheet:', error);
    return 'Error: No se puede acceder al spreadsheet';
  }
  
  // 2. Verificar hoja de inquilinos
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INQUILINOS);
    if (!sheet) {
      console.error('✗ Hoja de inquilinos no encontrada');
      return 'Error: Hoja de inquilinos no existe';
    }
    console.log('✓ Hoja de inquilinos encontrada');
    
    const data = sheet.getDataRange().getValues();
    console.log(`✓ Datos en hoja: ${data.length} filas`);
    
    // 3. Probar getAllTenants
    const tenants = getAllTenants();
    console.log('✓ getAllTenants devolvió:', tenants);
    
    return {
      success: true,
      message: 'Diagnóstico completo',
      tenants: tenants
    };
  } catch (error) {
    console.error('✗ Error en diagnóstico:', error);
    return 'Error: ' + error.toString();
  }
}

// Función de debug para probar la comunicación
function testWebAppConnection() {
  try {
    const tenants = getAllTenants();
    const rooms = getAllRooms();
    
    return {
      success: true,
      tenants: tenants ? tenants.length : 0,
      rooms: rooms ? rooms.length : 0,
      message: 'Conexión exitosa'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Error en la conexión'
    };
  }
}


// === NUEVAS FUNCIONES PARA MEJORAR EL SISTEMA ===

// Función para obtener incidencias
function getIncidents() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INCIDENCIAS);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const incidents = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      incidents.push({
        id: data[i][0],
        fecha: data[i][1] instanceof Date ? data[i][1].toISOString() : data[i][1],
        habitacionID: data[i][2],
        inquilinoID: data[i][3],
        tipoIncidencia: data[i][4],
        descripcion: data[i][5],
        prioridad: data[i][6],
        estado: data[i][7],
        fechaResolucion: data[i][8] instanceof Date ? data[i][8].toISOString() : data[i][8],
        costoResolucion: data[i][9],
        responsableResolucion: data[i][10],
        observaciones: data[i][11]
      });
    }
    
    return incidents;
  } catch (error) {
    console.error('Error en getIncidents:', error);
    return [];
  }
}

// Función para registrar nueva incidencia
function registerIncident(incidentData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INCIDENCIAS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de incidencias no encontrada' };
    }
    
    const incidentId = 'INC' + new Date().getTime();
    
    sheet.appendRow([
      incidentId,
      new Date(),
      incidentData.habitacionID,
      incidentData.inquilinoID || '',
      incidentData.tipoIncidencia,
      incidentData.descripcion,
      incidentData.prioridad,
      'Pendiente',
      '',
      0,
      '',
      incidentData.observaciones || ''
    ]);
    
    // Enviar notificación
    createNotification('Nueva incidencia reportada', `Incidencia ${incidentId} - ${incidentData.tipoIncidencia}`);
    
    return { success: true, incidentId: incidentId };
  } catch (error) {
    console.error('Error en registerIncident:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para actualizar estado de incidencia
function updateIncidentStatus(incidentId, status, resolutionData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INCIDENCIAS);
    
    if (!sheet) return false;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === incidentId) {
        sheet.getRange(i + 1, 8).setValue(status);
        
        if (status === 'Resuelto' && resolutionData) {
          sheet.getRange(i + 1, 9).setValue(new Date());
          sheet.getRange(i + 1, 10).setValue(resolutionData.costo || 0);
          sheet.getRange(i + 1, 11).setValue(resolutionData.responsable || '');
          sheet.getRange(i + 1, 12).setValue(resolutionData.observaciones || '');
        }
        break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error en updateIncidentStatus:', error);
    return false;
  }
}

// Función para crear notificación
function createNotification(tipo, mensaje, destinatario = 'Admin') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NOTIFICACIONES);
    
    if (!sheet) return false;
    
    const notificationId = 'NOT' + new Date().getTime();
    
    sheet.appendRow([
      notificationId,
      new Date(),
      destinatario,
      tipo,
      mensaje,
      'Pendiente',
      '',
      ''
    ]);
    
    return true;
  } catch (error) {
    console.error('Error en createNotification:', error);
    return false;
  }
}

// Función para obtener notificaciones pendientes
function getPendingNotifications() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NOTIFICACIONES);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const notifications = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === 'Pendiente') {
        notifications.push({
          id: data[i][0],
          fecha: data[i][1] instanceof Date ? data[i][1].toISOString() : data[i][1],
          destinatario: data[i][2],
          tipo: data[i][3],
          mensaje: data[i][4]
        });
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Error en getPendingNotifications:', error);
    return [];
  }
}

// Función para gestionar vouchers
function uploadVoucher(voucherData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_VOUCHERS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de vouchers no encontrada' };
    }
    
    const voucherId = 'V' + new Date().getTime();
    
    sheet.appendRow([
      voucherId,
      voucherData.habitacionID,
      new Date(),
      voucherData.numeroVoucher,
      voucherData.monto,
      'Pendiente',
      voucherData.url || ''
    ]);
    
    return { success: true, voucherId: voucherId };
  } catch (error) {
    console.error('Error en uploadVoucher:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para obtener estadísticas avanzadas
// Función para obtener estadísticas avanzadas - VERSIÓN COMPLETA Y CORREGIDA
function getAdvancedStats() {
  try {
    // Obtener datos básicos
    const rooms = getAllRooms();
    const tenants = getAllTenants();
    
    // Obtener configuración del mes actual con manejo de errores
    let currentConfig;
    try {
      currentConfig = getCurrentMonth();
    } catch (e) {
      console.log('Error obteniendo mes actual, usando fecha del sistema:', e);
      const now = new Date();
      currentConfig = { 
        month: now.getMonth() + 1, 
        year: now.getFullYear() 
      };
    }
    
    const currentYear = currentConfig.year;
    const currentMonth = currentConfig.month;
    
    // Obtener pagos y gastos del mes
    let payments = [];
    let expenses = [];
    let incidents = [];
    
    try {
      payments = getPaymentsByMonth(currentYear, currentMonth);
    } catch (e) {
      console.log('Error obteniendo pagos:', e);
      payments = [];
    }
    
    try {
      expenses = getExpensesByMonth(currentYear, currentMonth);
    } catch (e) {
      console.log('Error obteniendo gastos:', e);
      expenses = [];
    }
    
    try {
      incidents = getIncidents();
    } catch (e) {
      console.log('Error obteniendo incidencias:', e);
      incidents = [];
    }
    
    // Análisis de morosidad
    const overdueTenants = [];
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const dueDay = 5; // Día de vencimiento
    
    rooms.forEach(room => {
      // Verificar si la habitación está ocupada
      const isOccupied = room.estado === 'occupied';
      
      if (isOccupied) {
        // Verificar estado de pago con múltiples formatos posibles
        const alquilerPagado = room.alquilerpagado === true || 
                              room.alquilerpagado === 'TRUE' || 
                              room.alquilerpagado === 'true' ||
                              room.alquilerPagado === true ||
                              room.alquilerPagado === 'TRUE';
        
        const internetPagado = room.internetpagado === true || 
                              room.internetpagado === 'TRUE' || 
                              room.internetpagado === 'true' ||
                              room.internetPagado === true ||
                              room.internetPagado === 'TRUE';
        
        // Si alguno no está pagado, calcular deuda
        if (!alquilerPagado || !internetPagado) {
          let montoAdeudado = 0;
          
          if (!alquilerPagado) {
            montoAdeudado += parseFloat(room.montoalquiler || room.montoAlquiler || 0);
          }
          
          if (!internetPagado) {
            montoAdeudado += parseFloat(room.montointernet || room.montoInternet || 0);
          }
          
          // Solo agregar si hay deuda real
          if (montoAdeudado > 0) {
            // Buscar inquilino asociado
            const tenant = tenants.find(t => {
              const habitacionAsignada = t.habitacionAsignada || t.habitacionasignada;
              const roomId = room.id || room.iD || room.ID;
              return habitacionAsignada === roomId;
            });
            
            // Calcular días vencidos
            let diasVencido = 0;
            if (currentMonth === (currentDate.getMonth() + 1) && 
                currentYear === currentDate.getFullYear()) {
              // Solo calcular días vencidos si estamos en el mes actual
              if (currentDay > dueDay) {
                diasVencido = currentDay - dueDay;
              }
            } else if (currentYear < currentDate.getFullYear() || 
                      (currentYear === currentDate.getFullYear() && currentMonth < (currentDate.getMonth() + 1))) {
              // Si es un mes anterior, calcular días desde el vencimiento
              const dueDate = new Date(currentYear, currentMonth - 1, dueDay);
              diasVencido = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
            }
            
            overdueTenants.push({
              habitacion: room.id || room.iD || room.ID || 'Sin ID',
              inquilino: tenant ? (tenant.nombre + ' ' + (tenant.apellido || '')) : (room.nombre || 'Sin inquilino'),
              telefono: room.celular || tenant?.telefono || '',
              montoAdeudado: montoAdeudado,
              diasVencido: Math.max(0, diasVencido),
              conceptosPendientes: [
                !alquilerPagado ? 'Alquiler' : null,
                !internetPagado ? 'Internet' : null
              ].filter(Boolean).join(', ')
            });
          }
        }
      }
    });
    
    // Ordenar por monto adeudado descendente
    overdueTenants.sort((a, b) => b.montoAdeudado - a.montoAdeudado);
    
    // Análisis de incidencias
    let pendingIncidents = 0;
    let urgentIncidents = 0;
    let resolvedIncidents = 0;
    
    if (Array.isArray(incidents)) {
      incidents.forEach(incident => {
        if (incident.estado === 'Pendiente') {
          pendingIncidents++;
          if (incident.prioridad === 'Alta') {
            urgentIncidents++;
          }
        } else if (incident.estado === 'Resuelto') {
          resolvedIncidents++;
        }
      });
    }
    
    // Análisis de gastos por categoría
    const expensesByCategory = {};
    let totalExpenses = 0;
    
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        const category = expense.categoria || 'Otros';
        const amount = parseFloat(expense.monto || 0);
        
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = 0;
        }
        expensesByCategory[category] += amount;
        totalExpenses += amount;
      });
    }
    
    // Análisis de ingresos
    let totalIncome = 0;
    let paymentCount = 0;
    const paymentMethods = {};
    
    if (Array.isArray(payments)) {
      payments.forEach(payment => {
        const amount = parseFloat(payment.monto || 0);
        totalIncome += amount;
        paymentCount++;
        
        const method = payment.metodoPago || 'Efectivo';
        if (!paymentMethods[method]) {
          paymentMethods[method] = 0;
        }
        paymentMethods[method] += amount;
      });
    }
    
    // Calcular estadísticas adicionales
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.estado === 'occupied').length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    
    // Retornar objeto completo con todas las estadísticas
    return {
      // Morosidad
      overdueTenants: overdueTenants,
      totalOverdue: overdueTenants.reduce((sum, t) => sum + t.montoAdeudado, 0),
      overdueCount: overdueTenants.length,
      
      // Incidencias
      pendingIncidents: pendingIncidents,
      urgentIncidents: urgentIncidents,
      resolvedIncidents: resolvedIncidents,
      totalIncidents: incidents.length,
      
      // Gastos
      expensesByCategory: expensesByCategory,
      totalExpenses: totalExpenses,
      
      // Ingresos
      totalIncome: totalIncome,
      paymentCount: paymentCount,
      paymentMethods: paymentMethods,
      
      // Ocupación
      totalRooms: totalRooms,
      occupiedRooms: occupiedRooms,
      vacantRooms: vacantRooms,
      occupancyRate: parseFloat(occupancyRate),
      
      // Balance
      monthlyBalance: totalIncome - totalExpenses,
      
      // Resumen
      summary: {
        hasOverdue: overdueTenants.length > 0,
        hasUrgentIssues: urgentIncidents > 0,
        isPositiveBalance: totalIncome > totalExpenses,
        needsAttention: overdueTenants.length > 0 || urgentIncidents > 0
      }
    };
    
  } catch (error) {
    console.error('Error en getAdvancedStats:', error);
    
    // Retornar objeto vacío pero válido si hay error
    return {
      overdueTenants: [],
      totalOverdue: 0,
      overdueCount: 0,
      pendingIncidents: 0,
      urgentIncidents: 0,
      resolvedIncidents: 0,
      totalIncidents: 0,
      expensesByCategory: {},
      totalExpenses: 0,
      totalIncome: 0,
      paymentCount: 0,
      paymentMethods: {},
      totalRooms: 0,
      occupiedRooms: 0,
      vacantRooms: 0,
      occupancyRate: 0,
      monthlyBalance: 0,
      summary: {
        hasOverdue: false,
        hasUrgentIssues: false,
        isPositiveBalance: false,
        needsAttention: false
      }
    };
  }
}

// Función auxiliar para probar getAdvancedStats
function testAdvancedStats() {
  const stats = getAdvancedStats();
  console.log('Estadísticas avanzadas:', JSON.stringify(stats, null, 2));
  return stats;
}

// Función para calcular días vencidos
function getDaysOverdue(roomId) {
  const currentDate = new Date();
  const config = getCurrentMonth();
  const dueDay = 5; // Día de vencimiento por defecto
  
  const dueDate = new Date(config.year, config.month - 1, dueDay);
  if (currentDate > dueDate) {
    return Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
}

// Función para generar reporte PDF
function generateMonthlyReportPDF() {
  try {
    const report = getMonthlyReport();
    const stats = getAdvancedStats();
    
    // Aquí puedes integrar una librería de PDF o usar Google Docs
    // Este es un ejemplo básico de estructura
    const reportData = {
      fecha: new Date().toLocaleDateString(),
      resumen: report,
      estadisticasAvanzadas: stats,
      inquilinosMorosos: stats.overdueTenants,
      incidenciasPendientes: stats.pendingIncidents
    };
    
    // Crear documento en Google Docs
    const doc = DocumentApp.create(`Reporte Mensual - ${reportData.fecha}`);
    const body = doc.getBody();
    
    body.appendParagraph('REPORTE MENSUAL DE ALQUILER').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(`Fecha: ${reportData.fecha}`);
    
    // Agregar más contenido al documento...
    
    return doc.getUrl();
  } catch (error) {
    console.error('Error en generateMonthlyReportPDF:', error);
    return null;
  }
}

// Función para búsqueda de inquilinos
function searchTenants(query) {
  try {
    const tenants = getAllTenants();
    
    return tenants.filter(tenant => {
      const searchString = `${tenant.nombre} ${tenant.apellido} ${tenant.dni} ${tenant.telefono}`.toLowerCase();
      return searchString.includes(query.toLowerCase());
    });
  } catch (error) {
    console.error('Error en searchTenants:', error);
    return [];
  }
}

// Funciones de validación
function validateRoomData(roomData) {
  const errors = [];
  
  if (!roomData.id) errors.push('ID de habitación requerido');
  if (!roomData.montoAlquiler || roomData.montoAlquiler < 0) errors.push('Monto de alquiler inválido');
  if (!roomData.montoInternet || roomData.montoInternet < 0) errors.push('Monto de internet inválido');
  if (!['occupied', 'vacant'].includes(roomData.estado)) errors.push('Estado inválido');
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function validateTenantData(tenantData) {
  const errors = [];
  
  if (!tenantData.nombre) errors.push('Nombre requerido');
  if (!tenantData.dni || tenantData.dni.length !== 8) errors.push('DNI debe tener 8 dígitos');
  if (!tenantData.telefono || tenantData.telefono.length < 9) errors.push('Teléfono inválido');
  if (!tenantData.habitacionAsignada) errors.push('Debe asignar una habitación');
  
  // Validar email si se proporciona
  if (tenantData.email && !validateEmail(tenantData.email)) {
    errors.push('Email inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Función para backup automatico
function createBackup() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const backupSS = ss.copy(`Backup - ${new Date().toISOString()}`);
    
    // Mover a carpeta de backups con tu ID real
    const folderId = '1pMamGQnr-cKbovWE8H0ZeVEJa0moN3HH';
    const folder = DriveApp.getFolderById(folderId);
    const file = DriveApp.getFileById(backupSS.getId());
    file.moveTo(folder);
    
    return backupSS.getUrl();
  } catch (error) {
    console.error('Error en createBackup:', error);
    return null;
  }
}

// Función para resolver incidencia
function resolveIncident(incidentId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_INCIDENCIAS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de incidencias no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === incidentId) {
        sheet.getRange(i + 1, 8).setValue('Resuelto');
        sheet.getRange(i + 1, 9).setValue(new Date());
        
        // Crear notificación
        createNotification('Incidencia resuelta', `La incidencia ${incidentId} ha sido resuelta`);
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'Incidencia no encontrada' };
  } catch (error) {
    console.error('Error en resolveIncident:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para limpieza de datos antiguos
function cleanOldData(monthsToKeep = 12) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    
    // Limpiar pagos antiguos
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const paymentsSheet = ss.getSheetByName(SHEET_PAGOS);
    const paymentsData = paymentsSheet.getDataRange().getValues();
    
    for (let i = paymentsData.length - 1; i > 0; i--) {
      if (paymentsData[i][1] instanceof Date && paymentsData[i][1] < cutoffDate) {
        paymentsSheet.deleteRow(i + 1);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error en cleanOldData:', error);
    return false;
  }
}
//Función para resetear pagos mensuales
function resetMonthlyPayments() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_HABITACIONES);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de habitaciones no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Resetear todos los pagos a false
    for (let i = 1; i < data.length; i++) {
      sheet.getRange(i + 1, 6).setValue(false); // AlquilerPagado
      sheet.getRange(i + 1, 7).setValue(false); // InternetPagado
    }
    
    // Actualizar mes actual
    const currentDate = new Date();
    updateCurrentMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
    
    // Crear notificación
    createNotification('Sistema', 'Se han reiniciado los pagos del mes');
    
    return { success: true, message: 'Pagos mensuales reiniciados' };
  } catch (error) {
    console.error('Error en resetMonthlyPayments:', error);
    return { success: false, message: error.toString() };
  }
}
//Función para obtener historial de pagos por habitación:
function getPaymentHistory(roomId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_PAGOS);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const payments = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === roomId) { // HabitacionID está en columna 3
        payments.push({
          id: data[i][0],
          fecha: data[i][1] instanceof Date ? data[i][1].toISOString() : data[i][1],
          tipoPago: data[i][3],
          monto: data[i][4],
          estado: data[i][5],
          metodoPago: data[i][6],
          referencia: data[i][7],
          observaciones: data[i][8]
        });
      }
    }
    
    // Ordenar por fecha descendente
    payments.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    return payments;
  } catch (error) {
    console.error('Error en getPaymentHistory:', error);
    return [];
  }
}
//Función para calcular deuda total:
function calculateTotalDebt() {
  try {
    const rooms = getAllRooms();
    let totalDebt = 0;
    const debtDetails = [];
    
    rooms.forEach(room => {
      if (room.estado === 'occupied') {
        let roomDebt = 0;
        
        if (room.alquilerPagado !== true && room.alquilerPagado !== 'TRUE') {
          roomDebt += parseFloat(room.montoalquiler) || 0;
        }
        
        if (room.internetPagado !== true && room.internetPagado !== 'TRUE') {
          roomDebt += parseFloat(room.montointernet) || 0;
        }
        
        if (roomDebt > 0) {
          debtDetails.push({
            habitacion: room.id,
            inquilino: room.nombre,
            deuda: roomDebt
          });
          totalDebt += roomDebt;
        }
      }
    });
    
    return {
      totalDebt: totalDebt,
      details: debtDetails
    };
  } catch (error) {
    console.error('Error en calculateTotalDebt:', error);
    return { totalDebt: 0, details: [] };
  }
}
// Función para exportar datos a CSV
function exportToCSV(sheetName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    let csv = '';
    
    data.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    return csv;
  } catch (error) {
    console.error('Error en exportToCSV:', error);
    return null;
  }
}

// Agregar a Code.gs para configurar un trigger automático
function setupTriggers() {
  // Crear trigger para limpieza mensual
  ScriptApp.newTrigger('cleanOldData')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
  
  // Crear trigger para backup semanal
  ScriptApp.newTrigger('createBackup')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
}

// Añadir a Code.gs
function initializeImprovements() {
  // Verificar que todas las hojas necesarias existan
  const requiredSheets = [
    SHEET_INCIDENCIAS,
    SHEET_NOTIFICACIONES,
    SHEET_VOUCHERS
  ];
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  requiredSheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      initializeSheets();
    }
  });
  
  // Configurar triggers
  setupTriggers();
  
  return 'Mejoras inicializadas correctamente';
}
// Función mejorada para manejo de errores
function logError(functionName, error) {
  const errorInfo = {
    function: functionName,
    error: error.toString(),
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
  
  console.error('Error en', functionName, ':', errorInfo);
  
  // Opcional: guardar errores en una hoja de logs
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName('Logs');
    if (!logSheet) {
      logSheet = ss.insertSheet('Logs');
      logSheet.appendRow(['Timestamp', 'Function', 'Error', 'Stack']);
    }
    logSheet.appendRow([errorInfo.timestamp, errorInfo.function, errorInfo.error, errorInfo.stack]);
  } catch (logError) {
    console.error('Error al registrar el log:', logError);
  }
}
// Funciones de validación en el cliente
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    for (let input of inputs) {
        if (!input.value.trim()) {
            showNotification(`El campo ${input.previousElementSibling.textContent} es requerido`, 'error');
            input.focus();
            return false;
        }
    }
    
    // Validaciones específicas
    if (formId === 'tenantForm') {
        const dni = document.getElementById('tenantDni').value;
        if (dni.length !== 8 || !/^\d+$/.test(dni)) {
            showNotification('El DNI debe tener 8 dígitos numéricos', 'error');
            return false;
        }
        
        const email = document.getElementById('tenantEmail').value;
        if (email && !validateEmail(email)) {
            showNotification('El formato del email no es válido', 'error');
            return false;
        }
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Agregar confirmación en acciones importantes
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Modificar saveTenant
function saveTenant() {
    if (!validateForm('tenantForm')) return;
    
    const tenantData = {
        nombre: document.getElementById('tenantName').value.trim(),
        dni: document.getElementById('tenantDni').value.trim(),
        telefono: document.getElementById('tenantPhone').value.trim(),
        email: document.getElementById('tenantEmail').value.trim(),
        habitacionAsignada: document.getElementById('tenantRoom').value,
        fechaIngreso: new Date().toISOString().split('T')[0]
    };
    
    showLoading();
    google.script.run
        .withSuccessHandler(function(result) {
            if (result.success) {
                closeModal('tenantModal');
                loadTenants();
                showNotification('Inquilino registrado exitosamente');
            } else {
                showNotification('Error: ' + result.message, 'error');
            }
            hideLoading();
        })
        .withFailureHandler(handleError)
        .addTenant(tenantData);
}

// Modificar saveRoom
function saveRoom() {
    if (!validateForm('roomForm')) return;
    
    const roomData = {
        id: document.getElementById('roomId').value,
        nombre: document.getElementById('roomTenant').value.trim(),
        celular: document.getElementById('roomPhone').value.trim(),
        montoAlquiler: parseFloat(document.getElementById('roomRent').value) || 0,
        montoInternet: parseFloat(document.getElementById('roomInternet').value) || 0,
        estado: document.getElementById('roomStatus').value,
        alquilerPagado: false,
        internetPagado: false,
        piso: '1',
        ubicacion: 'centro',
        observaciones: ''
    };
    
    showLoading();
    google.script.run
        .withSuccessHandler(function(result) {
            if (result.success) {
                closeModal('roomModal');
                loadRooms();
                showNotification('Habitación actualizada exitosamente');
            } else {
                showNotification('Error: ' + result.message, 'error');
            }
            hideLoading();
        })
        .withFailureHandler(handleError)
        .updateRoomData(roomData);
}

// Función para generar voucher de pago en PDF - Optimizado para una página
function generatePaymentVoucher(paymentData) {
  try {
    // Crear un nuevo documento de Google Docs
    const doc = DocumentApp.create(`Voucher_${paymentData.habitacionId}_${new Date().getTime()}`);
    const body = doc.getBody();
    
    // Configuración para una sola página
    body.setMarginTop(15);
    body.setMarginBottom(15);
    body.setMarginLeft(25);
    body.setMarginRight(25);
    
    // Paleta de colores profesionales
    const colors = {
      primary: '#1a237e',
      secondary: '#37474f',
      accent: '#0277bd',
      success: '#2e7d32',
      light: '#f5f5f5',
      dark: '#212121',
      text: '#212121',
      textLight: '#616161',
      border: '#e0e0e0'
    };
    
    // Estilos profesionales
    const titleStyle = {
      [DocumentApp.Attribute.HORIZONTAL_ALIGNMENT]: DocumentApp.HorizontalAlignment.CENTER,
      [DocumentApp.Attribute.FONT_SIZE]: 18,
      [DocumentApp.Attribute.BOLD]: true,
      [DocumentApp.Attribute.FONT_FAMILY]: 'Arial',
      [DocumentApp.Attribute.FOREGROUND_COLOR]: colors.primary,
      [DocumentApp.Attribute.SPACING_AFTER]: 4
    };

    const subtitleStyle = {
      [DocumentApp.Attribute.HORIZONTAL_ALIGNMENT]: DocumentApp.HorizontalAlignment.CENTER,
      [DocumentApp.Attribute.FONT_SIZE]: 11,
      [DocumentApp.Attribute.FONT_FAMILY]: 'Arial',
      [DocumentApp.Attribute.FOREGROUND_COLOR]: colors.textLight,
      [DocumentApp.Attribute.SPACING_AFTER]: 10
    };

    const sectionStyle = {
      [DocumentApp.Attribute.FONT_SIZE]: 13,
      [DocumentApp.Attribute.BOLD]: true,
      [DocumentApp.Attribute.FONT_FAMILY]: 'Arial',
      [DocumentApp.Attribute.FOREGROUND_COLOR]: colors.secondary,
      [DocumentApp.Attribute.SPACING_BEFORE]: 12,
      [DocumentApp.Attribute.SPACING_AFTER]: 8
    };

    const labelStyle = {
      [DocumentApp.Attribute.FONT_SIZE]: 11,
      [DocumentApp.Attribute.BOLD]: true,
      [DocumentApp.Attribute.FONT_FAMILY]: 'Arial',
      [DocumentApp.Attribute.FOREGROUND_COLOR]: colors.secondary
    };

    const valueStyle = {
      [DocumentApp.Attribute.FONT_SIZE]: 11,
      [DocumentApp.Attribute.FONT_FAMILY]: 'Arial',
      [DocumentApp.Attribute.FOREGROUND_COLOR]: colors.text
    };

    const highlightStyle = {
      [DocumentApp.Attribute.FONT_SIZE]: 15,
      [DocumentApp.Attribute.BOLD]: true,
      [DocumentApp.Attribute.FONT_FAMILY]: 'Arial',
      [DocumentApp.Attribute.FOREGROUND_COLOR]: colors.success
    };

    // ENCABEZADO INSTITUCIONAL
    const headerTable = body.appendTable();
    headerTable.setBorderWidth(0);
    const headerRow = headerTable.appendTableRow();
    
    // Columna de título principal
    const titleCell = headerRow.appendTableCell();
    titleCell.setWidth(350);
    const title = titleCell.appendParagraph('COMPROBANTE DE PAGO');
    title.setAttributes(titleStyle);
    const subtitle = titleCell.appendParagraph('Sistema de Gestión de Alquiler de Habitaciones');
    subtitle.setAttributes(subtitleStyle);
    
    // Columna de número de comprobante
    const voucherCell = headerRow.appendTableCell();
    voucherCell.setWidth(150);
    voucherCell.setBackgroundColor(colors.light);
    voucherCell.setPaddingTop(8);
    voucherCell.setPaddingBottom(8);
    voucherCell.setPaddingLeft(10);
    voucherCell.setPaddingRight(10);
    
    const voucherLabel = voucherCell.appendParagraph('COMPROBANTE No.');
    voucherLabel.setFontSize(9);
    voucherLabel.setFontFamily('Arial');
    voucherLabel.setBold(true);
    voucherLabel.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    const voucherNum = voucherCell.appendParagraph(paymentData.voucherId || 'V' + new Date().getTime());
    voucherNum.setFontSize(12);
    voucherNum.setBold(true);
    voucherNum.setForegroundColor(colors.primary);
    voucherNum.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    // Línea divisoria profesional
    body.appendParagraph('').setSpacingAfter(8);
    const dividerPara = body.appendParagraph('_'.repeat(80));
    dividerPara.setFontSize(8);
    dividerPara.setForegroundColor(colors.border);
    dividerPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    dividerPara.setSpacingAfter(10);
    
    // INFORMACIÓN DE FECHA Y HORA
    const dateTimeTable = body.appendTable();
    dateTimeTable.setBorderWidth(0);
    const dateTimeRow = dateTimeTable.appendTableRow();
    
    const dateCell = dateTimeRow.appendTableCell();
    dateCell.setWidth(250);
    const dateLabel = dateCell.appendParagraph('FECHA DE EMISIÓN:');
    dateLabel.setFontSize(10);
    dateLabel.setBold(true);
    dateLabel.setFontFamily('Arial');
    const dateValue = dateCell.appendParagraph(new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }));
    dateValue.setFontSize(11);
    dateValue.setFontFamily('Arial');
    
    const timeCell = dateTimeRow.appendTableCell();
    timeCell.setWidth(250);
    const timeLabel = timeCell.appendParagraph('HORA:');
    timeLabel.setFontSize(10);
    timeLabel.setBold(true);
    timeLabel.setFontFamily('Arial');
    const timeValue = timeCell.appendParagraph(new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    timeValue.setFontSize(11);
    timeValue.setFontFamily('Arial');
    
    // SECCIÓN: DETALLES DEL PAGO
    const paymentHeader = body.appendParagraph('DETALLES DEL PAGO');
    paymentHeader.setAttributes(sectionStyle);
    paymentHeader.setSpacingBefore(15);
    
    // Tabla de detalles del pago
    const paymentTable = body.appendTable();
    paymentTable.setBorderWidth(1);
    paymentTable.setBorderColor(colors.border);
    
    function addDetailRow(table, label, value, isHighlight = false) {
      const row = table.appendTableRow();
      
      // Celda de etiqueta
      const labelCell = row.appendTableCell();
      labelCell.setWidth(200);
      labelCell.setPaddingTop(8);
      labelCell.setPaddingBottom(8);
      labelCell.setPaddingLeft(12);
      labelCell.setBackgroundColor('#fafafa');
      
      const labelText = labelCell.appendParagraph(label);
      labelText.setAttributes(labelStyle);
      
      // Celda de valor
      const valueCell = row.appendTableCell();
      valueCell.setWidth(300);
      valueCell.setPaddingTop(8);
      valueCell.setPaddingBottom(8);
      valueCell.setPaddingLeft(12);
      
      const valuePara = valueCell.appendParagraph(value);
      if (isHighlight) {
        valuePara.setAttributes(highlightStyle);
        valueCell.setBackgroundColor('#e8f5e9');
      } else {
        valuePara.setAttributes(valueStyle);
      }
    }
    
    // Agregar filas de información
    addDetailRow(paymentTable, 'CÓDIGO DE HABITACIÓN:', paymentData.habitacionId);
    addDetailRow(paymentTable, 'NOMBRE DEL INQUILINO:', paymentData.inquilino || 'No especificado');
    addDetailRow(paymentTable, 'CONCEPTO DE PAGO:', paymentData.concepto);
    addDetailRow(paymentTable, 'MÉTODO DE PAGO:', paymentData.metodoPago);
    if (paymentData.voucher) {
      addDetailRow(paymentTable, 'NÚMERO DE REFERENCIA:', paymentData.voucher);
    }
    
    body.appendParagraph('').setSpacingAfter(10);
    
    // SECCIÓN: IMPORTE TOTAL
    const totalHeader = body.appendParagraph('RESUMEN DEL PAGO');
    totalHeader.setAttributes(sectionStyle);
    
    const totalTable = body.appendTable();
    totalTable.setBorderWidth(2);
    totalTable.setBorderColor(colors.success);
    addDetailRow(totalTable, 'IMPORTE TOTAL PAGADO:', `S/ ${Number(paymentData.monto).toFixed(2)}`, true);
    
    // INFORMACIÓN ADICIONAL DE LA HABITACIÓN
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const roomsSheet = ss.getSheetByName(SHEET_HABITACIONES);
    const data = roomsSheet.getDataRange().getValues();
    
    let roomInfo = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === paymentData.habitacionId) {
        roomInfo = {
          nombre: data[i][1],
          celular: data[i][2],
          montoAlquiler: data[i][3],
          montoInternet: data[i][4]
        };
        break;
      }
    }
    
    if (roomInfo) {
      body.appendParagraph('').setSpacingAfter(10);
      const referenceHeader = body.appendParagraph('INFORMACIÓN DE REFERENCIA');
      referenceHeader.setAttributes(sectionStyle);
      
      const referenceTable = body.appendTable();
      referenceTable.setBorderWidth(1);
      referenceTable.setBorderColor(colors.border);
      
      addDetailRow(referenceTable, 'TELÉFONO DE CONTACTO:', roomInfo.celular);
      addDetailRow(referenceTable, 'TARIFA MENSUAL DE ALQUILER:', `S/ ${Number(roomInfo.montoAlquiler).toFixed(2)}`);
      addDetailRow(referenceTable, 'TARIFA DE SERVICIO DE INTERNET:', `S/ ${Number(roomInfo.montoInternet).toFixed(2)}`);
    }
    
    // ESPACIO ANTES DEL PIE DE PÁGINA
    body.appendParagraph('').setSpacingAfter(20);
    
    // PIE DE PÁGINA INSTITUCIONAL
    const footerDivider = body.appendParagraph('_'.repeat(80));
    footerDivider.setFontSize(8);
    footerDivider.setForegroundColor(colors.border);
    footerDivider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    footerDivider.setSpacingAfter(10);
    
    const footerTable = body.appendTable();
    footerTable.setBorderWidth(0);
    const footerRow = footerTable.appendTableRow();
    const footerCell = footerRow.appendTableCell();
    footerCell.setPaddingTop(15);
    footerCell.setPaddingBottom(15);
    
    const footerTitle = footerCell.appendParagraph('INFORMACIÓN IMPORTANTE');
    footerTitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    footerTitle.setFontSize(11);
    footerTitle.setBold(true);
    footerTitle.setFontFamily('Arial');
    footerTitle.setForegroundColor(colors.secondary);
    footerTitle.setSpacingAfter(8);
    
    const footerText = footerCell.appendParagraph('Este documento constituye un comprobante oficial de pago.');
    footerText.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    footerText.setFontSize(10);
    footerText.setFontFamily('Arial');
    footerText.setForegroundColor(colors.textLight);
    
    const footerInstruction = footerCell.appendParagraph('Conserve este documento para futuras referencias y aclaraciones.');
    footerInstruction.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    footerInstruction.setFontSize(10);
    footerInstruction.setFontFamily('Arial');
    footerInstruction.setForegroundColor(colors.textLight);
    footerInstruction.setSpacingAfter(10);
    
    // Código de verificación al final
    const verificationCode = body.appendParagraph(`Código de Verificación: ${paymentData.voucherId || 'V' + new Date().getTime()}`);
    verificationCode.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    verificationCode.setFontFamily('Courier New');
    verificationCode.setFontSize(9);
    verificationCode.setForegroundColor(colors.textLight);
    verificationCode.setSpacingBefore(10);
    
    // Línea final
    const finalLine = body.appendParagraph('_'.repeat(80));
    finalLine.setFontSize(8);
    finalLine.setForegroundColor(colors.border);
    finalLine.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    // Guardar y cerrar el documento
    doc.saveAndClose();
    
    // Convertir a PDF
    const docId = doc.getId();
    const pdf = DriveApp.getFileById(docId).getAs('application/pdf');
    pdf.setName(`Comprobante_${paymentData.habitacionId}_${new Date().getTime()}.pdf`);
    
    // Gestión de carpetas
    const folderId = '1pMamGQnr-cKbovWE8H0ZeVEJa0moN3HH';
    let vouchersFolder;
    
    try {
      const mainFolder = DriveApp.getFolderById(folderId);
      const folders = mainFolder.getFoldersByName('Comprobantes');
      
      if (folders.hasNext()) {
        vouchersFolder = folders.next();
      } else {
        vouchersFolder = mainFolder.createFolder('Comprobantes');
      }
    } catch (e) {
      const folders = DriveApp.getFoldersByName('Comprobantes');
      if (folders.hasNext()) {
        vouchersFolder = folders.next();
      } else {
        vouchersFolder = DriveApp.createFolder('Comprobantes');
      }
    }
    
    const pdfFile = vouchersFolder.createFile(pdf);
    DriveApp.getFileById(docId).setTrashed(true);
    
    // Registrar en sistema de vouchers
    const vouchersSheet = ss.getSheetByName(SHEET_VOUCHERS);
    const voucherId = paymentData.voucherId || 'V' + new Date().getTime();
    
    if (vouchersSheet) {
      vouchersSheet.appendRow([
        voucherId,
        paymentData.habitacionId,
        new Date(),
        paymentData.voucher || '',
        paymentData.monto,
        'Generado',
        pdfFile.getUrl()
      ]);
    }
    
    return {
      success: true,
      url: pdfFile.getUrl(),
      voucherId: voucherId
    };
    
  } catch (error) {
    console.error('Error generando comprobante de pago:', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}


// Función mejorada para registrar pago con voucher
function registerPaymentWithVoucher(paymentData) {
  try {
    // Primero registrar el pago
    const paymentResult = registerPayment(paymentData);
    
    if (paymentResult.success) {
      // Luego generar el voucher
      paymentData.voucherId = paymentResult.paymentId;
      const voucherResult = generatePaymentVoucher(paymentData);
      
      return {
        success: true,
        paymentId: paymentResult.paymentId,
        voucherUrl: voucherResult.success ? voucherResult.url : null
      };
    }
    
    return paymentResult;
  } catch (error) {
    console.error('Error en registerPaymentWithVoucher:', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}
// Función para obtener todos los vouchers
function getVouchers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_VOUCHERS);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const vouchers = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      vouchers.push({
        id: data[i][0],
        habitacionID: data[i][1],
        fecha: data[i][2] instanceof Date ? data[i][2].toISOString() : data[i][2],
        numeroVoucher: data[i][3],
        monto: data[i][4],
        estado: data[i][5],
        url: data[i][6]
      });
    }
    
    return vouchers;
  } catch (error) {
    console.error('Error en getVouchers:', error);
    return [];
  }
}
function initializeVouchersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_VOUCHERS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_VOUCHERS);
    sheet.appendRow(['ID', 'HabitacionID', 'Fecha', 'NumeroVoucher', 'Monto', 'Estado', 'URL']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  
  return 'Hoja de vouchers inicializada';
}

// Función para obtener gasto por ID
function getExpenseById(expenseId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === expenseId) {
        return {
          id: data[i][0],
          fecha: data[i][1] instanceof Date ? data[i][1].toISOString() : data[i][1],
          concepto: data[i][2],
          categoria: data[i][3],
          monto: data[i][4],
          habitacionAsociada: data[i][5],
          comprobante: data[i][6],
          observaciones: data[i][7]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error en getExpenseById:', error);
    return null;
  }
}

// Función para actualizar gasto
function updateExpense(expenseData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de gastos no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === expenseData.id) {
        sheet.getRange(i + 1, 1, 1, 8).setValues([[
          expenseData.id,
          new Date(expenseData.fecha),
          expenseData.concepto,
          expenseData.categoria,
          expenseData.monto,
          expenseData.habitacionArea || '',
          expenseData.comprobante || '',
          expenseData.observaciones || ''
        ]]);
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'Gasto no encontrado' };
  } catch (error) {
    console.error('Error en updateExpense:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para eliminar gasto
function deleteExpense(expenseId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_GASTOS);
    
    if (!sheet) {
      return { success: false, message: 'Hoja de gastos no encontrada' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === expenseId) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Gasto no encontrado' };
  } catch (error) {
    console.error('Error en deleteExpense:', error);
    return { success: false, message: error.toString() };
  }
}

// Función para obtener datos de tendencias (últimos 6 meses)
// Función mejorada para obtener datos de tendencias reales
function getTrendData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const paymentsSheet = ss.getSheetByName(SHEET_PAGOS);
    const expensesSheet = ss.getSheetByName(SHEET_GASTOS);
    
    if (!paymentsSheet || !expensesSheet) {
      console.log('Hojas de pagos o gastos no encontradas');
      return [];
    }
    
    const currentDate = new Date();
    const trendData = [];
    
    // Obtener datos de los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentDate.getMonth() - i;
      const targetYear = currentDate.getFullYear();
      
      // Ajustar año si el mes es negativo
      let month = targetMonth;
      let year = targetYear;
      
      if (targetMonth < 0) {
        month = 12 + targetMonth + 1;
        year = targetYear - 1;
      } else {
        month = targetMonth + 1;
      }
      
      // Calcular ingresos del mes
      let monthIncome = 0;
      const paymentsData = paymentsSheet.getDataRange().getValues();
      
      for (let j = 1; j < paymentsData.length; j++) {
        const fecha = paymentsData[j][1];
        if (fecha instanceof Date) {
          const paymentMonth = fecha.getMonth() + 1;
          const paymentYear = fecha.getFullYear();
          
          if (paymentMonth === month && paymentYear === year) {
            const monto = parseFloat(paymentsData[j][4] || 0);
            if (!isNaN(monto)) {
              monthIncome += monto;
            }
          }
        }
      }
      
      // Calcular gastos del mes
      let monthExpenses = 0;
      const expensesData = expensesSheet.getDataRange().getValues();
      
      for (let j = 1; j < expensesData.length; j++) {
        const fecha = expensesData[j][1];
        if (fecha instanceof Date) {
          const expenseMonth = fecha.getMonth() + 1;
          const expenseYear = fecha.getFullYear();
          
          if (expenseMonth === month && expenseYear === year) {
            const monto = parseFloat(expensesData[j][4] || 0);
            if (!isNaN(monto)) {
              monthExpenses += monto;
            }
          }
        }
      }
      
      trendData.push({
        month: month,
        year: year,
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses
      });
    }
    
    console.log('Datos de tendencia generados:', trendData);
    return trendData;
    
  } catch (error) {
    console.error('Error en getTrendData:', error);
    return [];
  }
}

// Función adicional para obtener resumen de vencimientos
function getDuePaymentsSummary() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const roomsSheet = ss.getSheetByName(SHEET_HABITACIONES);
    
    if (!roomsSheet) {
      return { 
        totalDue: 0, 
        roomsWithDebt: 0, 
        details: [] 
      };
    }
    
    const data = roomsSheet.getDataRange().getValues();
    let totalDue = 0;
    const details = [];
    
    for (let i = 1; i < data.length; i++) {
      const room = {
        id: data[i][0],
        nombre: data[i][1],
        estado: data[i][9],
        montoAlquiler: parseFloat(data[i][3] || 0),
        montoInternet: parseFloat(data[i][4] || 0),
        alquilerPagado: data[i][5],
        internetPagado: data[i][6]
      };
      
      // Solo habitaciones ocupadas
      if (room.estado === 'occupied') {
        let deuda = 0;
        
        // Verificar alquiler
        if (room.alquilerPagado === false || 
            room.alquilerPagado === 'FALSE' || 
            room.alquilerPagado === '' || 
            room.alquilerPagado === null) {
          deuda += room.montoAlquiler;
        }
        
        // Verificar internet
        if (room.internetPagado === false || 
            room.internetPagado === 'FALSE' || 
            room.internetPagado === '' || 
            room.internetPagado === null) {
          deuda += room.montoInternet;
        }
        
        if (deuda > 0) {
          totalDue += deuda;
          details.push({
            habitacion: room.id,
            inquilino: room.nombre,
            deuda: deuda
          });
        }
      }
    }
    
    return {
      totalDue: totalDue,
      roomsWithDebt: details.length,
      details: details
    };
    
  } catch (error) {
    console.error('Error en getDuePaymentsSummary:', error);
    return { 
      totalDue: 0, 
      roomsWithDebt: 0, 
      details: [] 
    };
  }
}

// Marcar notificación como leída
function markNotificationAsRead(notificationId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NOTIFICACIONES);
    
    if (!sheet) return { success: false };
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === notificationId) {
        sheet.getRange(i + 1, 6).setValue('Leído');
        return { success: true };
      }
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error en markNotificationAsRead:', error);
    return { success: false };
  }
}

// Marcar todas las notificaciones como leídas
function markAllNotificationsAsRead() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NOTIFICACIONES);
    
    if (!sheet) return { success: false };
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === 'Pendiente') {
        sheet.getRange(i + 1, 6).setValue('Leído');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error en markAllNotificationsAsRead:', error);
    return { success: false };
  }
}

// Limpiar todas las notificaciones
function clearAllNotifications() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NOTIFICACIONES);
    
    if (!sheet) return { success: false };
    
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error en clearAllNotifications:', error);
    return { success: false };
  }
}

function testNotifications() {
  const result = initializeSheets();
  console.log(result);
  
  // Crear notificación de prueba
  createNotification('Sistema', 'Notificación de prueba');
  
  // Obtener notificaciones
  const notifications = getPendingNotifications();
  console.log('Notificaciones:', notifications);
  
  return notifications;
}