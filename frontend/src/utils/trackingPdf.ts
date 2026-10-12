import { jsPDF } from 'jspdf';
import { inicialCobrador } from './cobradores';
import { modalidadDeInquilino, periodoCubierto } from './modalidad';
import type { HabitacionConDetalles, Inquilino, Pago } from '@/types';

/**
 * Hoja de tracking (2 caras, A4 horizontal), con el mismo formato de la hoja física:
 *  - Cara 1: Enero–Marzo (alquiler) + sección INTERNET con 12 meses.
 *  - Cara 2: Abril–Diciembre (alquiler) en cuadrícula 3×3.
 * Cada mes de alquiler: FIRMA y DE … HASTA, ya impresos según el día de pago.
 */

interface TrackingParams {
  inquilino: Inquilino;
  habitacion: HabitacionConDetalles;
  edificio?: string;
  pagos: Pago[];
  anio: number;
}

type RGB = [number, number, number];
const TINTA: RGB = [27, 30, 42];
const GRIS: RGB = [111, 113, 123];
const GUIA: RGB = [150, 146, 141];
const VERDE: RGB = [16, 150, 100];
const VERDE_FONDO: RGB = [226, 245, 235];
const APAGADO: RGB = [238, 236, 233];

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const dmy = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const dm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const fechaLocal = (iso?: string) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export function generarTrackingPdf(p: TrackingParams): jsPDF {
  const { inquilino: inq, habitacion: h, anio } = p;
  const desde = fechaLocal(inq.fechaIngreso);
  const dia = Number(h.diaPago) || desde?.getDate() || 1;
  const ingresoK = desde ? desde.getFullYear() * 12 + desde.getMonth() : null;
  const monto = Number(h.montoAlquiler || 0);
  // Mes vencido: el primer cobro es el mes siguiente al ingreso y cada pago cubre el mes ya usado
  const modalidad = modalidadDeInquilino(inq);
  const primerK = ingresoK === null ? null : ingresoK + (modalidad === 'vencido' ? 1 : 0);
  const montoInternet = Number(h.montoInternet || 0);

  const delCuarto = p.pagos.filter((x) => x.habitacionId === h.id && x.estado !== 'anulado');
  const pagosDe = (concepto: string, mes: number) =>
    delCuarto.filter((x) => x.concepto === concepto && Number(x.mes) === mes && Number(x.anio) === anio);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const M = 8;
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const relleno = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const trazo = (c: RGB, w = 0.3) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(w);
  };
  const punteada = (x1: number, y1: number, x2: number) => {
    trazo(GUIA, 0.3);
    doc.setLineDashPattern([0.6, 0.8], 0);
    doc.line(x1, y1, x2, y1);
    doc.setLineDashPattern([], 0);
  };

  // Encabezado del inquilino (se repite en ambas caras)
  const encabezado = (cara: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    color(TINTA);
    doc.text(`HOJA DE TRACKING ${anio}`, M, M + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    color(GRIS);
    doc.text(cara, M, M + 9.5);

    const datos = [
      ['Cuarto', `${h.codigo}${p.edificio ? ` · ${p.edificio}` : ''}`],
      ['Inquilino', `${inq.nombre} ${inq.apellido}`.toUpperCase()],
      ['DNI', String(inq.dni ?? '').replace(/\D/g, '').padStart(8, '0')],
      ['Paga el día', `${dia} · S/ ${monto}`],
    ];
    let x = 72;
    datos.forEach(([k, v]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      color(GRIS);
      doc.text(k.toUpperCase(), x, M + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      color(TINTA);
      const texto = doc.splitTextToSize(v, k === 'Inquilino' ? 78 : 50)[0];
      doc.text(texto, x, M + 8.5);
      x += k === 'Inquilino' ? 82 : k === 'Cuarto' ? 46 : 32;
    });
    trazo(TINTA, 0.5);
    doc.line(M, M + 12, W - M, M + 12);
  };

  // Barra oscura con nombres de meses (como en la hoja física)
  const barraMeses = (x: number, y: number, w: number, hb: number, meses: number[]) => {
    relleno(TINTA);
    doc.rect(x, y, w, hb, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    meses.forEach((m, i) => {
      doc.text(MESES[m - 1], x + (i + 0.5) * (w / meses.length), y + hb / 2 + 1.5, { align: 'center' });
    });
  };

  // Celda de alquiler de un mes: FIRMA + DE … HASTA
  const celdaAlquiler = (x: number, y: number, w: number, hc: number, mes: number) => {
    const k = anio * 12 + (mes - 1);
    trazo(TINTA, 0.3);
    doc.rect(x, y, w, hc, 'S');

    if (primerK !== null && k < primerK) {
      relleno(APAGADO);
      doc.rect(x + 0.2, y + 0.2, w - 0.4, hc - 0.4, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      color(GUIA);
      doc.text('Aún no vivía', x + w / 2, y + hc / 2, { align: 'center' });
      return;
    }

    const { desde: ini, hasta: fin } = periodoCubierto(mes, anio, dia, modalidad);
    const pagado = pagosDe('alquiler', mes);

    // Monto del mes (arriba a la derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    color(GRIS);
    doc.text(`S/ ${monto}`, x + w - 3, y + 5, { align: 'right' });

    if (pagado.length) {
      relleno(VERDE_FONDO);
      doc.roundedRect(x + 3, y + 2, w - 26, 7, 1.2, 1.2, 'F');
      color(VERDE);
      doc.setFontSize(9);
      const quien = [...new Set(pagado.map((x2) => inicialCobrador(x2.observaciones)).filter(Boolean))].join('/');
      doc.text(
        `PAGADO el ${dm(fechaLocal(pagado[0].fecha) ?? ini)}${quien ? ` · cobró ${quien}` : ''}`,
        x + 5,
        y + 6.6
      );
    }

    // Firma
    const yFirma = y + hc * 0.55;
    punteada(x + 10, yFirma, x + w - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    color(GRIS);
    doc.text('FIRMA', x + w / 2, yFirma + 3.6, { align: 'center' });

    // DE … HASTA (ya impresos)
    const yDe = y + hc - 4;
    doc.setFontSize(8);
    color(GRIS);
    doc.text('DE:', x + 4, yDe);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    color(TINTA);
    doc.text(dmy(ini), x + 10, yDe);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    color(GRIS);
    doc.text('HASTA:', x + w / 2 + 2, yDe);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    color(TINTA);
    doc.text(dmy(fin), x + w / 2 + 14, yDe);
  };

  // ======================= CARA 1 =======================
  encabezado('Cara 1 · Alquiler enero a marzo · Internet');
  const yA = M + 15;
  const wTot = W - 2 * M;
  barraMeses(M, yA, wTot, 8, [1, 2, 3]);
  const hCelda1 = 52;
  [1, 2, 3].forEach((m, i) => celdaAlquiler(M + i * (wTot / 3), yA + 8, wTot / 3, hCelda1, m));

  // Sección INTERNET
  const yI = yA + 8 + hCelda1 + 4;
  relleno(TINTA);
  doc.rect(M, yI, wTot, 11, 'F');
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('INTERNET', W / 2, yI + 8.2, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FECHA DE INSTALACIÓN:', M + 3, yI + 6.8);
  relleno([255, 255, 255]);
  doc.roundedRect(M + 42, yI + 2.2, 34, 6.6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('WIFI', W - M - 52, yI + 6.8);
  doc.text('CABLE ETHERNET', W - M - 30, yI + 6.8);
  relleno([255, 255, 255]);
  doc.circle(W - M - 55.5, yI + 5.6, 2, 'F');
  doc.circle(W - M - 33.5, yI + 5.6, 2, 'F');
  if (montoInternet > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`S/ ${montoInternet} al mes`, M + 80, yI + 6.8);
  }

  // 12 casillas de internet (2 filas × 6)
  const yG = yI + 14;
  const hG = (H - M - 5 - yG) / 2;
  const wG = wTot / 6;
  for (let i = 0; i < 12; i++) {
    const col = i % 6;
    const fila = Math.floor(i / 6);
    const x = M + col * wG + 1.2;
    const y = yG + fila * hG + 1.2;
    const w = wG - 2.4;
    const hc = hG - 2.4;
    const mes = i + 1;
    const k = anio * 12 + (mes - 1);
    trazo(TINTA, 0.35);
    doc.roundedRect(x, y, w, hc, 2, 2, 'S');
    if (ingresoK !== null && k < ingresoK) {
      relleno(APAGADO);
      doc.roundedRect(x + 0.3, y + 0.3, w - 0.6, hc - 0.6, 1.8, 1.8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    color(TINTA);
    doc.text(MESES[mes - 1], x + w / 2, y + 6, { align: 'center' });
    const pagoInt = pagosDe('internet', mes);
    if (pagoInt.length) {
      doc.setFontSize(8);
      color(VERDE);
      doc.text(`PAGADO ${dm(fechaLocal(pagoInt[0].fecha) ?? new Date())}`, x + w / 2, y + 11, { align: 'center' });
    }
    punteada(x + 5, y + hc - 6.5, x + w - 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    color(GRIS);
    doc.text('FIRMA', x + w / 2, y + hc - 2.6, { align: 'center' });
  }
  doc.setFontSize(7);
  color(GRIS);
  doc.text('Voltear la hoja: abril a diciembre al reverso', W - M, H - M + 2, { align: 'right' });

  // ======================= CARA 2 =======================
  doc.addPage('a4', 'landscape');
  encabezado('Cara 2 · Alquiler abril a diciembre');
  const filas = [
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
  ];
  const yB = M + 15;
  const hBarra = 8;
  const hCelda2 = (H - M - yB - filas.length * hBarra - 2) / filas.length;
  filas.forEach((meses, f) => {
    const y = yB + f * (hBarra + hCelda2);
    barraMeses(M, y, wTot, hBarra, meses);
    meses.forEach((m, i) => celdaAlquiler(M + i * (wTot / 3), y + hBarra, wTot / 3, hCelda2, m));
  });

  return doc;
}

export function nombreArchivoTracking(codigo: string, nombre: string, anio: number) {
  const limpio = `${codigo}-${nombre}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-');
  return `Tracking-${limpio}-${anio}.pdf`;
}
