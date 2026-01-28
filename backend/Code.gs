// =====================================================
// SISTEMA DE ALQUILER - API REST
// Google Apps Script Backend
// =====================================================

// =====================================================
// CONFIGURACIÓN
// =====================================================
const CONFIG = {
  // IMPORTANTE: Cambia este ID por el de tu Google Spreadsheet
  SPREADSHEET_ID: '1ugfqN_1yjbIjR_IB-oUR66gX0lbQemGpu0-cF39-m6E',

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
    INQUILINOS: ['ID', 'HabitacionId', 'Nombre', 'Apellido', 'DNI', 'Telefono', 'Email', 'FechaIngreso', 'FechaSalida', 'Estado', 'ContactoEmergencia', 'TelefonoEmergencia', 'Observaciones'],
    PAGOS: ['ID', 'InquilinoId', 'HabitacionId', 'Fecha', 'Mes', 'Anio', 'Concepto', 'Monto', 'MetodoPago', 'Referencia', 'Estado', 'Observaciones'],
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
    }
    return sheet;
  }

  getAllData() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    return sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
  }

  rowToObject(row) {
    const obj = {};
    this.headers.forEach((header, index) => {
      // Convertir header a camelCase: "ID" -> "id", "CiudadId" -> "ciudadId"
      const key = header === 'ID' ? 'id' : header.charAt(0).toLowerCase() + header.slice(1);
      let value = row[index];
      if (value instanceof Date) {
        value = value.toISOString();
      }
      obj[key] = value;
    });
    return obj;
  }

  objectToRow(obj) {
    return this.headers.map(header => {
      // Convertir header a camelCase: "ID" -> "id", "CiudadId" -> "ciudadId"
      const key = header === 'ID' ? 'id' : header.charAt(0).toLowerCase() + header.slice(1);
      const value = obj[key];
      if (typeof value === 'string' && header.toLowerCase().includes('fecha')) {
        return new Date(value);
      }
      return value !== undefined ? value : '';
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

    // Calcular el dia de pago basado en la fecha de ingreso del inquilino
    let diaPago = null;
    let fechaIngreso = null;
    if (inquilino && inquilino.fechaIngreso) {
      fechaIngreso = inquilino.fechaIngreso;
      const fechaIngresoDate = new Date(inquilino.fechaIngreso);
      diaPago = fechaIngresoDate.getDate(); // Dia del mes (1-31)
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
    const fecha = new Date(g.fecha);
    const matchesMes = (fecha.getMonth() + 1) == mes && fecha.getFullYear() == anio;
    const matchesEdificio = !edificioId || g.edificioId === edificioId;
    return matchesMes && matchesEdificio;
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
    const fecha = new Date(g.fecha);
    const matchesMes = (fecha.getMonth() + 1) == mes && fecha.getFullYear() == anio;
    const matchesEdificio = !edificioIds || edificioIds.includes(g.edificioId);
    return matchesMes && matchesEdificio;
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
// ROUTER PRINCIPAL
// =====================================================
function handleRequest(request) {
  const { action, endpoint, data } = request;

  try {
    const parts = endpoint.split('/').filter(p => p && p !== 'api');
    const resource = parts[0];
    const id = parts[1];
    const subResource = parts[2];
    const params = data || {};

    // Log para debug
    console.log('Request:', action, endpoint, JSON.stringify(params));

    switch (resource) {
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
          return ciudadRepo.get().delete(id) ? successResponse(null, 'Eliminada') : errorResponse('No encontrada');
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
          return edificioRepo.get().delete(id) ? successResponse(null, 'Eliminado') : errorResponse('No encontrado');
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
          return pisoRepo.get().delete(id) ? successResponse(null, 'Eliminado') : errorResponse('No encontrado');
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
          return habitacionRepo.get().delete(id) ? successResponse(null, 'Eliminada') : errorResponse('No encontrada');
        }
        break;

      // ------------------- INQUILINOS -------------------
      case 'inquilinos':
        if (action === 'GET') {
          if (id === 'habitacion' && subResource) {
            const inquilinos = inquilinoRepo.get().getByField('habitacionId', subResource);
            const activo = inquilinos.find(i => i.estado === 'activo');
            return successResponse(activo || null);
          }
          if (id) {
            return successResponse(inquilinoRepo.get().getById(id));
          }
          if (params.activos === true || params.activos === 'true') {
            return successResponse(inquilinoRepo.get().getByField('estado', 'activo'));
          }
          return successResponse(inquilinoRepo.get().getAll());
        }
        if (action === 'POST') {
          const newInq = inquilinoRepo.get().create({
            ...params,
            fechaIngreso: params.fechaIngreso || new Date().toISOString(),
            estado: 'activo'
          });
          // Actualizar habitación a ocupada
          if (params.habitacionId) {
            habitacionRepo.get().update(params.habitacionId, { estado: 'occupied' });
          }
          return successResponse(newInq, 'Inquilino registrado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          return successResponse(inquilinoRepo.get().update(id, params));
        }
        if (action === 'DELETE') {
          if (!id) return errorResponse('ID requerido');
          const inq = inquilinoRepo.get().getById(id);
          if (inq && inq.habitacionId) {
            habitacionRepo.get().update(inq.habitacionId, { estado: 'vacant' });
          }
          return inquilinoRepo.get().delete(id) ? successResponse(null, 'Eliminado') : errorResponse('No encontrado');
        }
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
          return successResponse(pagoRepo.get().getAll());
        }
        if (action === 'POST') {
          if (id === 'reset-mes') {
            return successResponse({ affected: 0 }, 'Reset completado');
          }
          const newPago = pagoRepo.get().create({
            ...params,
            fecha: params.fecha || new Date().toISOString(),
            estado: 'pagado'
          });
          return successResponse(newPago, 'Pago registrado');
        }
        if (action === 'PUT') {
          if (!id) return errorResponse('ID requerido');
          return successResponse(pagoRepo.get().update(id, params));
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
            const gastos = gastoRepo.get().getAll().filter(g => {
              const fecha = new Date(g.fecha);
              return (fecha.getMonth() + 1) == params.mes && fecha.getFullYear() == params.anio;
            });
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
          let gastos = gastoRepo.get().getAll().filter(g => {
            const fecha = new Date(g.fecha);
            return (fecha.getMonth() + 1) == mes && fecha.getFullYear() == anio;
          });

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
            let gastosH = gastoRepo.get().getAll().filter(g => {
              const fecha = new Date(g.fecha);
              return (fecha.getMonth() + 1) == m && fecha.getFullYear() == a;
            });

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
    console.error('Error en handleRequest:', error);
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
    const body = JSON.parse(e.postData?.contents || '{}');

    const request = {
      action: body.action || 'POST',
      endpoint: body.endpoint || '/',
      data: body.data || {}
    };

    return handleRequest(request);
  } catch (error) {
    console.error('Error en doPost:', error);
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
// MENÚ EN GOOGLE SHEETS
// =====================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Sistema Alquiler')
    .addItem('Inicializar Base de Datos', 'initializeDatabase')
    .addItem('Crear Datos de Prueba', 'createTestData')
    .addSeparator()
    .addItem('Ver URL del API', 'showApiUrl')
    .addToUi();
}

function showApiUrl() {
  const url = ScriptApp.getService().getUrl();
  const ui = SpreadsheetApp.getUi();
  ui.alert('URL del API', url || 'Primero debes hacer un deployment como Web App', ui.ButtonSet.OK);
}
