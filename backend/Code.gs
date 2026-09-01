// =====================================================
// SISTEMA DE ALQUILER - API REST
// Google Apps Script Backend
// =====================================================

// =====================================================
// CONFIGURACIÓN
// =====================================================
const CONFIG = {
  // Version del backend, usar en /ping para verificar que el deploy es el actual
  VERSION: '2026.08.31',

  // IMPORTANTE: Cambia este ID por el de tu Google Spreadsheet
  SPREADSHEET_ID: '1ugfqN_1yjbIjR_IB-oUR66gX0lbQemGpu0-cF39-m6E',

  // Carpeta raiz de Drive donde se archivan DNI, contratos y vouchers.
  // Todo cuelga de una subcarpeta 'Inquilinos' para no mezclarse con lo que ya haya ahi.
  DRIVE_ROOT_FOLDER_ID: '1pMamGQnr-cKbovWE8H0ZeVEJa0moN3HH',
  DRIVE_BASE_FOLDER_NAME: 'Inquilinos',

  // Destinatarios del resumen semanal de cobranza
  ADMIN_EMAILS: ['canazach12@gmail.com', 'canazaarturo@gmail.com'],

  SHEETS: {
    CIUDADES: 'Ciudades',
    EDIFICIOS: 'Edificios',
    PISOS: 'Pisos',
    HABITACIONES: 'Habitaciones',
    INQUILINOS: 'Inquilinos',
    PAGOS: 'Pagos',
    GASTOS: 'Gastos',
    GASTOS_FIJOS: 'GastosFijos',
    CONFIGURACION: 'Configuracion'
  },

  HEADERS: {
    CIUDADES: ['ID', 'Nombre', 'Departamento', 'Activo', 'CreatedAt', 'UpdatedAt'],
    EDIFICIOS: ['ID', 'CiudadId', 'Nombre', 'Descripcion', 'Direccion', 'TotalPisos', 'Activo'],
    PISOS: ['ID', 'EdificioId', 'Numero', 'Descripcion'],
    HABITACIONES: ['ID', 'PisoId', 'Codigo', 'Ubicacion', 'MontoAlquiler', 'MontoInternet', 'MontoServicios', 'Estado', 'Activo', 'Observaciones'],
    // Las columnas nuevas van SIEMPRE al final: la auto-migracion sobreescribe la fila 1
    // y correr una columna existente desalinearia todos los datos.
    INQUILINOS: ['ID', 'HabitacionId', 'Nombre', 'Apellido', 'DNI', 'Telefono', 'Email', 'FechaIngreso', 'FechaSalida', 'Estado', 'ContactoEmergencia', 'TelefonoEmergencia', 'Observaciones', 'Garantia', 'LlaveHabitacion', 'LlavePuertaCalle', 'DniFotoFrenteUrl', 'DniFotoReversoUrl', 'ContratoPdfUrl'],
    PAGOS: ['ID', 'InquilinoId', 'HabitacionId', 'Fecha', 'Mes', 'Anio', 'Concepto', 'Monto', 'MetodoPago', 'Referencia', 'Estado', 'Observaciones', 'VoucherPdfUrl'],
    GASTOS: ['ID', 'EdificioId', 'HabitacionId', 'Fecha', 'Concepto', 'Categoria', 'Monto', 'ComprobanteUrl', 'Observaciones'],
    GASTOS_FIJOS: ['ID', 'EdificioId', 'Tipo', 'Descripcion', 'Monto', 'DiaVencimiento', 'Activo']
  }
};

// =====================================================
// UTILIDADES
// =====================================================
const ID_PREFIXES = {
  Ciudades: 'C',
  Edificios: 'E',
  Pisos: 'P',
  Habitaciones: 'H',
  Inquilinos: 'I',
  Pagos: 'PG',
  Gastos: 'G',
  GastosFijos: 'GF',
  Configuracion: 'CF'
};

/**
 * Genera IDs secuenciales cortos: C001, E001, H001, PG001, etc.
 * Busca el último ID usado en la hoja y genera el siguiente.
 * Escala automáticamente: 001-999, luego 0001-9999, etc.
 */
function generateId(sheetName) {
  const prefix = ID_PREFIXES[sheetName] || 'X';
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet || sheet.getLastRow() <= 1) {
    return prefix + '001';
  }

  // Obtener todos los IDs existentes
  const lastRow = sheet.getLastRow();
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();

  // Encontrar el número más alto
  let maxNum = 0;
  ids.forEach(id => {
    if (id && typeof id === 'string' && id.startsWith(prefix)) {
      const numPart = parseInt(id.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  // Generar el siguiente ID con padding dinámico
  const nextNum = maxNum + 1;
  const padding = nextNum < 1000 ? 3 : (nextNum < 10000 ? 4 : 5);
  return prefix + nextNum.toString().padStart(padding, '0');
}

/**
 * Extrae anio/mes/dia de una fecha guardada, SIN pasar por la zona horaria local.
 *
 * Las fechas se escriben como medianoche UTC: el frontend manda 'YYYY-MM-DD' y
 * new Date('2026-06-01') lo interpreta como 2026-06-01T00:00:00Z. Como el script
 * corre en UTC-5, leer eso con getDate() devuelve 31 de mayo: un dia menos.
 * Por eso el dia se lee del propio string ISO, que es la fuente sin ambiguedad.
 */
function partesDeFecha(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
  }

  const d = new Date(valor);
  if (isNaN(d.getTime())) return null;
  return { anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() };
}

/** Dia del mes de una fecha guardada, o null si no se puede determinar. */
function diaDeFecha(valor) {
  const p = partesDeFecha(valor);
  return p ? p.dia : null;
}

/** true si la fecha guardada cae en el mes/anio indicados. */
function fechaEnPeriodo(valor, mes, anio) {
  const p = partesDeFecha(valor);
  return !!p && p.mes == mes && p.anio == anio;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse(data, message) {
  return jsonResponse({ success: true, data: data, message: message });
}

function errorResponse(error) {
  return jsonResponse({ success: false, error: error });
}

// =====================================================
// CLASE BASE REPOSITORY
// =====================================================
class BaseRepository {
  constructor(sheetName, headers) {
    this.spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    this.sheetName = sheetName;
    this.headers = headers;
  }

  getSheet() {
    let sheet = this.spreadsheet.getSheetByName(this.sheetName);
    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(this.sheetName);
      sheet.appendRow(this.headers);
      sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
      return sheet;
    }

    // Auto-migracion: si los headers actuales no coinciden con el config,
    // sobreescribirlos para agregar columnas nuevas (Garantia, LlaveHabitacion, etc.)
    const lastCol = Math.max(sheet.getLastColumn(), this.headers.length);
    const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    let needsMigration = false;
    for (let i = 0; i < this.headers.length; i++) {
      if (currentHeaders[i] !== this.headers[i]) {
        needsMigration = true;
        break;
      }
    }
    if (needsMigration) {
      // Asegurar que la sheet tiene suficientes columnas
      const maxCols = sheet.getMaxColumns();
      if (maxCols < this.headers.length) {
        sheet.insertColumnsAfter(maxCols, this.headers.length - maxCols);
      }
      sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
      sheet.getRange(1, 1, 1, this.headers.length).setFontWeight('bold');
    }
    return sheet;
  }

  getAllData() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    return sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
  }

  // Convierte header a camelCase, manejando acrónimos como DNI, ID
  headerToKey(header) {
    // Si es todo mayúsculas (acrónimo como ID, DNI), convertir todo a minúsculas
    if (header === header.toUpperCase()) {
      return header.toLowerCase();
    }
    // PascalCase a camelCase estándar: "CiudadId" -> "ciudadId"
    return header.charAt(0).toLowerCase() + header.slice(1);
  }

  rowToObject(row) {
    const obj = {};
    this.headers.forEach((header, index) => {
      const key = this.headerToKey(header);
      let value = row[index];
      if (value instanceof Date) {
        value = value.toISOString();
      }
      // Campos que deben ser string aunque Google Sheets los convierta a number
      if ((key === 'dni' || key === 'telefono' || key === 'telefonoEmergencia') && typeof value === 'number') {
        value = String(value);
      }
      // Flags booleanos del contrato: aceptar TRUE/FALSE, "SI"/"NO", 1/0, "true"/"false"
      if (key === 'garantia' || key === 'llaveHabitacion' || key === 'llavePuertaCalle') {
        if (typeof value === 'string') {
          const v = value.trim().toUpperCase();
          value = (v === 'TRUE' || v === 'SI' || v === '1');
        } else if (typeof value === 'number') {
          value = value === 1;
        } else {
          value = Boolean(value);
        }
      }
      obj[key] = value;
    });
    return obj;
  }

  objectToRow(obj) {
    return this.headers.map(header => {
      const key = this.headerToKey(header);
      const value = obj[key];
      // Campos de fecha: convertir ISO string a Date, pero no tocar strings vacios
      if (typeof value === 'string' && value.trim() !== '' && header.toLowerCase().includes('fecha')) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
        return value; // fallback al string original si no parsea
      }
      // DNI y telefonos siempre como texto para que Google Sheets no los convierta a number
      if ((key === 'dni' || key === 'telefono' || key === 'telefonoEmergencia') && value !== undefined && value !== null && value !== '') {
        return String(value);
      }
      return value !== undefined && value !== null ? value : '';
    });
  }

  findRowIndex(id) {
    const data = this.getAllData();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === id) {
        return i + 2;
      }
    }
    return -1;
  }

  getAll() {
    return this.getAllData().map(row => this.rowToObject(row));
  }

  getById(id) {
    const data = this.getAllData();
    for (const row of data) {
      if (row[0] === id) {
        return this.rowToObject(row);
      }
    }
    return null;
  }

  create(data) {
    const sheet = this.getSheet();
    const id = data.id || generateId(this.sheetName);
    const now = new Date().toISOString();

    const fullData = {
      ...data,
      id: id,
      createdAt: now,
      updatedAt: now
    };

    const row = this.objectToRow(fullData);
    sheet.appendRow(row);
    return this.rowToObject(row);
  }

  update(id, data) {
    const sheet = this.getSheet();
    const rowIndex = this.findRowIndex(id);

    if (rowIndex === -1) return null;

    const currentRow = sheet.getRange(rowIndex, 1, 1, this.headers.length).getValues()[0];
    const currentObj = this.rowToObject(currentRow);

    const updatedObj = {
      ...currentObj,
      ...data,
      id: id,
      updatedAt: new Date().toISOString()
    };

    const newRow = this.objectToRow(updatedObj);
    sheet.getRange(rowIndex, 1, 1, this.headers.length).setValues([newRow]);
    return this.rowToObject(newRow);
  }

  delete(id) {
    const sheet = this.getSheet();
    const rowIndex = this.findRowIndex(id);

    if (rowIndex === -1) return false;

    sheet.deleteRow(rowIndex);
    return true;
  }

  getByField(fieldName, value) {
    const fieldIndex = this.headers.findIndex(h => h.toLowerCase() === fieldName.toLowerCase());
    if (fieldIndex === -1) return [];

    const data = this.getAllData();
    return data
      .filter(row => row[fieldIndex] === value)
      .map(row => this.rowToObject(row));
  }
}

