// Repositorio para Inquilinos

class InquilinoRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.INQUILINOS, CONFIG.HEADERS.INQUILINOS);
  }

  getActivos(): Inquilino[] {
    return this.getByField<Inquilino>('estado', 'activo');
  }

  getByHabitacion(habitacionId: string): Inquilino | null {
    const inquilinos = this.getByField<Inquilino>('habitacionId', habitacionId);
    return inquilinos.find((i) => i.estado === 'activo') || null;
  }

  darBaja(id: string, fechaSalida: string): Inquilino | null {
    return this.update<Inquilino>(id, {
      estado: 'inactivo',
      fechaSalida,
    });
  }
}

const inquilinoRepository = new InquilinoRepository();
