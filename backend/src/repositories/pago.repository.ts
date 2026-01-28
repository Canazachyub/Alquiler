// Repositorio para Pagos

class PagoRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.PAGOS, CONFIG.HEADERS.PAGOS);
  }

  getByMesAnio(mes: number, anio: number): Pago[] {
    const all = this.getAll<Pago>();
    return all.filter((p) => p.mes === mes && p.anio === anio);
  }

  getByHabitacion(habitacionId: string, mes?: number, anio?: number): Pago[] {
    let pagos = this.getByField<Pago>('habitacionId', habitacionId);

    if (mes !== undefined && anio !== undefined) {
      pagos = pagos.filter((p) => p.mes === mes && p.anio === anio);
    }

    return pagos;
  }

  getResumenMes(mes: number, anio: number): {
    totalRecaudado: number;
    totalPagos: number;
    habitacionesPagadas: number;
    habitacionesPendientes: number;
  } {
    const pagos = this.getByMesAnio(mes, anio);
    const habitaciones = habitacionRepository.getOcupadas();

    const habitacionesPagadas = new Set(
      pagos
        .filter((p) => p.concepto === 'alquiler' && p.estado === 'pagado')
        .map((p) => p.habitacionId)
    );

    return {
      totalRecaudado: pagos
        .filter((p) => p.estado === 'pagado')
        .reduce((sum, p) => sum + p.monto, 0),
      totalPagos: pagos.length,
      habitacionesPagadas: habitacionesPagadas.size,
      habitacionesPendientes: habitaciones.length - habitacionesPagadas.size,
    };
  }

  anular(id: string): Pago | null {
    return this.update<Pago>(id, { estado: 'anulado' });
  }
}

const pagoRepository = new PagoRepository();
