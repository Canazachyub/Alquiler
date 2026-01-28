// Repositorio para Habitaciones

class HabitacionRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.HABITACIONES, CONFIG.HEADERS.HABITACIONES);
  }

  getByPiso(pisoId: string): Habitacion[] {
    return this.getByField<Habitacion>('pisoId', pisoId);
  }

  getByEstado(estado: string): Habitacion[] {
    return this.getByField<Habitacion>('estado', estado);
  }

  getOcupadas(): Habitacion[] {
    return this.getByEstado('occupied');
  }

  getVacantes(): Habitacion[] {
    return this.getByEstado('vacant');
  }

  updateEstado(id: string, estado: string): Habitacion | null {
    return this.update<Habitacion>(id, { estado });
  }

  getConEstadoPago(mes: number, anio: number): (Habitacion & { alquilerPagado: boolean; internetPagado: boolean; nombreInquilino?: string; telefonoInquilino?: string })[] {
    const habitaciones = this.getAll<Habitacion>();
    const pagos = pagoRepository.getByMesAnio(mes, anio);
    const inquilinos = inquilinoRepository.getAll<Inquilino>();

    return habitaciones.map((hab) => {
      const pagosHab = pagos.filter((p) => p.habitacionId === hab.id);
      const inquilino = inquilinos.find((i) => i.habitacionId === hab.id && i.estado === 'activo');

      return {
        ...hab,
        alquilerPagado: pagosHab.some((p) => p.concepto === 'alquiler' && p.estado === 'pagado'),
        internetPagado: pagosHab.some((p) => p.concepto === 'internet' && p.estado === 'pagado'),
        nombreInquilino: inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : undefined,
        telefonoInquilino: inquilino?.telefono,
      };
    });
  }
}

const habitacionRepository = new HabitacionRepository();