// =====================================================
// REPOSITORIOS ESPECÍFICOS
// =====================================================
const ciudadRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.CIUDADES, CONFIG.HEADERS.CIUDADES);
    return this.repo;
  }
};

const edificioRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.EDIFICIOS, CONFIG.HEADERS.EDIFICIOS);
    return this.repo;
  }
};

const pisoRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.PISOS, CONFIG.HEADERS.PISOS);
    return this.repo;
  }
};

const habitacionRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.HABITACIONES, CONFIG.HEADERS.HABITACIONES);
    return this.repo;
  }
};

const inquilinoRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.INQUILINOS, CONFIG.HEADERS.INQUILINOS);
    return this.repo;
  }
};

const pagoRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.PAGOS, CONFIG.HEADERS.PAGOS);
    return this.repo;
  }
};

const gastoRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.GASTOS, CONFIG.HEADERS.GASTOS);
    return this.repo;
  }
};

const gastoFijoRepo = {
  repo: null,
  get() {
    if (!this.repo) this.repo = new BaseRepository(CONFIG.SHEETS.GASTOS_FIJOS, CONFIG.HEADERS.GASTOS_FIJOS);
    return this.repo;
  }
};

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Cascada: elimina pisos, habitaciones, inquilinos, pagos, gastos y gastos fijos
 * asociados a un edificio. Devuelve un resumen de lo eliminado.
 */
function deleteEdificioCascada(edificioId) {
  const resumen = { pisos: 0, habitaciones: 0, inquilinos: 0, pagos: 0, gastos: 0, gastosFijos: 0 };
  const pisos = pisoRepo.get().getAll().filter(p => p.edificioId === edificioId);
  const pisoIds = pisos.map(p => p.id);
  const habitaciones = habitacionRepo.get().getAll().filter(h => pisoIds.includes(h.pisoId));
  const habitacionIds = habitaciones.map(h => h.id);
  const inquilinos = inquilinoRepo.get().getAll().filter(i => habitacionIds.includes(i.habitacionId));
  const pagos = pagoRepo.get().getAll().filter(p => habitacionIds.includes(p.habitacionId));
  const gastos = gastoRepo.get().getAll().filter(g => g.edificioId === edificioId);
  const gastosFijos = gastoFijoRepo.get().getAll().filter(g => g.edificioId === edificioId);

  pagos.forEach(p => { if (pagoRepo.get().delete(p.id)) resumen.pagos++; });
  inquilinos.forEach(i => { if (inquilinoRepo.get().delete(i.id)) resumen.inquilinos++; });
  habitaciones.forEach(h => { if (habitacionRepo.get().delete(h.id)) resumen.habitaciones++; });
  pisos.forEach(p => { if (pisoRepo.get().delete(p.id)) resumen.pisos++; });
  gastos.forEach(g => { if (gastoRepo.get().delete(g.id)) resumen.gastos++; });
  gastosFijos.forEach(g => { if (gastoFijoRepo.get().delete(g.id)) resumen.gastosFijos++; });
  return resumen;
}

/**
 * Cascada: elimina habitaciones, inquilinos y pagos asociados a un piso.
 */
function deletePisoCascada(pisoId) {
  const resumen = { habitaciones: 0, inquilinos: 0, pagos: 0 };
  const habitaciones = habitacionRepo.get().getAll().filter(h => h.pisoId === pisoId);
  const habitacionIds = habitaciones.map(h => h.id);
  const inquilinos = inquilinoRepo.get().getAll().filter(i => habitacionIds.includes(i.habitacionId));
  const pagos = pagoRepo.get().getAll().filter(p => habitacionIds.includes(p.habitacionId));

  pagos.forEach(p => { if (pagoRepo.get().delete(p.id)) resumen.pagos++; });
  inquilinos.forEach(i => { if (inquilinoRepo.get().delete(i.id)) resumen.inquilinos++; });
  habitaciones.forEach(h => { if (habitacionRepo.get().delete(h.id)) resumen.habitaciones++; });
  return resumen;
}

/**
 * Cascada: elimina inquilinos y pagos de una habitacion.
 */
function deleteHabitacionCascada(habitacionId) {
  const resumen = { inquilinos: 0, pagos: 0 };
  const inquilinos = inquilinoRepo.get().getByField('habitacionId', habitacionId);
  const pagos = pagoRepo.get().getByField('habitacionId', habitacionId);
  pagos.forEach(p => { if (pagoRepo.get().delete(p.id)) resumen.pagos++; });
  inquilinos.forEach(i => { if (inquilinoRepo.get().delete(i.id)) resumen.inquilinos++; });
  return resumen;
}

/**
 * Cascada: elimina edificios de una ciudad (usa deleteEdificioCascada en cadena).
 */
function deleteCiudadCascada(ciudadId) {
  const resumen = { edificios: 0, pisos: 0, habitaciones: 0, inquilinos: 0, pagos: 0, gastos: 0, gastosFijos: 0 };
  const edificios = edificioRepo.get().getAll().filter(e => e.ciudadId === ciudadId);
  edificios.forEach(ed => {
    const r = deleteEdificioCascada(ed.id);
    resumen.pisos += r.pisos;
    resumen.habitaciones += r.habitaciones;
    resumen.inquilinos += r.inquilinos;
    resumen.pagos += r.pagos;
    resumen.gastos += r.gastos;
    resumen.gastosFijos += r.gastosFijos;
    if (edificioRepo.get().delete(ed.id)) resumen.edificios++;
  });
  return resumen;
}

/**
 * Obtiene los IDs de pisos para un edificio
 */
function getPisosIdsByEdificio(edificioId) {
  if (!edificioId) return null;
  const pisos = pisoRepo.get().getAll().filter(p => p.edificioId === edificioId);
  return pisos.map(p => p.id);
}

/**
 * Obtiene los IDs de pisos para una ciudad (a traves de edificios)
 */
function getPisosIdsByCiudad(ciudadId) {
  if (!ciudadId) return null;
  const edificios = edificioRepo.get().getAll().filter(e => e.ciudadId === ciudadId);
  const edificioIds = edificios.map(e => e.id);
  const pisos = pisoRepo.get().getAll().filter(p => edificioIds.includes(p.edificioId));
  return pisos.map(p => p.id);
}

function getHabitacionesConEstadoPago(mes, anio, edificioId, ciudadId) {
  let habitaciones = habitacionRepo.get().getAll();
  const pagos = pagoRepo.get().getAll().filter(p => p.mes == mes && p.anio == anio);
  const inquilinos = inquilinoRepo.get().getAll();
  const pisos = pisoRepo.get().getAll();
  const edificios = edificioRepo.get().getAll();

  // Filtrar por edificio si se especifica
  if (edificioId) {
    const pisosIds = getPisosIdsByEdificio(edificioId);
    if (pisosIds) {
      habitaciones = habitaciones.filter(h => pisosIds.includes(h.pisoId));
    }
  }
  // O filtrar por ciudad si se especifica
  else if (ciudadId) {
    const pisosIds = getPisosIdsByCiudad(ciudadId);
    if (pisosIds) {
      habitaciones = habitaciones.filter(h => pisosIds.includes(h.pisoId));
    }
  }

  return habitaciones.map(hab => {
    const pagosHab = pagos.filter(p => p.habitacionId === hab.id);
    const inquilino = inquilinos.find(i => i.habitacionId === hab.id && i.estado === 'activo');
    const piso = pisos.find(p => p.id === hab.pisoId);
    const edificio = piso ? edificios.find(e => e.id === piso.edificioId) : null;

    // Calcular el dia de pago basado en la fecha de ingreso del inquilino.
    // Se lee del string ISO, no con getDate(): ver partesDeFecha().
    let diaPago = null;
    let fechaIngreso = null;
    if (inquilino && inquilino.fechaIngreso) {
      fechaIngreso = inquilino.fechaIngreso;
      diaPago = diaDeFecha(inquilino.fechaIngreso); // Dia del mes (1-31)
    }

    return {
      ...hab,
      alquilerPagado: pagosHab.some(p => p.concepto === 'alquiler' && p.estado === 'pagado'),
      internetPagado: pagosHab.some(p => p.concepto === 'internet' && p.estado === 'pagado'),
      nombreInquilino: inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : null,
      telefonoInquilino: inquilino ? inquilino.telefono : null,
      fechaIngreso: fechaIngreso,
      diaPago: diaPago,
      pisoNumero: piso ? piso.numero : null,
      edificioNombre: edificio ? edificio.nombre : null,
      edificioId: edificio ? edificio.id : null
    };
  });
}

function getResumenPagosMes(mes, anio, edificioId, ciudadId) {
  let pagos = pagoRepo.get().getAll().filter(p => p.mes == mes && p.anio == anio);
  let habitaciones = habitacionRepo.get().getAll().filter(h => h.estado === 'occupied');

  // Filtrar por edificio o ciudad
  let pisosIds = null;
  if (edificioId) {
    pisosIds = getPisosIdsByEdificio(edificioId);
  } else if (ciudadId) {
    pisosIds = getPisosIdsByCiudad(ciudadId);
  }

  if (pisosIds) {
    const habitacionesIds = habitaciones.filter(h => pisosIds.includes(h.pisoId)).map(h => h.id);
    pagos = pagos.filter(p => habitacionesIds.includes(p.habitacionId));
    habitaciones = habitaciones.filter(h => pisosIds.includes(h.pisoId));
  }

  const habitacionesPagadas = new Set(
    pagos
      .filter(p => p.concepto === 'alquiler' && p.estado === 'pagado')
      .map(p => p.habitacionId)
  );

  return {
    totalRecaudado: pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + Number(p.monto || 0), 0),
    totalPagos: pagos.length,
    habitacionesPagadas: habitacionesPagadas.size,
    habitacionesPendientes: habitaciones.length - habitacionesPagadas.size
  };
}

function getResumenGastosPorCategoria(mes, anio, edificioId) {
  const gastos = gastoRepo.get().getAll().filter(g => {
    const matchesEdificio = !edificioId || g.edificioId === edificioId;
    return fechaEnPeriodo(g.fecha, mes, anio) && matchesEdificio;
  });

  const resumen = {
    mantenimiento: 0,
    servicios: 0,
    limpieza: 0,
    reparacion: 0,
    otros: 0
  };

  gastos.forEach(g => {
    const cat = g.categoria || 'otros';
    resumen[cat] = (resumen[cat] || 0) + Number(g.monto || 0);
  });

  return resumen;
}

