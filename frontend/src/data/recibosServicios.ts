/**
 * Histórico de recibos de servicios de Casa Progreso (Jr. Progreso A-16, Puno).
 * Transcrito de los recibos en PDF de EMSA Puno (agua) y Electro Puno (luz).
 * Para agregar un mes nuevo, añade una fila al final de la lista que corresponda.
 */

export interface ReciboAgua {
  mes: number;
  anio: number;
  recibo: string;
  /** Volumen facturado en m³ */
  m3: number;
  cargoFijo: number;
  agua: number;
  desague: number;
  igv: number;
  interes: number;
  /** Cortes y reaperturas por atraso (sin IGV) */
  multas: { concepto: string; monto: number }[];
  /** Lo facturado por ese mes (sin deuda anterior) */
  importeMes: number;
  deudaAnterior: number;
  totalPagar: number;
  vence: string;
  emision?: string;
}

export interface ReciboLuz {
  mes: number;
  anio: number;
  /** Consumo en kWh */
  kwh: number;
  /** true = leído del gráfico de evolución del recibo (aproximado) */
  kwhAprox?: boolean;
  recibo?: string;
  importeMes?: number;
  deudaAnterior?: number;
  totalPagar?: number;
  vence?: string;
  emision?: string;
  pagado?: boolean;
}

// Código de usuario y página para consultar el último recibo en línea
export const SUMINISTROS = {
  agua: {
    empresa: 'EMSA Puno',
    tarifa: 'Doméstico + Comercial',
    codigo: '10020309',
    etiquetaCodigo: 'Usuario',
    consultaUrl: 'https://emsapuno.pe/apps/consulta/Login.aspx',
  },
  luz: {
    empresa: 'Electro Puno',
    tarifa: 'BT5B Residencial',
    codigo: '0010019207',
    etiquetaCodigo: 'Código de usuario',
    consultaUrl: 'http://web.electropuno.com.pe/consultaultimorecibo/',
  },
};

