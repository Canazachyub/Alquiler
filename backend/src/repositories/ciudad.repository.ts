// Repositorio para Ciudades

class CiudadRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.CIUDADES, CONFIG.HEADERS.CIUDADES);
  }

  getActivas(): Ciudad[] {
    return this.getByField<Ciudad>('activo', true);
  }
}

const ciudadRepository = new CiudadRepository();