function getDashboardStats(mes, anio, edificioId, ciudadId) {
  let habitaciones = habitacionRepo.get().getAll();
  let gastos = gastoRepo.get().getAll();
  let edificios = edificioRepo.get().getAll();

  // Filtrar por edificio o ciudad
  let pisosIds = null;
  let edificioIds = null;

  if (edificioId) {
    pisosIds = getPisosIdsByEdificio(edificioId);
    edificioIds = [edificioId];
  } else if (ciudadId) {
    pisosIds = getPisosIdsByCiudad(ciudadId);
    edificioIds = edificios.filter(e => e.ciudadId === ciudadId).map(e => e.id);
    edificios = edificios.filter(e => e.ciudadId === ciudadId);
  }

  if (pisosIds) {
    habitaciones = habitaciones.filter(h => pisosIds.includes(h.pisoId));
  }

  // Filtrar gastos
  gastos = gastos.filter(g => {
    const matchesEdificio = !edificioIds || edificioIds.includes(g.edificioId);
    return fechaEnPeriodo(g.fecha, mes, anio) && matchesEdificio;
  });

  const ocupadas = habitaciones.filter(h => h.estado === 'occupied');
  const pagosResumen = getResumenPagosMes(mes, anio, edificioId, ciudadId);
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);

  return {
    totalCiudades: ciudadRepo.get().getAll().length,
    totalEdificios: edificios.length,
    totalHabitaciones: habitaciones.length,
    habitacionesOcupadas: ocupadas.length,
    habitacionesVacantes: habitaciones.filter(h => h.estado === 'vacant').length,
    tasaOcupacion: habitaciones.length > 0 ? (ocupadas.length / habitaciones.length) * 100 : 0,
    ingresosMes: pagosResumen.totalRecaudado,
    gastosMes: totalGastos,
    balance: pagosResumen.totalRecaudado - totalGastos,
    habitacionesPagadas: pagosResumen.habitacionesPagadas,
    habitacionesPendientes: pagosResumen.habitacionesPendientes
  };
}

// =====================================================
// UBICACION DE UNA HABITACION (piso -> edificio -> ciudad)
// =====================================================

/**
 * Indice habitacionId -> ubicacion completa.
 * Se arma una sola vez por request: releer las hojas por cada inquilino
 * multiplicaria las llamadas a SpreadsheetApp y reventaria el tiempo de ejecucion.
 */
function construirIndiceUbicaciones() {
  const habitaciones = habitacionRepo.get().getAll();
  const pisos = pisoRepo.get().getAll();
  const edificios = edificioRepo.get().getAll();
  const ciudades = ciudadRepo.get().getAll();

  const pisoPorId = {};
  pisos.forEach(p => { pisoPorId[p.id] = p; });
  const edificioPorId = {};
  edificios.forEach(e => { edificioPorId[e.id] = e; });
  const ciudadPorId = {};
  ciudades.forEach(c => { ciudadPorId[c.id] = c; });

  const indice = {};
  habitaciones.forEach(hab => {
    const piso = pisoPorId[hab.pisoId] || null;
    const edificio = piso ? (edificioPorId[piso.edificioId] || null) : null;
    const ciudad = edificio ? (ciudadPorId[edificio.ciudadId] || null) : null;

    indice[hab.id] = {
      id: hab.id,
      codigo: hab.codigo,
      estado: hab.estado,
      montoAlquiler: hab.montoAlquiler,
      montoInternet: hab.montoInternet,
      pisoId: hab.pisoId,
      pisoNumero: piso ? piso.numero : null,
      edificioId: edificio ? edificio.id : null,
      edificioNombre: edificio ? edificio.nombre : null,
      ciudadId: ciudad ? ciudad.id : null,
      ciudadNombre: ciudad ? ciudad.nombre : null
    };
  });
  return indice;
}

/** Adjunta la ubicacion a un inquilino. Mismo patron que ya usa GET /pagos. */
function conUbicacion(inquilino, indice) {
  if (!inquilino) return inquilino;
  const copia = {};
  Object.keys(inquilino).forEach(k => { copia[k] = inquilino[k]; });
  copia.habitacion = indice[inquilino.habitacionId] || null;
  return copia;
}

// =====================================================
// ARCHIVO DOCUMENTAL EN DRIVE
// =====================================================

const DRIVE_TIPOS = {
  'dni-frente':  { hoja: 'INQUILINOS', campo: 'dniFotoFrenteUrl',  mime: 'image/jpeg',      nombre: 'DNI_frente.jpg' },
  'dni-reverso': { hoja: 'INQUILINOS', campo: 'dniFotoReversoUrl', mime: 'image/jpeg',      nombre: 'DNI_reverso.jpg' },
  'contrato':    { hoja: 'INQUILINOS', campo: 'contratoPdfUrl',    mime: 'application/pdf', nombre: null },
  'voucher':     { hoja: 'PAGOS',      campo: 'voucherPdfUrl',     mime: 'application/pdf', nombre: null }
};

const DRIVE_MAX_BYTES = 6 * 1024 * 1024;
const DRIVE_CACHE_SEGUNDOS = 21600; // 6 h