export const RECIBOS_AGUA: ReciboAgua[] = [
  { mes: 1, anio: 2025, recibo: '02433375', m3: 10, cargoFijo: 2.6, agua: 20.8, desague: 6.45, igv: 5.37, interes: 0.32, multas: [], importeMes: 35.5, deudaAnterior: 102.4, totalPagar: 137.9, vence: '2025-02-17' },
  { mes: 2, anio: 2025, recibo: '02460195', m3: 12, cargoFijo: 2.6, agua: 24.96, desague: 7.74, igv: 16.08, interes: 0.11, multas: [{ concepto: 'Reapertura de agua', monto: 54.01 }], importeMes: 105.5, deudaAnterior: 0, totalPagar: 105.5, vence: '2025-03-21' },
  { mes: 3, anio: 2025, recibo: '02543548', m3: 10, cargoFijo: 2.6, agua: 20.8, desague: 6.45, igv: 5.37, interes: 0.37, multas: [], importeMes: 35.6, deudaAnterior: 105.5, totalPagar: 141.1, vence: '2025-04-16' },
  { mes: 4, anio: 2025, recibo: '02564557', m3: 16, cargoFijo: 2.6, agua: 33.28, desague: 10.32, igv: 8.32, interes: 0.05, multas: [], importeMes: 54.6, deudaAnterior: 0, totalPagar: 54.6, vence: '2025-05-22' },
  { mes: 5, anio: 2025, recibo: '02610330', m3: 14, cargoFijo: 2.6, agua: 29.12, desague: 9.03, igv: 7.34, interes: 0.17, multas: [], importeMes: 48.2, deudaAnterior: 54.6, totalPagar: 102.8, vence: '2025-06-16' },
  { mes: 6, anio: 2025, recibo: '02660963', m3: 21, cargoFijo: 2.6, agua: 43.98, desague: 13.64, igv: 10.84, interes: 0, multas: [], importeMes: 71.1, deudaAnterior: 0, totalPagar: 71.1, vence: '2025-07-22' },
  { mes: 7, anio: 2025, recibo: '02723166', m3: 35, cargoFijo: 2.6, agua: 77.16, desague: 24.0, igv: 18.68, interes: 0, multas: [], importeMes: 122.4, deudaAnterior: 0, totalPagar: 122.4, vence: '2025-08-22' },
  { mes: 8, anio: 2025, recibo: '02757841', m3: 10, cargoFijo: 2.6, agua: 20.8, desague: 6.45, igv: 5.37, interes: 0.38, multas: [], importeMes: 35.6, deudaAnterior: 122.4, totalPagar: 158.0, vence: '2025-09-15' },
  { mes: 9, anio: 2025, recibo: '02780342', m3: 16, cargoFijo: 2.6, agua: 33.28, desague: 10.32, igv: 8.32, interes: 0.13, multas: [], importeMes: 54.7, deudaAnterior: 0, totalPagar: 54.7, vence: '2025-10-22' },
  { mes: 10, anio: 2025, recibo: '02839061', m3: 12, cargoFijo: 2.6, agua: 24.96, desague: 7.74, igv: 6.35, interes: 0.17, multas: [], importeMes: 41.8, deudaAnterior: 54.7, totalPagar: 96.5, vence: '2025-11-17' },
  { mes: 11, anio: 2025, recibo: '02868459', m3: 14, cargoFijo: 2.6, agua: 32.2, desague: 10.08, igv: 8.08, interes: 0, multas: [], importeMes: 53.0, deudaAnterior: 0, totalPagar: 53.0, vence: '2025-12-22' },
  { mes: 12, anio: 2025, recibo: '02923523', m3: 15, cargoFijo: 2.6, agua: 34.5, desague: 10.81, igv: 8.62, interes: 0.17, multas: [], importeMes: 56.7, deudaAnterior: 53.0, totalPagar: 109.7, vence: '2026-01-16' },
  { mes: 1, anio: 2026, recibo: '02974640', m3: 11, cargoFijo: 2.6, agua: 25.3, desague: 7.93, igv: 16.17, interes: 0.23, multas: [{ concepto: 'Reapertura de agua', monto: 54.01 }], importeMes: 106.2, deudaAnterior: 0, totalPagar: 106.2, vence: '2026-02-23' },
  { mes: 2, anio: 2026, recibo: '03002798', m3: 12, cargoFijo: 2.6, agua: 32.46, desague: 10.2, igv: 8.15, interes: 0.18, multas: [], importeMes: 53.6, deudaAnterior: 106.2, totalPagar: 159.8, vence: '2026-03-16' },
  { mes: 3, anio: 2026, recibo: '03058695', m3: 14, cargoFijo: 2.6, agua: 34.93, desague: 10.99, igv: 8.73, interes: 0, multas: [], importeMes: 57.2, deudaAnterior: 0, totalPagar: 53.31, vence: '2026-04-22' },
  { mes: 4, anio: 2026, recibo: '03124994', m3: 17, cargoFijo: 2.6, agua: 42.42, desague: 13.35, igv: 10.51, interes: 0, multas: [], importeMes: 68.9, deudaAnterior: 0, totalPagar: 68.9, vence: '2026-05-22' },
  { mes: 5, anio: 2026, recibo: '03136990', m3: 19, cargoFijo: 2.6, agua: 47.41, desague: 14.92, igv: 11.69, interes: 0.23, multas: [], importeMes: 76.9, deudaAnterior: 68.9, totalPagar: 145.8, vence: '2026-06-15' },
  { mes: 6, anio: 2026, recibo: '03195015', m3: 13, cargoFijo: 2.6, agua: 32.44, desague: 10.21, igv: 17.87, interes: 0.62, multas: [{ concepto: 'Cierre simple de agua', monto: 27.58 }, { concepto: 'Reapertura de agua', monto: 26.43 }], importeMes: 117.7, deudaAnterior: 0, totalPagar: 117.7, vence: '2026-07-22' },
  { mes: 7, anio: 2026, recibo: '03240062', m3: 12, cargoFijo: 2.6, agua: 29.94, desague: 9.42, igv: 7.55, interes: 0.4, multas: [], importeMes: 49.9, deudaAnterior: 117.7, totalPagar: 167.6, vence: '2026-08-17' },
  { mes: 8, anio: 2026, recibo: '03292781', m3: 15, cargoFijo: 2.6, agua: 37.43, desague: 11.78, igv: 9.33, interes: 0, multas: [], importeMes: 61.2, deudaAnterior: 0, totalPagar: 61.2, vence: '2026-09-22' },
  { mes: 9, anio: 2026, recibo: '03358643', m3: 18, cargoFijo: 2.6, agua: 44.91, desague: 14.13, igv: 11.1, interes: 0.19, multas: [], importeMes: 72.9, deudaAnterior: 61.2, totalPagar: 134.1, vence: '2026-10-16', emision: '2026-09-30' },
];

export const RECIBOS_LUZ: ReciboLuz[] = [
  { mes: 10, anio: 2025, kwh: 172, kwhAprox: true },
  { mes: 11, anio: 2025, kwh: 153, kwhAprox: true },
  { mes: 12, anio: 2025, kwh: 141, kwhAprox: true },
  { mes: 1, anio: 2026, kwh: 129, kwhAprox: true },
  { mes: 2, anio: 2026, kwh: 118, kwhAprox: true },
  { mes: 3, anio: 2026, kwh: 118, kwhAprox: true },
  { mes: 4, anio: 2026, kwh: 153, kwhAprox: true },
  { mes: 5, anio: 2026, kwh: 172, kwhAprox: true },
  { mes: 6, anio: 2026, kwh: 180, kwhAprox: true, recibo: '131-1612321', importeMes: 203.7, deudaAnterior: 0, totalPagar: 203.7, pagado: true },
  { mes: 7, anio: 2026, kwh: 202, kwhAprox: true, recibo: '131-1634718', importeMes: 226.3, deudaAnterior: 203.7, totalPagar: 430, pagado: true },
  { mes: 8, anio: 2026, kwh: 194, kwhAprox: true, recibo: '131-1657145', importeMes: 219.5, deudaAnterior: 0, totalPagar: 219.5, pagado: false },
  { mes: 9, anio: 2026, kwh: 182, recibo: '131-1679599', importeMes: 208.6, deudaAnterior: 219.5, totalPagar: 428.1, vence: '2026-10-22', emision: '2026-10-02', pagado: false },
];
