// Repositorio para Edificios

class EdificioRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.EDIFICIOS, CONFIG.HEADERS.EDIFICIOS);
  }

  getByCiudad(ciudadId: string): Edificio[] {
    return this.getByField<Edificio>('ciudadId', ciudadId);
  }

  getActivos(): Edificio[] {
    return this.getByField<Edificio>('activo', true);
  }
}

const edificioRepository = new EdificioRepository();
