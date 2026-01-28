// Punto de entrada principal de la API
// Este archivo maneja las peticiones HTTP GET y POST

/**
 * Maneja peticiones GET
 * Principalmente usado para queries con parámetros en URL
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  try {
    const params = e.parameter;

    // Construir request desde query params
    const request: ApiRequest = {
      action: (params.action as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'GET',
      endpoint: params.endpoint || '/',
      data: params,
    };

    const response = handleRequest(request);

    // Agregar headers CORS
    return response;
  } catch (error) {
    console.error('Error en doGet:', error);
    return errorResponse(String(error));
  }
}

/**
 * Maneja peticiones POST
 * Usado para crear, actualizar y eliminar recursos
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    // Parsear body JSON
    const body = JSON.parse(e.postData?.contents || '{}');

    const request: ApiRequest = {
      action: body.action || 'POST',
      endpoint: body.endpoint || '/',
      data: body.data || {},
    };

    return handleRequest(request);
  } catch (error) {
    console.error('Error en doPost:', error);
    return errorResponse(String(error));
  }
}

/**
 * Función para inicializar todas las hojas necesarias
 */
function initializeDatabase(): string {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // Crear cada hoja si no existe
    Object.entries(CONFIG.SHEETS).forEach(([key, sheetName]) => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        const headers = CONFIG.HEADERS[key as keyof typeof CONFIG.HEADERS];
        if (headers) {
          sheet.appendRow(headers);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        }
        console.log(`Hoja creada: ${sheetName}`);
      }
    });

    return 'Base de datos inicializada correctamente';
  } catch (error) {
    console.error('Error al inicializar:', error);
    return `Error: ${error}`;
  }
}

/**
 * Función para crear datos de prueba
 */
function createTestData(): string {
  try {
    // Crear ciudades de prueba
    const ciudadPuno = ciudadRepository.create<Ciudad>({
      nombre: 'Puno',
      departamento: 'Puno',
      activo: true,
    });

    const ciudadJuli = ciudadRepository.create<Ciudad>({
      nombre: 'Juli',
      departamento: 'Puno',
      activo: true,
    });

    // Crear edificios
    const edificioPuno = edificioRepository.create<Edificio>({
      ciudadId: ciudadPuno.id,
      nombre: 'Edificio Central Puno',
      direccion: 'Jr. Lima 123, Puno',
      totalPisos: 3,
      activo: true,
    });

    // Crear pisos
    const pisoRepo = new BaseRepository(CONFIG.SHEETS.PISOS, CONFIG.HEADERS.PISOS);
    const piso1 = pisoRepo.create<Piso>({
      edificioId: edificioPuno.id,
      numero: 1,
      descripcion: 'Primer piso',
    });

    const piso2 = pisoRepo.create<Piso>({
      edificioId: edificioPuno.id,
      numero: 2,
      descripcion: 'Segundo piso',
    });

    // Crear habitaciones
    const hab1 = habitacionRepository.create<Habitacion>({
      pisoId: piso1.id,
      codigo: 'A1',
      ubicacion: 'izquierda',
      montoAlquiler: 150,
      montoInternet: 20,
      montoServicios: 0,
      estado: 'occupied',
      activo: true,
    });

    const hab2 = habitacionRepository.create<Habitacion>({
      pisoId: piso1.id,
      codigo: 'A2',
      ubicacion: 'derecha',
      montoAlquiler: 150,
      montoInternet: 20,
      montoServicios: 0,
      estado: 'vacant',
      activo: true,
    });

    // Crear inquilino
    const inquilino = inquilinoRepository.create<Inquilino>({
      habitacionId: hab1.id,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      telefono: '987654321',
      email: 'juan@email.com',
      fechaIngreso: new Date().toISOString(),
      estado: 'activo',
    });

    // Crear pago de prueba
    const now = new Date();
    pagoRepository.create<Pago>({
      inquilinoId: inquilino.id,
      habitacionId: hab1.id,
      mes: now.getMonth() + 1,
      anio: now.getFullYear(),
      concepto: 'alquiler',
      monto: 150,
      metodoPago: 'efectivo',
      estado: 'pagado',
    });

    return 'Datos de prueba creados correctamente';
  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
    return `Error: ${error}`;
  }
}

/**
 * Menú personalizado en Google Sheets
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Sistema Alquiler')
    .addItem('Inicializar Base de Datos', 'initializeDatabase')
    .addItem('Crear Datos de Prueba', 'createTestData')
    .addSeparator()
    .addItem('Abrir Panel Web', 'openWebApp')
    .addToUi();
}

/**
 * Abre la aplicación web en una nueva pestaña
 */
function openWebApp(): void {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    `<script>window.open("${url}", "_blank"); google.script.host.close();</script>`
  )
    .setWidth(200)
    .setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo...');
}