/** Quita tildes y caracteres que Drive rechaza en nombres. */
function normalizarNombreDrive(texto) {
  // ̀-ͯ es el bloque de diacriticos combinantes que deja NFD
  return String(texto == null ? '' : texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOrCreateFolder(padre, nombre) {
  const limpio = normalizarNombreDrive(nombre) || 'Sin nombre';
  const existentes = padre.getFoldersByName(limpio);
  if (existentes.hasNext()) return existentes.next();
  return padre.createFolder(limpio);
}

/**
 * Resuelve (creando lo que falte) la ruta CONFIG.DRIVE_BASE_FOLDER_NAME/<segmentos>.
 * Cachea el id resultante para no repetir la cadena de busquedas en cada subida.
 */
function resolverRutaDrive(segmentos) {
  const clave = 'drive:' + CONFIG.DRIVE_BASE_FOLDER_NAME + '/' + segmentos.join('/');
  const cache = CacheService.getScriptCache();
  const cacheado = cache.get(clave);
  if (cacheado) {
    try {
      return DriveApp.getFolderById(cacheado);
    } catch (e) {
      // La carpeta fue borrada o movida: se recrea abajo
    }
  }

  let carpeta = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_FOLDER_ID);
  carpeta = getOrCreateFolder(carpeta, CONFIG.DRIVE_BASE_FOLDER_NAME);
  segmentos.forEach(seg => { carpeta = getOrCreateFolder(carpeta, seg); });

  cache.put(clave, carpeta.getId(), DRIVE_CACHE_SEGUNDOS);
  return carpeta;
}

/** Inquilinos/<Ciudad>/<Edificio>/<Codigo> - <Nombre Apellido> */
function resolverCarpetaInquilino(inquilino, ubicacion) {
  const ciudad = (ubicacion && ubicacion.ciudadNombre) || 'Sin ciudad';
  const edificio = (ubicacion && ubicacion.edificioNombre) || 'Sin edificio';
  const codigo = (ubicacion && ubicacion.codigo) || inquilino.habitacionId || 'SIN-HAB';
  return resolverRutaDrive([ciudad, edificio, codigo + ' - ' + inquilino.nombre + ' ' + inquilino.apellido]);
}

/** Inquilinos/<Ciudad>/<Edificio>/Vouchers/<AAAA-MM> */
function resolverCarpetaVouchers(ubicacion, anio, mes) {
  const ciudad = (ubicacion && ubicacion.ciudadNombre) || 'Sin ciudad';
  const edificio = (ubicacion && ubicacion.edificioNombre) || 'Sin edificio';
  const mm = ('0' + String(mes)).slice(-2);
  return resolverRutaDrive([ciudad, edificio, 'Vouchers', String(anio) + '-' + mm]);
}

function extraerIdDriveDesdeUrl(url) {
  const m = String(url == null ? '' : url).match(/[-\w]{25,}/);
  return m ? m[0] : null;
}

/**
 * Sube un documento a Drive y guarda el enlace en la hoja correspondiente.
 * Los archivos NO se comparten: heredan los permisos de la carpeta raiz y quedan privados.
 */
function subirDocumentoDrive(params) {
  const spec = DRIVE_TIPOS[params.tipo];
  if (!spec) return errorResponse('Tipo de documento no reconocido: ' + params.tipo);
  if (!params.archivoBase64) return errorResponse('El archivo llego vacio');

  // El frontend puede mandar un data URL completo
  const base64 = String(params.archivoBase64).replace(/^data:[^;]+;base64,/, '');
  let bytes;
  try {
    bytes = Utilities.base64Decode(base64);
  } catch (e) {
    return errorResponse('El archivo no es base64 valido');
  }
  if (bytes.length > DRIVE_MAX_BYTES) {
    return errorResponse('El archivo supera el limite de 6 MB');
  }

  const indice = construirIndiceUbicaciones();
  let carpeta, nombreArchivo, repo, entidadId;

  if (spec.hoja === 'PAGOS') {
    const pago = pagoRepo.get().getById(params.pagoId);
    if (!pago) return errorResponse('Pago no encontrado');

    const ubicacion = indice[pago.habitacionId] || null;
    const inquilino = params.inquilinoId ? inquilinoRepo.get().getById(params.inquilinoId) : null;
    const quien = inquilino ? '_' + inquilino.nombre + '_' + inquilino.apellido : '';
    const codigoHab = ubicacion ? ubicacion.codigo : pago.habitacionId;

    carpeta = resolverCarpetaVouchers(ubicacion, pago.anio, pago.mes);
    nombreArchivo = normalizarNombreDrive('Voucher_' + pago.id + '_' + codigoHab + quien).replace(/\s+/g, '_') + '.pdf';
    repo = pagoRepo.get();
    entidadId = pago.id;
  } else {
    const inquilino = inquilinoRepo.get().getById(params.inquilinoId);
    if (!inquilino) return errorResponse('Inquilino no encontrado');

    const ubicacion = indice[inquilino.habitacionId] || null;
    carpeta = resolverCarpetaInquilino(inquilino, ubicacion);

    if (params.tipo === 'contrato') {
      const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      nombreArchivo = 'Reglamento_' + hoy + '.pdf';
    } else {
      nombreArchivo = spec.nombre;
    }
    repo = inquilinoRepo.get();
    entidadId = inquilino.id;
  }

  const actual = repo.getById(entidadId);
  const urlAnterior = actual ? actual[spec.campo] : null;

  const blob = Utilities.newBlob(bytes, params.mime || spec.mime, nombreArchivo);
  const archivo = carpeta.createFile(blob);

  // Reemplazo: el archivo viejo de este mismo slot va a la papelera
  if (urlAnterior) {
    const idAnterior = extraerIdDriveDesdeUrl(urlAnterior);
    if (idAnterior && idAnterior !== archivo.getId()) {
      try {
        DriveApp.getFileById(idAnterior).setTrashed(true);
      } catch (e) {
        console.log('No se pudo enviar a papelera el archivo anterior: ' + idAnterior);
      }
    }
  }

  const patch = {};
  patch[spec.campo] = archivo.getUrl();
  const actualizado = repo.update(entidadId, patch);

  return successResponse({
    tipo: params.tipo,
    url: archivo.getUrl(),
    fileId: archivo.getId(),
    nombre: nombreArchivo,
    carpeta: carpeta.getName(),
    entidad: actualizado
  }, 'Documento guardado en Drive');
}

/**
 * Devuelve el enlace ya guardado de un documento.
 * Sirve para confirmar una subida cuando la respuesta del POST no se pudo leer.
 */
function consultarDocumentoDrive(params) {
  const spec = DRIVE_TIPOS[params.tipo];
  if (!spec) return errorResponse('Tipo de documento no reconocido: ' + params.tipo);

  const entidad = spec.hoja === 'PAGOS'
    ? pagoRepo.get().getById(params.pagoId)
    : inquilinoRepo.get().getById(params.inquilinoId);

  if (!entidad) return errorResponse('Registro no encontrado');
  return successResponse({ tipo: params.tipo, url: entidad[spec.campo] || null });
}

// =====================================================
// ROUTER PRINCIPAL
// =====================================================
function handleRequest(request) {
  const { action, endpoint, data } = request;

  try {
    const parts = endpoint.split('/').filter(p => p && p !== 'api');
    let resource = parts[0];
    const id = parts[1];
    const subResource = parts[2];
    const params = data || {};

    // Si se accede a la URL raiz sin parametros, devolver el ping por defecto
    // (ayuda a verificar que el deploy esta vivo abriendo la URL en el navegador)
    if (!resource) resource = 'ping';

    // Log para debug
    console.log('Request:', action, endpoint, JSON.stringify(params));

    switch (resource) {
      // ------------------- PING / HEALTH CHECK -------------------
      case 'ping':
      case 'health':
      case 'version': {
        const now = new Date();
        const tz = Session.getScriptTimeZone(); // Definida en appsscript.json (America/Lima)
        return successResponse({
          version: CONFIG.VERSION,
          timestamp: now.toISOString(),        // UTC (estandar)
          localTime: Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm:ss"),
          timezone: tz,
          spreadsheetId: CONFIG.SPREADSHEET_ID,
          sheets: Object.values(CONFIG.SHEETS),
        }, 'OK');
      }

      // ------------------- CIUDADES -------------------
      case 'ciudades':
        if (action === 'GET') {
          if (id) {
            const ciudad = ciudadRepo.get().getById(id);
            return ciudad ? successResponse(ciudad) : errorResponse('Ciudad no encontrada');
          }
          return successResponse(ciudadRepo.get().getAll());
        }
        if (action === 'POST') {
          const newCiudad = ciudadRepo.get().create(params);
          return successResponse(newCiudad, 'Ciudad creada');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          const updated = ciudadRepo.get().update(id, params);
          return updated ? successResponse(updated) : errorResponse('Ciudad no encontrada');
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          const cascada = deleteCiudadCascada(id);
          const deleted = ciudadRepo.get().delete(id);
          return deleted
            ? successResponse(cascada, `Ciudad eliminada con ${cascada.edificios} edificios y ${cascada.habitaciones} habitaciones`)
            : errorResponse('Ciudad no encontrada');
        }
        break;

      // ------------------- EDIFICIOS -------------------
      case 'edificios':
        if (action === 'GET') {
          if (id) {
            const edificio = edificioRepo.get().getById(id);
            return edificio ? successResponse(edificio) : errorResponse('Edificio no encontrado');
          }
          if (params.ciudadId) {
            return successResponse(edificioRepo.get().getByField('ciudadId', params.ciudadId));
          }
          return successResponse(edificioRepo.get().getAll());
        }
        if (action === 'POST') {
          // Crear edificio completo con pisos y habitaciones
          if (id === 'completo') {
            try {
              const { edificio: edData, pisos: pisosConfig } = params;

              // 1. Crear edificio
              const edificio = edificioRepo.get().create({
                ...edData,
                totalPisos: pisosConfig.length,
                activo: true
              });

              const pisosCreados = [];
              const habitacionesCreadas = [];

              // 2. Crear pisos y habitaciones
              for (const pisoConfig of pisosConfig) {
                const piso = pisoRepo.get().create({
                  edificioId: edificio.id,
                  numero: pisoConfig.numero,
                  descripcion: pisoConfig.descripcion || `Piso ${pisoConfig.numero}`
                });
                pisosCreados.push(piso);

                // Crear habitaciones del piso
                for (let i = 1; i <= pisoConfig.cantidadHabitaciones; i++) {
                  const ubicaciones = ['izquierda', 'derecha', 'centro', 'unica'];
                  const ubicacion = pisoConfig.cantidadHabitaciones === 1 ? 'unica' :
                                   pisoConfig.cantidadHabitaciones === 2 ? (i === 1 ? 'izquierda' : 'derecha') :
                                   ubicaciones[(i - 1) % 4];

                  const hab = habitacionRepo.get().create({
                    pisoId: piso.id,
                    codigo: `${String.fromCharCode(64 + pisoConfig.numero)}${i}`, // A1, A2, B1, B2...
                    ubicacion: ubicacion,
                    montoAlquiler: pisoConfig.montoAlquiler || 0,
                    montoInternet: pisoConfig.montoInternet || 0,
                    montoServicios: pisoConfig.montoServicios || 0,
                    estado: 'vacant',
                    activo: true
                  });
                  habitacionesCreadas.push(hab);
                }
              }

              return successResponse({
                edificio,
                pisos: pisosCreados,
                habitaciones: habitacionesCreadas
              }, 'Edificio creado con ' + pisosCreados.length + ' pisos y ' + habitacionesCreadas.length + ' habitaciones');
            } catch (error) {
              return errorResponse('Error al crear edificio completo: ' + String(error));
            }
          }
          return successResponse(edificioRepo.get().create(params), 'Edificio creado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          const updated = edificioRepo.get().update(id, params);
          return updated ? successResponse(updated) : errorResponse('No encontrado');
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          const cascada = deleteEdificioCascada(id);
          const deleted = edificioRepo.get().delete(id);
          return deleted
            ? successResponse(cascada, `Edificio eliminado con ${cascada.pisos} pisos y ${cascada.habitaciones} habitaciones`)
            : errorResponse('Edificio no encontrado');
        }
        break;

      // ------------------- PISOS -------------------
      case 'pisos':
        if (action === 'GET') {
          if (id) {
            return successResponse(pisoRepo.get().getById(id));
          }
          if (params.edificioId) {
            return successResponse(pisoRepo.get().getByField('edificioId', params.edificioId));
          }
          return successResponse(pisoRepo.get().getAll());
        }
        if (action === 'POST') {
          return successResponse(pisoRepo.get().create(params), 'Piso creado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          return successResponse(pisoRepo.get().update(id, params));
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          const cascada = deletePisoCascada(id);
          const deleted = pisoRepo.get().delete(id);
          return deleted
            ? successResponse(cascada, `Piso eliminado con ${cascada.habitaciones} habitaciones`)
            : errorResponse('Piso no encontrado');
        }
        break;

      // ------------------- HABITACIONES -------------------
      case 'habitaciones':
        if (action === 'GET') {
          // GET /habitaciones/estado-pago
          if (id === 'estado-pago') {
            const mes = Number(params.mes) || new Date().getMonth() + 1;
            const anio = Number(params.anio) || new Date().getFullYear();
            const edificioId = params.edificioId || null;
            const ciudadId = params.ciudadId || null;
            return successResponse(getHabitacionesConEstadoPago(mes, anio, edificioId, ciudadId));
          }
          if (id) {
            return successResponse(habitacionRepo.get().getById(id));
          }
          if (params.pisoId) {
            return successResponse(habitacionRepo.get().getByField('pisoId', params.pisoId));
          }
          if (params.estado) {
            return successResponse(habitacionRepo.get().getByField('estado', params.estado));
          }
          return successResponse(habitacionRepo.get().getAll());
        }
        if (action === 'POST') {
          const newHab = habitacionRepo.get().create({
            ...params,
            estado: params.estado || 'vacant',
            activo: true
          });
          return successResponse(newHab, 'Habitación creada');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          return successResponse(habitacionRepo.get().update(id, params));
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          const cascada = deleteHabitacionCascada(id);
          const deleted = habitacionRepo.get().delete(id);
          return deleted
            ? successResponse(cascada, `Habitacion eliminada con ${cascada.inquilinos} inquilinos y ${cascada.pagos} pagos`)
            : errorResponse('Habitacion no encontrada');
        }
        break;

      // ------------------- INQUILINOS -------------------
      case 'inquilinos':
        if (action === 'GET') {
          // Cada inquilino sale con su ubicacion resuelta (habitacion, piso, edificio, ciudad).
          // Sin esto el frontend solo tiene habitacionId y termina mostrando "H006".
          const indiceUbic = construirIndiceUbicaciones();

          if (id === 'habitacion' && subResource) {
            const inquilinos = inquilinoRepo.get().getByField('habitacionId', subResource);
            const activo = inquilinos.find(i => i.estado === 'activo');
            return successResponse(activo ? conUbicacion(activo, indiceUbic) : null);
          }
          if (id) {
            const inq = inquilinoRepo.get().getById(id);
            return successResponse(inq ? conUbicacion(inq, indiceUbic) : null);
          }
          if (params.activos === true || params.activos === 'true') {
            return successResponse(
              inquilinoRepo.get().getByField('estado', 'activo').map(i => conUbicacion(i, indiceUbic))
            );
          }
          return successResponse(inquilinoRepo.get().getAll().map(i => conUbicacion(i, indiceUbic)));
        }
        if (action === 'POST') {
          // Validacion minima
          if (!params.nombre || !params.apellido) return errorResponse('Nombre y apellido son requeridos');
          if (!params.habitacionId) return errorResponse('Habitacion es requerida');
          if (!params.dni || String(params.dni).trim() === '') return errorResponse('DNI es requerido');

          const newInq = inquilinoRepo.get().create({
            ...params,
            fechaIngreso: params.fechaIngreso || new Date().toISOString(),
            estado: 'activo'
          });
          // Actualizar habitacion a ocupada
          habitacionRepo.get().update(params.habitacionId, { estado: 'occupied' });
          return successResponse(newInq, 'Inquilino registrado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          const inqActual = inquilinoRepo.get().getById(id);
          const updated = inquilinoRepo.get().update(id, params);
          // Si el inquilino fue dado de baja, liberar la habitacion
          if (inqActual && updated && params.estado === 'inactivo' && inqActual.estado === 'activo' && inqActual.habitacionId) {
            // Solo liberar si no hay otro inquilino activo en esa habitacion
            const otrosActivos = inquilinoRepo.get().getByField('habitacionId', inqActual.habitacionId)
              .filter(i => i.id !== id && i.estado === 'activo');
            if (otrosActivos.length === 0) {
              habitacionRepo.get().update(inqActual.habitacionId, { estado: 'vacant' });
            }
          }
          return updated ? successResponse(updated) : errorResponse('Inquilino no encontrado');
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          const inq = inquilinoRepo.get().getById(id);
          if (!inq) return errorResponse('Inquilino no encontrado');
          // Eliminar pagos asociados al inquilino (cascada)
          const pagos = pagoRepo.get().getByField('inquilinoId', id);
          let pagosEliminados = 0;
          pagos.forEach(p => { if (pagoRepo.get().delete(p.id)) pagosEliminados++; });
          // Liberar habitacion si este era el unico inquilino activo
          if (inq.habitacionId && inq.estado === 'activo') {
            const otrosActivos = inquilinoRepo.get().getByField('habitacionId', inq.habitacionId)
              .filter(i => i.id !== id && i.estado === 'activo');
            if (otrosActivos.length === 0) {
              habitacionRepo.get().update(inq.habitacionId, { estado: 'vacant' });
            }
          }
          return inquilinoRepo.get().delete(id)
            ? successResponse({ pagosEliminados }, `Inquilino eliminado (${pagosEliminados} pagos)`)
            : errorResponse('No se pudo eliminar');
        }
        break;

      // ------------------- ARCHIVO EN DRIVE -------------------
      case 'drive':
        if (id !== 'documento') return errorResponse('Recurso de Drive no encontrado: ' + id);
        if (action === 'POST') return subirDocumentoDrive(params);
        if (action === 'GET') return consultarDocumentoDrive(params);
        break;

      // ------------------- PAGOS -------------------
      case 'pagos':
        if (action === 'GET') {
          if (id === 'resumen') {
            const mes = Number(params.mes) || new Date().getMonth() + 1;
            const anio = Number(params.anio) || new Date().getFullYear();
            const edificioId = params.edificioId || null;
            const ciudadId = params.ciudadId || null;
            return successResponse(getResumenPagosMes(mes, anio, edificioId, ciudadId));
          }
          if (id) {
            return successResponse(pagoRepo.get().getById(id));
          }
          if (params.mes && params.anio) {
            let pagos = pagoRepo.get().getAll().filter(p =>
              p.mes == params.mes && p.anio == params.anio
            );

            // Filtrar por edificio o ciudad
            if (params.edificioId || params.ciudadId) {
              let pisosIds = null;
              if (params.edificioId) {
                pisosIds = getPisosIdsByEdificio(params.edificioId);
              } else if (params.ciudadId) {
                pisosIds = getPisosIdsByCiudad(params.ciudadId);
              }

              if (pisosIds) {
                const habitaciones = habitacionRepo.get().getAll().filter(h => pisosIds.includes(h.pisoId));
                const habitacionIds = habitaciones.map(h => h.id);
                pagos = pagos.filter(p => habitacionIds.includes(p.habitacionId));
              }
            }

            // Agregar info de habitacion a cada pago
            const habitaciones = habitacionRepo.get().getAll();
            pagos = pagos.map(p => ({
              ...p,
              habitacion: habitaciones.find(h => h.id === p.habitacionId) || null
            }));

            return successResponse(pagos);
          }
          if (params.habitacionId) {
            return successResponse(pagoRepo.get().getByField('habitacionId', params.habitacionId));
          }
          if (params.inquilinoId) {
            return successResponse(pagoRepo.get().getByField('inquilinoId', params.inquilinoId));
          }
          return successResponse(pagoRepo.get().getAll());
        }
        if (action === 'POST') {
          if (id === 'reset-mes') {
            return successResponse({ affected: 0 }, 'Reset completado');
          }
          // Validacion minima
          if (!params.habitacionId) return errorResponse('Habitacion es requerida');
          if (!params.concepto) return errorResponse('Concepto es requerido');
          if (params.monto === undefined || params.monto === null || Number(params.monto) < 0) {
            return errorResponse('Monto valido es requerido');
          }
          const newPago = pagoRepo.get().create({
            ...params,
            fecha: params.fecha || new Date().toISOString(),
            estado: params.estado || 'pagado'
          });
          return successResponse(newPago, 'Pago registrado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          const updated = pagoRepo.get().update(id, params);
          return updated ? successResponse(updated) : errorResponse('Pago no encontrado');
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          return pagoRepo.get().delete(id)
            ? successResponse(null, 'Pago eliminado')
            : errorResponse('Pago no encontrado');
        }
        break;

      // ------------------- GASTOS -------------------
      case 'gastos':
        if (action === 'GET') {
          if (id === 'resumen-categoria') {
            const mes = Number(params.mes) || new Date().getMonth() + 1;
            const anio = Number(params.anio) || new Date().getFullYear();
            return successResponse(getResumenGastosPorCategoria(mes, anio, params.edificioId));
          }
          if (id) {
            return successResponse(gastoRepo.get().getById(id));
          }
          if (params.mes && params.anio) {
            const gastos = gastoRepo.get().getAll()
              .filter(g => fechaEnPeriodo(g.fecha, params.mes, params.anio));
            return successResponse(gastos);
          }
          return successResponse(gastoRepo.get().getAll());
        }
        if (action === 'POST') {
          const newGasto = gastoRepo.get().create({
            ...params,
            fecha: params.fecha || new Date().toISOString()
          });
          return successResponse(newGasto, 'Gasto registrado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          return successResponse(gastoRepo.get().update(id, params));
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          return gastoRepo.get().delete(id) ? successResponse(null, 'Eliminado') : errorResponse('No encontrado');
        }
        break;

      // ------------------- GASTOS FIJOS -------------------
      case 'gastos-fijos':
        if (action === 'GET') {
          if (id) {
            return successResponse(gastoFijoRepo.get().getById(id));
          }
          if (params.edificioId) {
            return successResponse(gastoFijoRepo.get().getByField('edificioId', params.edificioId));
          }
          return successResponse(gastoFijoRepo.get().getAll());
        }
        if (action === 'POST') {
          const newGastoFijo = gastoFijoRepo.get().create({
            ...params,
            activo: params.activo !== false
          });
          return successResponse(newGastoFijo, 'Gasto fijo registrado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          return successResponse(gastoFijoRepo.get().update(id, params));
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          return gastoFijoRepo.get().delete(id) ? successResponse(null, 'Eliminado') : errorResponse('No encontrado');
        }
        break;

      // ------------------- REPORTES -------------------
      case 'reportes':
        const mes = Number(params.mes) || new Date().getMonth() + 1;
        const anio = Number(params.anio) || new Date().getFullYear();
        const edificioIdReporte = params.edificioId || null;
        const ciudadIdReporte = params.ciudadId || null;

        if (id === 'dashboard') {
          return successResponse(getDashboardStats(mes, anio, edificioIdReporte, ciudadIdReporte));
        }

        if (id === 'mensual') {
          // Obtener datos filtrados
          let pisosIds = null;
          let edificioIds = null;
          if (edificioIdReporte) {
            pisosIds = getPisosIdsByEdificio(edificioIdReporte);
            edificioIds = [edificioIdReporte];
          } else if (ciudadIdReporte) {
            pisosIds = getPisosIdsByCiudad(ciudadIdReporte);
            edificioIds = edificioRepo.get().getAll().filter(e => e.ciudadId === ciudadIdReporte).map(e => e.id);
          }

          let habitaciones = habitacionRepo.get().getAll();
          if (pisosIds) {
            habitaciones = habitaciones.filter(h => pisosIds.includes(h.pisoId));
          }
          const habitacionIds = habitaciones.map(h => h.id);

          let pagos = pagoRepo.get().getAll().filter(p => p.mes == mes && p.anio == anio);
          let gastos = gastoRepo.get().getAll().filter(g => fechaEnPeriodo(g.fecha, mes, anio));

          if (pisosIds) {
            pagos = pagos.filter(p => habitacionIds.includes(p.habitacionId));
          }
          if (edificioIds) {
            gastos = gastos.filter(g => edificioIds.includes(g.edificioId));
          }

          const ingresos = pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + Number(p.monto || 0), 0);
          const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);

          return successResponse({
            mes,
            anio,
            ingresos,
            gastos: totalGastos,
            balance: ingresos - totalGastos,
            pagosRegistrados: pagos.length
          });
        }

        if (id === 'historico') {
          const mesesAtras = Number(params.meses) || 6;
          const historico = [];

          // Preparar filtros
          let pisosIds = null;
          let edificioIds = null;
          if (edificioIdReporte) {
            pisosIds = getPisosIdsByEdificio(edificioIdReporte);
            edificioIds = [edificioIdReporte];
          } else if (ciudadIdReporte) {
            pisosIds = getPisosIdsByCiudad(ciudadIdReporte);
            edificioIds = edificioRepo.get().getAll().filter(e => e.ciudadId === ciudadIdReporte).map(e => e.id);
          }

          let habitaciones = habitacionRepo.get().getAll();
          if (pisosIds) {
            habitaciones = habitaciones.filter(h => pisosIds.includes(h.pisoId));
          }
          const habitacionIds = habitaciones.map(h => h.id);

          for (let i = 0; i < mesesAtras; i++) {
            let m = mes - i;
            let a = anio;
            if (m <= 0) { m += 12; a -= 1; }

            let pagosH = pagoRepo.get().getAll().filter(p => p.mes == m && p.anio == a);
            let gastosH = gastoRepo.get().getAll().filter(g => fechaEnPeriodo(g.fecha, m, a));

            if (pisosIds) {
              pagosH = pagosH.filter(p => habitacionIds.includes(p.habitacionId));
            }
            if (edificioIds) {
              gastosH = gastosH.filter(g => edificioIds.includes(g.edificioId));
            }

            const ingresosH = pagosH.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + Number(p.monto || 0), 0);
            const gastosTotal = gastosH.reduce((sum, g) => sum + Number(g.monto || 0), 0);

            historico.push({ mes: m, anio: a, ingresos: ingresosH, gastos: gastosTotal, balance: ingresosH - gastosTotal });
          }

          return successResponse(historico.reverse());
        }

        return errorResponse('Tipo de reporte no válido');

      default:
        return errorResponse('Recurso no encontrado: ' + resource);
    }

    return errorResponse('Acción no soportada');

  } catch (error) {
    console.error('Error en handleRequest:', error, error && error.stack);
    return errorResponse(String(error));
  }
}

// =====================================================
// ENDPOINTS HTTP
// =====================================================

/**
 * Maneja todas las peticiones HTTP.
 * Por cuestiones de CORS, el frontend envía todo como GET
 * con los datos codificados en query params.
 */
function doGet(e) {
  try {
    const params = e.parameter || {};

    // Parsear 'data' si viene como JSON string (para POST/PUT)
    let data = {};
    if (params.data) {
      try {
        data = JSON.parse(params.data);
      } catch (parseError) {
        console.error('Error parseando data:', parseError);
        data = {};
      }
    }

    // Combinar params con data parseado (params tiene prioridad para GET filters)
    const mergedData = { ...data };
    Object.keys(params).forEach(key => {
      if (key !== 'action' && key !== 'endpoint' && key !== 'data') {
        mergedData[key] = params[key];
      }
    });

    const request = {
      action: params.action || 'GET',
      endpoint: params.endpoint || '/',
      data: mergedData
    };

    console.log('Request recibido:', JSON.stringify(request));
    return handleRequest(request);
  } catch (error) {
    console.error('Error en doGet:', error);
    return errorResponse(String(error));
  }
}

/**
 * doPost se mantiene por compatibilidad pero el frontend
 * ahora usa doGet para evitar problemas de CORS.
 */
function doPost(e) {
  try {
    const contents = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(contents);

    const request = {
      action: body.action || 'POST',
      endpoint: body.endpoint || '/',
      data: body.data || {}
    };

    return handleRequest(request);
  } catch (error) {
    console.error('Error en doPost:', error, error && error.stack);
    return errorResponse(String(error));
  }
}

// =====================================================
// FUNCIONES DE INICIALIZACIÓN
// =====================================================
function initializeDatabase() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    Object.keys(CONFIG.SHEETS).forEach(key => {
      const sheetName = CONFIG.SHEETS[key];
      let sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        const headers = CONFIG.HEADERS[key];
        if (headers) {
          sheet.appendRow(headers);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
          sheet.setFrozenRows(1);
        }
        console.log('Hoja creada: ' + sheetName);
      }
    });

    return 'Base de datos inicializada correctamente';
  } catch (error) {
    console.error('Error:', error);
    return 'Error: ' + error;
  }
}

function createTestData() {
  try {
    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioMesAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    // =====================================================
    // CIUDADES
    // =====================================================
    const ciudadPuno = ciudadRepo.get().create({
      nombre: 'Puno',
      departamento: 'Puno',
      activo: true
    });

    const ciudadJuli = ciudadRepo.get().create({
      nombre: 'Juli',
      departamento: 'Puno',
      activo: true
    });
    console.log('Ciudades creadas: Puno y Juli');

    // =====================================================
    // EDIFICIOS EN PUNO
    // =====================================================
    const edCentral = edificioRepo.get().create({
      ciudadId: ciudadPuno.id,
      nombre: 'Edificio Central',
      descripcion: 'Edificio principal en el centro de Puno, cerca de la plaza',
      direccion: 'Jr. Lima 123',
      totalPisos: 3,
      activo: true
    });

    const edLago = edificioRepo.get().create({
      ciudadId: ciudadPuno.id,
      nombre: 'Residencial del Lago',
      descripcion: 'Vista al lago Titicaca, zona residencial',
      direccion: 'Av. El Sol 456',
      totalPisos: 2,
      activo: true
    });
    console.log('Edificios en Puno creados');

    // =====================================================
    // EDIFICIO EN JULI
    // =====================================================
    const edJuli = edificioRepo.get().create({
      ciudadId: ciudadJuli.id,
      nombre: 'Casa Juli',
      descripcion: 'Propiedad familiar con habitaciones para alquiler',
      direccion: 'Jr. Moquegua 789',
      totalPisos: 2,
      activo: true
    });
    console.log('Edificio en Juli creado');

    // =====================================================
    // PISOS - EDIFICIO CENTRAL (3 pisos)
    // =====================================================
    const pisoCentral1 = pisoRepo.get().create({ edificioId: edCentral.id, numero: 1, descripcion: 'Primer piso - 2 habitaciones' });
    const pisoCentral2 = pisoRepo.get().create({ edificioId: edCentral.id, numero: 2, descripcion: 'Segundo piso - 2 habitaciones' });
    const pisoCentral3 = pisoRepo.get().create({ edificioId: edCentral.id, numero: 3, descripcion: 'Tercer piso - 2 habitaciones' });

    // PISOS - RESIDENCIAL DEL LAGO (2 pisos)
    const pisoLago1 = pisoRepo.get().create({ edificioId: edLago.id, numero: 1, descripcion: 'Primer piso' });
    const pisoLago2 = pisoRepo.get().create({ edificioId: edLago.id, numero: 2, descripcion: 'Segundo piso' });

    // PISOS - CASA JULI (2 pisos)
    const pisoJuli1 = pisoRepo.get().create({ edificioId: edJuli.id, numero: 1, descripcion: 'Planta baja' });
    const pisoJuli2 = pisoRepo.get().create({ edificioId: edJuli.id, numero: 2, descripcion: 'Segundo nivel' });
    console.log('Pisos creados');

    // =====================================================
    // HABITACIONES - EDIFICIO CENTRAL
    // Codigo: Letra del piso (A=1, B=2, C=3) + numero de habitacion
    // =====================================================
    const habC1A = habitacionRepo.get().create({ pisoId: pisoCentral1.id, codigo: 'A1', ubicacion: 'izquierda', montoAlquiler: 200, montoInternet: 25, montoServicios: 10, estado: 'occupied', activo: true });
    const habC1B = habitacionRepo.get().create({ pisoId: pisoCentral1.id, codigo: 'A2', ubicacion: 'derecha', montoAlquiler: 200, montoInternet: 25, montoServicios: 10, estado: 'occupied', activo: true });
    const habC2A = habitacionRepo.get().create({ pisoId: pisoCentral2.id, codigo: 'B1', ubicacion: 'izquierda', montoAlquiler: 220, montoInternet: 25, montoServicios: 10, estado: 'occupied', activo: true });
    const habC2B = habitacionRepo.get().create({ pisoId: pisoCentral2.id, codigo: 'B2', ubicacion: 'derecha', montoAlquiler: 220, montoInternet: 25, montoServicios: 10, estado: 'vacant', activo: true });
    const habC3A = habitacionRepo.get().create({ pisoId: pisoCentral3.id, codigo: 'C1', ubicacion: 'izquierda', montoAlquiler: 250, montoInternet: 25, montoServicios: 10, estado: 'occupied', activo: true });
    const habC3B = habitacionRepo.get().create({ pisoId: pisoCentral3.id, codigo: 'C2', ubicacion: 'derecha', montoAlquiler: 250, montoInternet: 25, montoServicios: 10, estado: 'maintenance', activo: true, observaciones: 'Reparacion de bano' });

    // HABITACIONES - RESIDENCIAL DEL LAGO
    const habL1A = habitacionRepo.get().create({ pisoId: pisoLago1.id, codigo: 'A1', ubicacion: 'izquierda', montoAlquiler: 180, montoInternet: 20, montoServicios: 0, estado: 'occupied', activo: true });
    const habL1B = habitacionRepo.get().create({ pisoId: pisoLago1.id, codigo: 'A2', ubicacion: 'derecha', montoAlquiler: 180, montoInternet: 20, montoServicios: 0, estado: 'vacant', activo: true });
    const habL2A = habitacionRepo.get().create({ pisoId: pisoLago2.id, codigo: 'B1', ubicacion: 'izquierda', montoAlquiler: 200, montoInternet: 20, montoServicios: 0, estado: 'occupied', activo: true });
    const habL2B = habitacionRepo.get().create({ pisoId: pisoLago2.id, codigo: 'B2', ubicacion: 'derecha', montoAlquiler: 200, montoInternet: 20, montoServicios: 0, estado: 'vacant', activo: true });

    // HABITACIONES - CASA JULI
    const habJ1A = habitacionRepo.get().create({ pisoId: pisoJuli1.id, codigo: 'A1', ubicacion: 'izquierda', montoAlquiler: 150, montoInternet: 20, montoServicios: 5, estado: 'occupied', activo: true });
    const habJ1B = habitacionRepo.get().create({ pisoId: pisoJuli1.id, codigo: 'A2', ubicacion: 'derecha', montoAlquiler: 150, montoInternet: 20, montoServicios: 5, estado: 'occupied', activo: true });
    const habJ2A = habitacionRepo.get().create({ pisoId: pisoJuli2.id, codigo: 'B1', ubicacion: 'unica', montoAlquiler: 180, montoInternet: 20, montoServicios: 5, estado: 'vacant', activo: true });
    console.log('Habitaciones creadas: 13 total');

    // =====================================================
    // INQUILINOS
    // =====================================================
    // Edificio Central
    const inq1 = inquilinoRepo.get().create({ habitacionId: habC1A.id, nombre: 'Juan Carlos', apellido: 'Perez Mamani', dni: '70123456', telefono: '951234567', email: 'jperez@email.com', fechaIngreso: '2024-06-15', estado: 'activo', contactoEmergencia: 'Maria Perez', telefonoEmergencia: '951111111' });
    const inq2 = inquilinoRepo.get().create({ habitacionId: habC1B.id, nombre: 'Maria Elena', apellido: 'Quispe Flores', dni: '70234567', telefono: '952345678', email: 'mquispe@email.com', fechaIngreso: '2024-08-01', estado: 'activo' });
    const inq3 = inquilinoRepo.get().create({ habitacionId: habC2A.id, nombre: 'Roberto', apellido: 'Condori Huanca', dni: '70345678', telefono: '953456789', fechaIngreso: '2024-03-10', estado: 'activo' });
    const inq4 = inquilinoRepo.get().create({ habitacionId: habC3A.id, nombre: 'Ana Lucia', apellido: 'Mendoza Vargas', dni: '70456789', telefono: '954567890', email: 'amendoza@email.com', fechaIngreso: '2024-11-01', estado: 'activo' });

    // Residencial del Lago
    const inq5 = inquilinoRepo.get().create({ habitacionId: habL1A.id, nombre: 'Pedro', apellido: 'Gutierrez Apaza', dni: '70567890', telefono: '955678901', fechaIngreso: '2024-07-20', estado: 'activo' });
    const inq6 = inquilinoRepo.get().create({ habitacionId: habL2A.id, nombre: 'Carmen Rosa', apellido: 'Choque Mamani', dni: '70678901', telefono: '956789012', email: 'cchoque@email.com', fechaIngreso: '2024-09-15', estado: 'activo' });

    // Casa Juli
    const inq7 = inquilinoRepo.get().create({ habitacionId: habJ1A.id, nombre: 'Luis Alberto', apellido: 'Vilca Ramos', dni: '70789012', telefono: '957890123', fechaIngreso: '2024-04-01', estado: 'activo' });
    const inq8 = inquilinoRepo.get().create({ habitacionId: habJ1B.id, nombre: 'Rosario', apellido: 'Ccama Ticona', dni: '70890123', telefono: '958901234', email: 'rccama@email.com', fechaIngreso: '2024-10-01', estado: 'activo' });
    console.log('Inquilinos creados: 8 activos');

    // =====================================================
    // PAGOS - MES ACTUAL
    // =====================================================
    // Edificio Central - Mes actual
    const fechaActual = new Date(anioActual, mesActual - 1, 15).toISOString(); // Dia 15 del mes
    const fechaAnterior = new Date(anioMesAnterior, mesAnterior - 1, 15).toISOString();

    pagoRepo.get().create({ inquilinoId: inq1.id, habitacionId: habC1A.id, fecha: fechaActual, mes: mesActual, anio: anioActual, concepto: 'alquiler', monto: 200, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq1.id, habitacionId: habC1A.id, fecha: fechaActual, mes: mesActual, anio: anioActual, concepto: 'internet', monto: 25, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq2.id, habitacionId: habC1B.id, fecha: new Date(anioActual, mesActual - 1, 1).toISOString(), mes: mesActual, anio: anioActual, concepto: 'alquiler', monto: 200, metodoPago: 'yape', estado: 'pagado', referencia: 'YP-123456' });
    // inq3 (2A) - NO ha pagado este mes (pendiente)
    pagoRepo.get().create({ inquilinoId: inq4.id, habitacionId: habC3A.id, fecha: new Date(anioActual, mesActual - 1, 1).toISOString(), mes: mesActual, anio: anioActual, concepto: 'alquiler', monto: 250, metodoPago: 'transferencia', estado: 'pagado', referencia: 'BCP-789012' });
    pagoRepo.get().create({ inquilinoId: inq4.id, habitacionId: habC3A.id, fecha: new Date(anioActual, mesActual - 1, 1).toISOString(), mes: mesActual, anio: anioActual, concepto: 'internet', monto: 25, metodoPago: 'transferencia', estado: 'pagado', referencia: 'BCP-789013' });

    // Residencial del Lago - Mes actual
    pagoRepo.get().create({ inquilinoId: inq5.id, habitacionId: habL1A.id, fecha: new Date(anioActual, mesActual - 1, 20).toISOString(), mes: mesActual, anio: anioActual, concepto: 'alquiler', monto: 180, metodoPago: 'plin', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq6.id, habitacionId: habL2A.id, fecha: new Date(anioActual, mesActual - 1, 15).toISOString(), mes: mesActual, anio: anioActual, concepto: 'alquiler', monto: 200, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq6.id, habitacionId: habL2A.id, fecha: new Date(anioActual, mesActual - 1, 15).toISOString(), mes: mesActual, anio: anioActual, concepto: 'internet', monto: 20, metodoPago: 'efectivo', estado: 'pagado' });

    // Casa Juli - Mes actual
    pagoRepo.get().create({ inquilinoId: inq7.id, habitacionId: habJ1A.id, fecha: new Date(anioActual, mesActual - 1, 1).toISOString(), mes: mesActual, anio: anioActual, concepto: 'alquiler', monto: 150, metodoPago: 'efectivo', estado: 'pagado' });
    // inq8 (J1B) - NO ha pagado este mes (pendiente)

    // =====================================================
    // PAGOS - MES ANTERIOR (historico)
    // =====================================================
    pagoRepo.get().create({ inquilinoId: inq1.id, habitacionId: habC1A.id, fecha: fechaAnterior, mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 200, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq1.id, habitacionId: habC1A.id, fecha: fechaAnterior, mes: mesAnterior, anio: anioMesAnterior, concepto: 'internet', monto: 25, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq2.id, habitacionId: habC1B.id, fecha: new Date(anioMesAnterior, mesAnterior - 1, 1).toISOString(), mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 200, metodoPago: 'yape', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq3.id, habitacionId: habC2A.id, fecha: new Date(anioMesAnterior, mesAnterior - 1, 10).toISOString(), mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 220, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq5.id, habitacionId: habL1A.id, fecha: new Date(anioMesAnterior, mesAnterior - 1, 20).toISOString(), mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 180, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq6.id, habitacionId: habL2A.id, fecha: new Date(anioMesAnterior, mesAnterior - 1, 15).toISOString(), mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 200, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq7.id, habitacionId: habJ1A.id, fecha: new Date(anioMesAnterior, mesAnterior - 1, 1).toISOString(), mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 150, metodoPago: 'efectivo', estado: 'pagado' });
    pagoRepo.get().create({ inquilinoId: inq8.id, habitacionId: habJ1B.id, fecha: new Date(anioMesAnterior, mesAnterior - 1, 1).toISOString(), mes: mesAnterior, anio: anioMesAnterior, concepto: 'alquiler', monto: 150, metodoPago: 'yape', estado: 'pagado' });
    console.log('Pagos creados: mes actual y anterior');

    // =====================================================
    // GASTOS
    // =====================================================
    // Edificio Central
    gastoRepo.get().create({ edificioId: edCentral.id, fecha: new Date().toISOString(), concepto: 'Limpieza areas comunes', categoria: 'limpieza', monto: 80 });
    gastoRepo.get().create({ edificioId: edCentral.id, fecha: new Date().toISOString(), concepto: 'Reparacion puerta principal', categoria: 'reparacion', monto: 150 });
    gastoRepo.get().create({ edificioId: edCentral.id, fecha: new Date().toISOString(), concepto: 'Recibo de luz areas comunes', categoria: 'servicios', monto: 45 });

    // Residencial del Lago
    gastoRepo.get().create({ edificioId: edLago.id, fecha: new Date().toISOString(), concepto: 'Mantenimiento jardin', categoria: 'mantenimiento', monto: 60 });
    gastoRepo.get().create({ edificioId: edLago.id, fecha: new Date().toISOString(), concepto: 'Limpieza mensual', categoria: 'limpieza', monto: 50 });

    // Casa Juli
    gastoRepo.get().create({ edificioId: edJuli.id, fecha: new Date().toISOString(), concepto: 'Pintura exterior', categoria: 'mantenimiento', monto: 200 });
    gastoRepo.get().create({ edificioId: edJuli.id, fecha: new Date().toISOString(), concepto: 'Limpieza', categoria: 'limpieza', monto: 40 });
    console.log('Gastos creados');

    // =====================================================
    // GASTOS FIJOS
    // =====================================================
    // Edificio Central
    gastoFijoRepo.get().create({ edificioId: edCentral.id, tipo: 'agua', descripcion: 'Recibo de agua SEDAPAL', monto: 85, diaVencimiento: 15, activo: true });
    gastoFijoRepo.get().create({ edificioId: edCentral.id, tipo: 'luz', descripcion: 'Recibo de luz Electro Puno', monto: 120, diaVencimiento: 20, activo: true });
    gastoFijoRepo.get().create({ edificioId: edCentral.id, tipo: 'internet', descripcion: 'Internet Movistar Fibra', monto: 89, diaVencimiento: 5, activo: true });
    gastoFijoRepo.get().create({ edificioId: edCentral.id, tipo: 'limpieza', descripcion: 'Servicio limpieza semanal', monto: 200, diaVencimiento: 1, activo: true });

    // Residencial del Lago
    gastoFijoRepo.get().create({ edificioId: edLago.id, tipo: 'agua', descripcion: 'Agua potable', monto: 60, diaVencimiento: 15, activo: true });
    gastoFijoRepo.get().create({ edificioId: edLago.id, tipo: 'luz', descripcion: 'Luz electrica', monto: 75, diaVencimiento: 18, activo: true });
    gastoFijoRepo.get().create({ edificioId: edLago.id, tipo: 'internet', descripcion: 'Internet Claro', monto: 69, diaVencimiento: 10, activo: true });

    // Casa Juli
    gastoFijoRepo.get().create({ edificioId: edJuli.id, tipo: 'agua', descripcion: 'Agua - EPS Juli', monto: 45, diaVencimiento: 12, activo: true });
    gastoFijoRepo.get().create({ edificioId: edJuli.id, tipo: 'luz', descripcion: 'Luz electrica', monto: 55, diaVencimiento: 22, activo: true });
    gastoFijoRepo.get().create({ edificioId: edJuli.id, tipo: 'internet', descripcion: 'Internet Bitel', monto: 50, diaVencimiento: 8, activo: true });
    console.log('Gastos fijos creados');

    // =====================================================
    // RESUMEN
    // =====================================================
    const resumen = `
DATOS DE PRUEBA CREADOS:
========================
- 2 Ciudades: Puno, Juli
- 3 Edificios: Edificio Central (Puno), Residencial del Lago (Puno), Casa Juli (Juli)
- 7 Pisos en total
- 13 Habitaciones (8 ocupadas, 4 vacantes, 1 en mantenimiento)
- 8 Inquilinos activos
- 18 Pagos (mes actual y anterior)
- 7 Gastos varios
- 10 Gastos fijos configurados

INQUILINOS PENDIENTES DE PAGO (mes actual):
- Roberto Condori (Hab B1 - Ed. Central) - S/220
- Rosario Ccama (Hab A2 - Casa Juli) - S/150
`;
    console.log(resumen);
    return resumen;

  } catch (error) {
    console.error('Error:', error);
    return 'Error: ' + error;
  }
}

// =====================================================
// RESUMEN SEMANAL DE COBRANZA (correo del domingo)
// =====================================================

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Arma el detalle de cobranza de la semana que contiene fechaBase.
 * Ventana: domingo a sabado. Devuelve dos listas excluyentes:
 *  - venceSemana: el dia de pago cae dentro de la ventana y el alquiler no esta pagado
 *  - vencidos: el dia de pago del mes en curso ya paso y sigue impago
 *
 * El dia de pago se deriva de fechaIngreso, igual que en getHabitacionesConEstadoPago.
 */
function getResumenSemanal(fechaBase) {
  const base = fechaBase ? new Date(fechaBase) : new Date();
  const hoy = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  // Domingo de la semana en curso
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - hoy.getDay());
  const dias = [];
  for (let i = 0; i < 7; i++) {
    dias.push(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
  }
  const fin = dias[6];

  const indice = construirIndiceUbicaciones();
  const inquilinos = inquilinoRepo.get().getAll().filter(i => i.estado === 'activo');
  const pagos = pagoRepo.get().getAll();

  const alquilerPagado = function (habitacionId, mes, anio) {
    return pagos.some(p =>
      p.habitacionId === habitacionId &&
      Number(p.mes) === mes &&
      Number(p.anio) === anio &&
      p.concepto === 'alquiler' &&
      p.estado === 'pagado'
    );
  };

  const venceSemana = [];
  const vencidos = [];

  inquilinos.forEach(inq => {
    // El dia se lee del string ISO, no con getDate(): ver partesDeFecha()
    const diaPago = diaDeFecha(inq.fechaIngreso);
    if (!diaPago) return;

    const ubic = indice[inq.habitacionId];
    if (!ubic || ubic.estado !== 'occupied') return;

    const fila = {
      inquilinoId: inq.id,
      nombre: (inq.nombre + ' ' + inq.apellido).trim(),
      telefono: inq.telefono || '',
      habitacionId: inq.habitacionId,
      codigo: ubic.codigo,
      pisoNumero: ubic.pisoNumero,
      edificio: ubic.edificioNombre || 'Sin edificio',
      ciudad: ubic.ciudadNombre || 'Sin ciudad',
      diaPago: diaPago,
      monto: Number(ubic.montoAlquiler || 0)
    };

    // 1. Vence dentro de la ventana de esta semana
    let diaEnVentana = null;
    for (let i = 0; i < dias.length; i++) {
      if (dias[i].getDate() === diaPago) { diaEnVentana = dias[i]; break; }
    }
    if (diaEnVentana) {
      const mes = diaEnVentana.getMonth() + 1;
      const anio = diaEnVentana.getFullYear();
      if (!alquilerPagado(inq.habitacionId, mes, anio)) {
        fila.mes = mes;
        fila.anio = anio;
        fila.fechaVencimiento = diaEnVentana;
        venceSemana.push(fila);
      }
      return; // ya clasificado, no puede estar tambien en vencidos
    }

    // 2. Vencido: el dia de pago del mes en curso ya paso y sigue impago.
    // Se acota al ultimo dia del mes para los dias 29-31 en meses cortos.
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    const ultimoDiaDelMes = new Date(anioActual, mesActual, 0).getDate();
    const diaEfectivo = Math.min(diaPago, ultimoDiaDelMes);

    if (diaEfectivo < hoy.getDate() && !alquilerPagado(inq.habitacionId, mesActual, anioActual)) {
      fila.mes = mesActual;
      fila.anio = anioActual;
      fila.diasAtraso = hoy.getDate() - diaEfectivo;
      vencidos.push(fila);
    }
  });

  const porDia = (a, b) => a.diaPago - b.diaPago;
  venceSemana.sort(porDia);
  vencidos.sort((a, b) => b.diasAtraso - a.diasAtraso);

  const sumar = lista => lista.reduce((s, f) => s + f.monto, 0);

  return {
    inicio: inicio,
    fin: fin,
    venceSemana: venceSemana,
    vencidos: vencidos,
    totalSemana: sumar(venceSemana),
    totalVencido: sumar(vencidos),
    totalGeneral: sumar(venceSemana) + sumar(vencidos)
  };
}

/** Agrupa filas por ciudad y edificio, preservando el orden de llegada. */
function agruparPorCiudadEdificio(filas) {
  const grupos = [];
  const indiceGrupo = {};
  filas.forEach(f => {
    const clave = f.ciudad + '||' + f.edificio;
    if (indiceGrupo[clave] === undefined) {
      indiceGrupo[clave] = grupos.length;
      grupos.push({ ciudad: f.ciudad, edificio: f.edificio, filas: [], total: 0 });
    }
    const g = grupos[indiceGrupo[clave]];
    g.filas.push(f);
    g.total += f.monto;
  });
  return grupos;
}

function formatearSolesGs(monto) {
  return 'S/ ' + Number(monto || 0).toFixed(2);
}

function escaparHtml(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function seccionHtmlResumen(titulo, color, filas, mostrarAtraso) {
  if (!filas.length) {
    return '<h2 style="font:600 15px system-ui,sans-serif;color:#334155;margin:24px 0 8px">' +
      escaparHtml(titulo) + '</h2>' +
      '<p style="font:14px system-ui,sans-serif;color:#64748b;margin:0">Sin casos.</p>';
  }

  let html = '<h2 style="font:600 15px system-ui,sans-serif;color:' + color + ';margin:24px 0 8px">' +
    escaparHtml(titulo) + ' (' + filas.length + ')</h2>';

  agruparPorCiudadEdificio(filas).forEach(g => {
    html += '<p style="font:600 13px system-ui,sans-serif;color:#475569;margin:14px 0 6px">' +
      escaparHtml(g.ciudad) + ' &middot; ' + escaparHtml(g.edificio) +
      ' <span style="font-weight:400;color:#94a3b8">— ' + formatearSolesGs(g.total) + '</span></p>';

    html += '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;' +
      'font:13px system-ui,sans-serif;color:#0f172a">';
    html += '<tr style="background:#f1f5f9;color:#475569;text-align:left">' +
      '<th>Hab.</th><th>Inquilino</th><th>Telefono</th><th>' +
      (mostrarAtraso ? 'Atraso' : 'Dia') + '</th><th style="text-align:right">Monto</th></tr>';

    g.filas.forEach(f => {
      const piso = f.pisoNumero !== null && f.pisoNumero !== undefined ? ' <span style="color:#94a3b8">P' + f.pisoNumero + '</span>' : '';
      const cuarta = mostrarAtraso
        ? f.diasAtraso + (f.diasAtraso === 1 ? ' dia' : ' dias')
        : 'dia ' + f.diaPago;
      html += '<tr style="border-top:1px solid #e2e8f0">' +
        '<td><strong>' + escaparHtml(f.codigo) + '</strong>' + piso + '</td>' +
        '<td>' + escaparHtml(f.nombre) + '</td>' +
        '<td>' + escaparHtml(f.telefono) + '</td>' +
        '<td>' + escaparHtml(cuarta) + '</td>' +
        '<td style="text-align:right">' + formatearSolesGs(f.monto) + '</td>' +
        '</tr>';
    });
    html += '</table>';
  });

  return html;
}

function construirHtmlResumenSemanal(r) {
  const rango = r.inicio.getDate() + ' al ' + r.fin.getDate() + ' de ' + MESES_ES[r.fin.getMonth()];

  let html = '<div style="max-width:640px;margin:0 auto;padding:16px">';
  html += '<h1 style="font:700 19px system-ui,sans-serif;color:#4f46e5;margin:0 0 4px">Cobranza de la semana</h1>';
  html += '<p style="font:14px system-ui,sans-serif;color:#64748b;margin:0 0 4px">' + escaparHtml(rango) + '</p>';

  if (!r.venceSemana.length && !r.vencidos.length) {
    html += '<p style="font:15px system-ui,sans-serif;color:#059669;margin:20px 0">' +
      'No hay cobros pendientes esta semana ni atrasos arrastrados. Semana limpia.</p>';
  } else {
    html += '<p style="font:600 16px system-ui,sans-serif;color:#0f172a;margin:8px 0 0">Total a cobrar: ' +
      formatearSolesGs(r.totalGeneral) + '</p>';
    html += seccionHtmlResumen('Vencen esta semana', '#b45309', r.venceSemana, false);
    html += seccionHtmlResumen('Vencidos sin pagar', '#b91c1c', r.vencidos, true);
  }

  html += '<p style="font:12px system-ui,sans-serif;color:#94a3b8;margin:28px 0 0;' +
    'border-top:1px solid #e2e8f0;padding-top:12px">Sistema de Alquileres Puno / Juli &middot; ' +
    'enviado automaticamente los domingos</p>';
  html += '</div>';
  return html;
}

/**
 * Envia el resumen semanal a los correos de CONFIG.ADMIN_EMAILS.
 * Se dispara solo los domingos, y tambien puede correrse a mano desde el menu.
 * Si no hay nada pendiente manda igual un correo corto: el silencio no debe
 * confundirse con un disparador caido.
 */
function enviarResumenSemanal() {
  try {
    const r = getResumenSemanal(new Date());
    const rango = r.inicio.getDate() + ' al ' + r.fin.getDate() + ' de ' + MESES_ES[r.fin.getMonth()];
    const pendientes = r.venceSemana.length + r.vencidos.length;

    const asunto = pendientes > 0
      ? 'Alquileres · Cobros semana del ' + rango + ' — ' + formatearSolesGs(r.totalGeneral)
      : 'Alquileres · Semana del ' + rango + ' sin cobros pendientes';

    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAILS.join(','),
      subject: asunto,
      htmlBody: construirHtmlResumenSemanal(r)
    });

    const msg = 'Resumen enviado a ' + CONFIG.ADMIN_EMAILS.join(', ') +
      ' (' + r.venceSemana.length + ' vencen, ' + r.vencidos.length + ' vencidos)';
    console.log(msg);
    return msg;
  } catch (error) {
    console.error('Error enviando resumen semanal:', error);
    return 'Error: ' + error;
  }
}

