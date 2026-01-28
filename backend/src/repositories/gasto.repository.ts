// Repositorio para Gastos

class GastoRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.GASTOS, CONFIG.HEADERS.GASTOS);
  }

  getByMesAnio(mes: number, anio: number, edificioId?: string): Gasto[] {
    const all = this.getAll<Gasto>();

    return all.filter((g) => {
      const fecha = new Date(g.fecha);
      const matchesMes = fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio;
      const matchesEdificio = !edificioId || g.edificioId === edificioId;
      return matchesMes && matchesEdificio;
    });
  }

  getByEdificio(edificioId: string): Gasto[] {
    return this.getByField<Gasto>('edificioId', edificioId);
  }

  getResumenPorCategoria(mes: number, anio: number, edificioId?: string): Record<string, number> {
    const gastos = this.getByMesAnio(mes, anio, edificioId);
    const resumen: Record<string, number> = {
      mantenimiento: 0,
      servicios: 0,
      limpieza: 0,
      reparacion: 0,
      otros: 0,
    };

    gastos.forEach((g) => {
      const cat = g.categoria || 'otros';
      resumen[cat] = (resumen[cat] || 0) + g.monto;
    });

    return resumen;
  }
}

const gastoRepository = new GastoRepository();
