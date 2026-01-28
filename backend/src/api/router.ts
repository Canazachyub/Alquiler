// Router principal de la API

function handleRequest(request: ApiRequest): GoogleAppsScript.Content.TextOutput {
  const { action, endpoint, data } = request;

  try {
    // Parsear endpoint
    const parts = endpoint.split('/').filter((p) => p && p !== 'api');
    const resource = parts[0];
    const id = parts[1];
    const subResource = parts[2];

    switch (resource) {
      case 'ciudades':
        return handleCiudades(action, id, data);

      case 'edificios':
        return handleEdificios(action, id, data);

      case 'pisos':
        return handlePisos(action, id, data);

      case 'habitaciones':
        return handleHabitaciones(action, id, subResource, data);

      case 'inquilinos':
        return handleInquilinos(action, id, subResource, data);

      case 'pagos':
        return handlePagos(action, id, subResource, data);

      case 'gastos':
        return handleGastos(action, id, data);

      case 'reportes':
        return handleReportes(id, data);

      default:
        return errorResponse(`Recurso no encontrado: ${resource}`);
    }
  } catch (error) {
    console.error('Error en handleRequest:', error);
    return errorResponse(String(error));
  }
}

// Handler para Ciudades
function handleCiudades(
  action: string,
  id: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  switch (action) {
    case 'GET':
      if (id) {
        const ciudad = ciudadRepository.getById<Ciudad>(id);
        return ciudad ? successResponse(ciudad) : errorResponse('Ciudad no encontrada');
      }
      return successResponse(ciudadRepository.getAll<Ciudad>());

    case 'POST':
      const newCiudad = ciudadRepository.create<Ciudad>(data as Record<string, unknown>);
      return successResponse(newCiudad, 'Ciudad creada');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');
      const updated = ciudadRepository.update<Ciudad>(id, data as Record<string, unknown>);
      return updated ? successResponse(updated, 'Ciudad actualizada') : errorResponse('Ciudad no encontrada');

    case 'DELETE':
      if (!id) return errorResponse('ID requerido');
      const deleted = ciudadRepository.delete(id);
      return deleted ? successResponse(null, 'Ciudad eliminada') : errorResponse('Ciudad no encontrada');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Edificios
function handleEdificios(
  action: string,
  id: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const params = data as Record<string, unknown>;

  switch (action) {
    case 'GET':
      if (id) {
        const edificio = edificioRepository.getById<Edificio>(id);
        return edificio ? successResponse(edificio) : errorResponse('Edificio no encontrado');
      }
      if (params?.ciudadId) {
        return successResponse(edificioRepository.getByCiudad(params.ciudadId as string));
      }
      return successResponse(edificioRepository.getAll<Edificio>());

    case 'POST':
      const newEdificio = edificioRepository.create<Edificio>(params);
      return successResponse(newEdificio, 'Edificio creado');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');
      const updated = edificioRepository.update<Edificio>(id, params);
      return updated ? successResponse(updated) : errorResponse('Edificio no encontrado');

    case 'DELETE':
      if (!id) return errorResponse('ID requerido');
      return edificioRepository.delete(id)
        ? successResponse(null, 'Edificio eliminado')
        : errorResponse('Edificio no encontrado');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Pisos
function handlePisos(
  action: string,
  id: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const pisoRepo = new BaseRepository(CONFIG.SHEETS.PISOS, CONFIG.HEADERS.PISOS);
  const params = data as Record<string, unknown>;

  switch (action) {
    case 'GET':
      if (id) {
        const piso = pisoRepo.getById<Piso>(id);
        return piso ? successResponse(piso) : errorResponse('Piso no encontrado');
      }
      if (params?.edificioId) {
        return successResponse(pisoRepo.getByField<Piso>('edificioId', params.edificioId));
      }
      return successResponse(pisoRepo.getAll<Piso>());

    case 'POST':
      const newPiso = pisoRepo.create<Piso>(params);
      return successResponse(newPiso, 'Piso creado');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');
      const updated = pisoRepo.update<Piso>(id, params);
      return updated ? successResponse(updated) : errorResponse('Piso no encontrado');

    case 'DELETE':
      if (!id) return errorResponse('ID requerido');
      return pisoRepo.delete(id)
        ? successResponse(null, 'Piso eliminado')
        : errorResponse('Piso no encontrado');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Habitaciones
function handleHabitaciones(
  action: string,
  id: string | undefined,
  subResource: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const params = data as Record<string, unknown>;

  switch (action) {
    case 'GET':
      // GET /habitaciones/estado-pago?mes=X&anio=Y
      if (id === 'estado-pago') {
        const mes = Number(params?.mes) || new Date().getMonth() + 1;
        const anio = Number(params?.anio) || new Date().getFullYear();
        return successResponse(habitacionRepository.getConEstadoPago(mes, anio));
      }

      if (id) {
        const hab = habitacionRepository.getById<Habitacion>(id);
        return hab ? successResponse(hab) : errorResponse('Habitación no encontrada');
      }

      if (params?.pisoId) {
        return successResponse(habitacionRepository.getByPiso(params.pisoId as string));
      }
      if (params?.estado) {
        return successResponse(habitacionRepository.getByEstado(params.estado as string));
      }

      return successResponse(habitacionRepository.getAll<Habitacion>());

    case 'POST':
      const newHab = habitacionRepository.create<Habitacion>(params);
      return successResponse(newHab, 'Habitación creada');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');

      // PUT /habitaciones/:id/estado
      if (subResource === 'estado' && params?.estado) {
        const updated = habitacionRepository.updateEstado(id, params.estado as string);
        return updated ? successResponse(updated) : errorResponse('Habitación no encontrada');
      }

      const updated = habitacionRepository.update<Habitacion>(id, params);
      return updated ? successResponse(updated) : errorResponse('Habitación no encontrada');

    case 'DELETE':
      if (!id) return errorResponse('ID requerido');
      return habitacionRepository.delete(id)
        ? successResponse(null, 'Habitación eliminada')
        : errorResponse('Habitación no encontrada');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Inquilinos
function handleInquilinos(
  action: string,
  id: string | undefined,
  subResource: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const params = data as Record<string, unknown>;

  switch (action) {
    case 'GET':
      // GET /inquilinos/habitacion/:habitacionId
      if (id === 'habitacion' && subResource) {
        const inquilino = inquilinoRepository.getByHabitacion(subResource);
        return successResponse(inquilino);
      }

      if (id) {
        const inq = inquilinoRepository.getById<Inquilino>(id);
        return inq ? successResponse(inq) : errorResponse('Inquilino no encontrado');
      }

      if (params?.activos === true || params?.activos === 'true') {
        return successResponse(inquilinoRepository.getActivos());
      }

      return successResponse(inquilinoRepository.getAll<Inquilino>());

    case 'POST':
      const newInq = inquilinoRepository.create<Inquilino>(params);
      // Actualizar estado de habitación a ocupada
      if (params.habitacionId) {
        habitacionRepository.updateEstado(params.habitacionId as string, 'occupied');
      }
      return successResponse(newInq, 'Inquilino registrado');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');
      const updated = inquilinoRepository.update<Inquilino>(id, params);
      return updated ? successResponse(updated) : errorResponse('Inquilino no encontrado');

    case 'DELETE':
      if (!id) return errorResponse('ID requerido');
      const inq = inquilinoRepository.getById<Inquilino>(id);
      if (inq) {
        // Liberar habitación
        habitacionRepository.updateEstado(inq.habitacionId, 'vacant');
      }
      return inquilinoRepository.delete(id)
        ? successResponse(null, 'Inquilino eliminado')
        : errorResponse('Inquilino no encontrado');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Pagos
function handlePagos(
  action: string,
  id: string | undefined,
  subResource: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const params = data as Record<string, unknown>;

  switch (action) {
    case 'GET':
      // GET /pagos/resumen?mes=X&anio=Y
      if (id === 'resumen') {
        const mes = Number(params?.mes) || new Date().getMonth() + 1;
        const anio = Number(params?.anio) || new Date().getFullYear();
        return successResponse(pagoRepository.getResumenMes(mes, anio));
      }

      if (id) {
        const pago = pagoRepository.getById<Pago>(id);
        return pago ? successResponse(pago) : errorResponse('Pago no encontrado');
      }

      if (params?.mes && params?.anio) {
        return successResponse(
          pagoRepository.getByMesAnio(Number(params.mes), Number(params.anio))
        );
      }

      if (params?.habitacionId) {
        return successResponse(
          pagoRepository.getByHabitacion(
            params.habitacionId as string,
            params.mes ? Number(params.mes) : undefined,
            params.anio ? Number(params.anio) : undefined
          )
        );
      }

      return successResponse(pagoRepository.getAll<Pago>());

    case 'POST':
      // POST /pagos/reset-mes
      if (id === 'reset-mes') {
        // Aquí iría la lógica para resetear pagos del mes
        return successResponse({ affected: 0 }, 'Reset completado');
      }

      const newPago = pagoRepository.create<Pago>({
        ...params,
        fecha: params.fecha || new Date().toISOString(),
        estado: 'pagado',
      });
      return successResponse(newPago, 'Pago registrado');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');
      const updated = pagoRepository.update<Pago>(id, params);
      return updated ? successResponse(updated) : errorResponse('Pago no encontrado');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Gastos
function handleGastos(
  action: string,
  id: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const params = data as Record<string, unknown>;

  switch (action) {
    case 'GET':
      // GET /gastos/resumen-categoria
      if (id === 'resumen-categoria') {
        const mes = Number(params?.mes) || new Date().getMonth() + 1;
        const anio = Number(params?.anio) || new Date().getFullYear();
        return successResponse(
          gastoRepository.getResumenPorCategoria(mes, anio, params?.edificioId as string)
        );
      }

      if (id) {
        const gasto = gastoRepository.getById<Gasto>(id);
        return gasto ? successResponse(gasto) : errorResponse('Gasto no encontrado');
      }

      if (params?.mes && params?.anio) {
        return successResponse(
          gastoRepository.getByMesAnio(
            Number(params.mes),
            Number(params.anio),
            params.edificioId as string
          )
        );
      }

      return successResponse(gastoRepository.getAll<Gasto>());

    case 'POST':
      const newGasto = gastoRepository.create<Gasto>({
        ...params,
        fecha: params.fecha || new Date().toISOString(),
      });
      return successResponse(newGasto, 'Gasto registrado');

    case 'PUT':
      if (!id) return errorResponse('ID requerido');
      const updated = gastoRepository.update<Gasto>(id, params);
      return updated ? successResponse(updated) : errorResponse('Gasto no encontrado');

    case 'DELETE':
      if (!id) return errorResponse('ID requerido');
      return gastoRepository.delete(id)
        ? successResponse(null, 'Gasto eliminado')
        : errorResponse('Gasto no encontrado');

    default:
      return errorResponse('Acción no soportada');
  }
}

// Handler para Reportes
function handleReportes(
  type: string | undefined,
  data: unknown
): GoogleAppsScript.Content.TextOutput {
  const params = data as Record<string, unknown>;
  const mes = Number(params?.mes) || new Date().getMonth() + 1;
  const anio = Number(params?.anio) || new Date().getFullYear();

  switch (type) {
    case 'dashboard':
      const habitaciones = habitacionRepository.getAll<Habitacion>();
      const ocupadas = habitaciones.filter((h) => h.estado === 'occupied');
      const pagosResumen = pagoRepository.getResumenMes(mes, anio);
      const gastosMes = gastoRepository.getByMesAnio(mes, anio);
      const totalGastos = gastosMes.reduce((sum, g) => sum + g.monto, 0);

      const stats: DashboardStats = {
        totalCiudades: ciudadRepository.getAll<Ciudad>().length,
        totalEdificios: edificioRepository.getAll<Edificio>().length,
        totalHabitaciones: habitaciones.length,
        habitacionesOcupadas: ocupadas.length,
        habitacionesVacantes: habitaciones.filter((h) => h.estado === 'vacant').length,
        tasaOcupacion: habitaciones.length > 0
          ? (ocupadas.length / habitaciones.length) * 100
          : 0,
        ingresosMes: pagosResumen.totalRecaudado,
        gastosMes: totalGastos,
        balance: pagosResumen.totalRecaudado - totalGastos,
        habitacionesPagadas: pagosResumen.habitacionesPagadas,
        habitacionesPendientes: pagosResumen.habitacionesPendientes,
      };

      return successResponse(stats);

    case 'mensual':
      const pagos = pagoRepository.getByMesAnio(mes, anio);
      const gastos = gastoRepository.getByMesAnio(mes, anio);

      const ingresos = pagos.reduce((sum, p) => sum + (p.estado === 'pagado' ? p.monto : 0), 0);
      const totalGastosM = gastos.reduce((sum, g) => sum + g.monto, 0);

      return successResponse({
        mes,
        anio,
        ingresos,
        gastos: totalGastosM,
        balance: ingresos - totalGastosM,
        pagosRegistrados: pagos.length,
        detalleIngresos: {
          alquiler: pagos.filter((p) => p.concepto === 'alquiler').reduce((s, p) => s + p.monto, 0),
          internet: pagos.filter((p) => p.concepto === 'internet').reduce((s, p) => s + p.monto, 0),
          servicios: pagos.filter((p) => p.concepto === 'servicios').reduce((s, p) => s + p.monto, 0),
          otros: pagos.filter((p) => p.concepto === 'otro').reduce((s, p) => s + p.monto, 0),
        },
        detalleGastos: gastoRepository.getResumenPorCategoria(mes, anio),
      });

    case 'historico':
      const mesesAtras = Number(params?.meses) || 6;
      const historico = [];

      for (let i = 0; i < mesesAtras; i++) {
        let m = mes - i;
        let a = anio;
        if (m <= 0) {
          m += 12;
          a -= 1;
        }

        const pagosH = pagoRepository.getByMesAnio(m, a);
        const gastosH = gastoRepository.getByMesAnio(m, a);
        const ingresosH = pagosH.reduce((sum, p) => sum + (p.estado === 'pagado' ? p.monto : 0), 0);
        const gastosTotal = gastosH.reduce((sum, g) => sum + g.monto, 0);

        historico.push({
          mes: m,
          anio: a,
          ingresos: ingresosH,
          gastos: gastosTotal,
          balance: ingresosH - gastosTotal,
        });
      }

      return successResponse(historico.reverse());

    default:
      return errorResponse('Tipo de reporte no válido');
  }
}