const TRIGGER_RESUMEN = 'enviarResumenSemanal';

/**
 * Crea el disparador de los domingos entre 7 y 8 AM (hora del script, America/Lima).
 * Borra primero los existentes del mismo handler para no acumular duplicados
 * si se ejecuta mas de una vez.
 */
function instalarTriggerSemanal() {
  desactivarTriggerSemanal();
  ScriptApp.newTrigger(TRIGGER_RESUMEN)
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(7)
    .create();

  const msg = 'Aviso semanal activado: domingos entre 7 y 8 AM, a ' + CONFIG.ADMIN_EMAILS.join(' y ');
  try {
    SpreadsheetApp.getUi().alert('Aviso semanal', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) { /* ejecutado desde el editor, sin UI */ }
  return msg;
}

function desactivarTriggerSemanal() {
  let borrados = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === TRIGGER_RESUMEN) {
      ScriptApp.deleteTrigger(t);
      borrados++;
    }
  });
  return 'Disparadores eliminados: ' + borrados;
}

function enviarResumenSemanalPrueba() {
  const msg = enviarResumenSemanal();
  try {
    SpreadsheetApp.getUi().alert('Resumen de prueba', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) { /* sin UI */ }
  return msg;
}

// =====================================================
// MENÚ EN GOOGLE SHEETS
// =====================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Sistema Alquiler')
    .addItem('Inicializar Base de Datos', 'initializeDatabase')
    .addItem('Migrar Headers (agregar columnas nuevas)', 'migrateSheets')
    .addItem('Crear Datos de Prueba', 'createTestData')
    .addSeparator()
    .addItem('Activar aviso semanal (domingos 7 AM)', 'instalarTriggerSemanal')
    .addItem('Enviar resumen ahora (prueba)', 'enviarResumenSemanalPrueba')
    .addItem('Desactivar aviso semanal', 'desactivarTriggerSemanal')
    .addSeparator()
    .addItem('Ver URL del API', 'showApiUrl')
    .addToUi();
}

function showApiUrl() {
  const url = ScriptApp.getService().getUrl();
  const ui = SpreadsheetApp.getUi();
  ui.alert('URL del API', url || 'Primero debes hacer un deployment como Web App', ui.ButtonSet.OK);
}

/**
 * Fuerza la migracion de headers en todas las hojas.
 * Util cuando se agregan columnas nuevas al CONFIG.HEADERS
 * (ej. Garantia, LlaveHabitacion, LlavePuertaCalle en Inquilinos).
 * Ejecutar desde el menu "Sistema Alquiler" o desde el editor de Apps Script.
 */
function migrateSheets() {
  try {
    const repos = [
      { name: 'Ciudades', repo: ciudadRepo },
      { name: 'Edificios', repo: edificioRepo },
      { name: 'Pisos', repo: pisoRepo },
      { name: 'Habitaciones', repo: habitacionRepo },
      { name: 'Inquilinos', repo: inquilinoRepo },
      { name: 'Pagos', repo: pagoRepo },
      { name: 'Gastos', repo: gastoRepo },
      { name: 'GastosFijos', repo: gastoFijoRepo },
    ];
    const updated = [];
    repos.forEach(r => {
      try {
        r.repo.get().getSheet(); // getSheet() ya aplica la migracion automatica
        updated.push(r.name);
      } catch (e) {
        console.error('Error migrando ' + r.name + ':', e);
      }
    });
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Migracion completa',
      'Headers actualizados en:\n' + updated.join(', ') +
      '\n\nLas columnas nuevas (Garantia, LlaveHabitacion, LlavePuertaCalle) ya estan disponibles.' +
      '\nNo es necesario re-deploy: el backend ya usa los nuevos campos.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    console.error('Error en migrateSheets:', error);
    SpreadsheetApp.getUi().alert('Error', String(error), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
