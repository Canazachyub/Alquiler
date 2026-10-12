import { jsPDF } from 'jspdf';
import { calcularCobro } from './cobro';
import { compararCodigos } from './plano';
import { inicialCobrador, COBRADORES } from './cobradores';
import { getMonthName } from './formatters';
import type { HabitacionConDetalles, Pago } from '@/types';

/**
 * Planilla para marcar a mano, en cuadrícula tipo Excel (al estilo del registro HIS).
 * Solo cuartos con inquilino. Cada mes se divide en celdas: Pagó · Fecha · Y · J · M.
 * Ocupa toda la hoja A4 horizontal; las filas sobrantes quedan en blanco para anotar.
 */

interface PlanillaParams {
  edificio: string;
  ciudad?: string;
  habitaciones: HabitacionConDetalles[];
  pagos: Pago[];
  /** Primer mes de la planilla (normalmente el mes actual) */
  mesInicio: number;
  anioInicio: number;
  meses?: number;
}

type RGB = [number, number, number];
const TINTA: RGB = [27, 30, 42];
const GRIS: RGB = [111, 113, 123];
const GUIA: RGB = [190, 186, 181]; // texto guía para escribir encima
const LINEA: RGB = [150, 146, 141];
const VERDE: RGB = [16, 150, 100];
const VERDE_FONDO: RGB = [222, 244, 232];
const ROJO: RGB = [220, 38, 38];
const CABECERA: RGB = [27, 30, 42];
const SUBCAB: RGB = [231, 227, 223];

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const dm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const vence = (mes: number, anio: number, dia: number) =>
  new Date(anio, mes - 1, Math.min(dia, new Date(anio, mes, 0).getDate()));
const soles = (n: number) => `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
const fechaLocal = (iso?: string) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export function generarPlanillaCobrosPdf(p: PlanillaParams): jsPDF {
  const nMeses = p.meses ?? 4;
  const columnas: { mes: number; anio: number }[] = [];
  for (let i = 0; i < nMeses; i++) {
    const d = new Date(p.anioInicio, p.mesInicio - 1 + i, 1);
    columnas.push({ mes: d.getMonth() + 1, anio: d.getFullYear() });
  }
  const inicioK = p.anioInicio * 12 + (p.mesInicio - 1);

  const inquilinos = p.habitaciones
    .filter((h) => h.estado === 'occupied' && h.nombreInquilino)
    .sort((a, b) => Number(a.pisoNumero ?? 0) - Number(b.pisoNumero ?? 0) || compararCodigos(a.codigo, b.codigo));
  const alquileres = p.pagos.filter((x) => x.concepto === 'alquiler' && x.estado !== 'anulado');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const M = 6;
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const relleno = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const trazo = (c: RGB, w = 0.2) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(w);
  };

  // ---------------- Encabezado (una línea) ----------------
  const a = columnas[0];
  const z = columnas[columnas.length - 1];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  color(TINTA);
  doc.text(`${p.edificio} · Planilla de cobros`, M, M + 5);
  const anchoTitulo = doc.getTextWidth(`${p.edificio} · Planilla de cobros`);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  color(GRIS);
  doc.text(
    `${p.ciudad ? `${p.ciudad} · ` : ''}${getMonthName(a.mes)} ${a.anio} a ${getMonthName(z.mes)} ${z.anio}`,
    M + anchoTitulo + 4,
    M + 5
  );
  doc.setFontSize(8.5);
  color(TINTA);
  doc.text(
    `Al cobrar: marque "Pagó", escriba la fecha y marque quién cobró   ·   ${COBRADORES.map((c) => `${c.inicial} = ${c.nombre}`).join('   ')}`,
    W - M,
    M + 5,
    { align: 'right' }
  );

  /** Escribe el texto achicando la letra hasta que quepa en `ancho` (nunca se sale de su celda) */
  const textoAjustado = (
    texto: string,
    x: number,
    y: number,
    ancho: number,
    tam: number,
    opciones?: { align?: 'center' | 'left' | 'right' }
  ) => {
    let t = tam;
    doc.setFontSize(t);
    while (t > 4.5 && doc.getTextWidth(texto) > ancho) {
      t -= 0.25;
      doc.setFontSize(t);
    }
    doc.text(texto, x, y, opciones);
  };

  // ---------------- Columnas ----------------
  const xCuarto = M;
  const wCuarto = 9;
  const xInq = xCuarto + wCuarto;
  // Con 5+ meses las columnas fijas se angostan para dar espacio a la cuadrícula
  const muchos = columnas.length >= 5;
  const wInq = muchos ? 33 : 40;
  const xDia = xInq + wInq;
  const wDia = 8;
  const xMonto = xDia + wDia;
  const wMonto = 13;
  const xDebe = xMonto + wMonto;
  const wDebe = muchos ? 14 : 17;
  const xMeses = xDebe + wDebe;
  const wMes = (W - M - xMeses) / columnas.length;
  // Sub-columnas de cada mes (proporciones del ancho del mes)
  const sub = [
    { clave: 'pago', label: 'Pagó', f: 0.18 },
    { clave: 'fecha', label: 'Fecha', f: 0.31 },
    { clave: 'Y', label: 'Y', f: 0.17 },
    { clave: 'J', label: 'J', f: 0.17 },
    { clave: 'M', label: 'M', f: 0.17 },
  ];
  const subX = (i: number, j: number) => xMeses + i * wMes + sub.slice(0, j).reduce((s, x) => s + x.f * wMes, 0);
  const subW = (j: number) => sub[j].f * wMes;

  // ---------------- Alturas: llenar toda la hoja ----------------
  const yTabla = M + 9;
  const hCab1 = 7;
  const hCab2 = 5;
  const hTotales = 12;
  const hPie = 5;
  const yFilas = yTabla + hCab1 + hCab2;
  const disponible = H - M - hPie - hTotales - yFilas;
  const hIdeal = 11;
  const nFilas = Math.max(inquilinos.length, Math.floor(disponible / hIdeal));
  const hFila = disponible / nFilas;

  // ---------------- Cabecera ----------------
  relleno(CABECERA);
  doc.rect(M, yTabla, W - 2 * M, hCab1, 'F');
  relleno(SUBCAB);
  doc.rect(M, yTabla + hCab1, W - 2 * M, hCab2, 'F');

  // Las columnas fijas ocupan las dos filas de cabecera
  relleno(CABECERA);
  doc.rect(M, yTabla + hCab1, xMeses - M, hCab2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const yC = yTabla + (hCab1 + hCab2) / 2 + 1.2;
  doc.text('Cto.', xCuarto + wCuarto / 2, yC, { align: 'center' });
  doc.text('Inquilino', xInq + 1.5, yC);
  doc.text('Día', xDia + wDia / 2, yC, { align: 'center' });
  doc.text('Monto', xMonto + wMonto / 2, yC, { align: 'center' });
  doc.text('Debe', xDebe + wDebe / 2, yC - 1.6, { align: 'center' });
  doc.text('antes', xDebe + wDebe / 2, yC + 1.8, { align: 'center' });

  columnas.forEach((c, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const etiqueta = c.anio === a.anio ? getMonthName(c.mes).toUpperCase() : `${getMonthName(c.mes).toUpperCase()} ${c.anio}`;
    textoAjustado(etiqueta, xMeses + i * wMes + wMes / 2, yTabla + 4.9, wMes - 3, 10, { align: 'center' });
    color(TINTA);
    sub.forEach((s, j) => {
      textoAjustado(s.label, subX(i, j) + subW(j) / 2, yTabla + hCab1 + 3.6, subW(j) - 1.2, 7.5, { align: 'center' });
    });
  });

  // ---------------- Filas ----------------
  const esperado = columnas.map(() => 0);

  for (let r = 0; r < nFilas; r++) {
    const top = yFilas + r * hFila;
    const mid = top + hFila / 2;
    const h = inquilinos[r];

    if (r % 2 === 1) {
      relleno([248, 246, 244]);
      doc.rect(M, top, W - 2 * M, hFila, 'F');
    }
    if (!h) continue; // fila en blanco para anotar

    const c = calcularCobro(h, p.pagos);
    const desde = fechaLocal(h.fechaIngreso);
    const ingresoK = desde ? desde.getFullYear() * 12 + desde.getMonth() : null;
    const monto = Number(h.montoAlquiler || 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    color(TINTA);
    doc.text(h.codigo, xCuarto + wCuarto / 2, mid + 1.3, { align: 'center' });
    doc.setFontSize(muchos ? 6.2 : 7);
    const lineas = doc.splitTextToSize((h.nombreInquilino || '').toUpperCase(), wInq - 2.5).slice(0, 2);
    doc.text(lineas, xInq + 1.3, mid - (lineas.length - 1) * 1.4 + 0.9);
    doc.setFontSize(9);
    doc.text(String(c.diaPago), xDia + wDia / 2, mid + 1.2, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(soles(monto), xMonto + wMonto / 2, mid + 1, { align: 'center' });

    const previos = c.atrasados.filter((m) => m.anio * 12 + (m.mes - 1) < inicioK);
    if (previos.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      color(ROJO);
      textoAjustado(soles(previos.length * monto), xDebe + wDebe / 2, mid - 0.2, wDebe - 1.5, 8, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      textoAjustado(previos.map((m) => MES_CORTO[m.mes - 1]).join(', '), xDebe + wDebe / 2, mid + 2.8, wDebe - 1.5, 6, { align: 'center' });
    }

    columnas.forEach((col, i) => {
      const k = col.anio * 12 + (col.mes - 1);
      if (ingresoK !== null && k < ingresoK + (c.modalidad === 'vencido' ? 1 : 0)) {
        // No vivía aún: celda tachada suave
        relleno([238, 236, 233]);
        doc.rect(xMeses + i * wMes, top, wMes, hFila, 'F');
        return;
      }
      esperado[i] += monto;
      const v = vence(col.mes, col.anio, c.diaPago);
      const pagado = alquileres.filter(
        (x) => x.habitacionId === h.id && Number(x.mes) === col.mes && Number(x.anio) === col.anio
      );
      const xP = subX(i, 0);
      const xF = subX(i, 1);

      if (pagado.length) {
        // Ya registrado: Pagó en verde, fecha escrita y X en quien cobró
        relleno(VERDE_FONDO);
        doc.rect(xP, top, wMes, hFila, 'F');
        const s = Math.min(4.2, hFila - 3);
        relleno(VERDE);
        doc.rect(xP + subW(0) / 2 - s / 2, mid - s / 2, s, s, 'F');
        trazo([255, 255, 255], 0.55);
        doc.line(xP + subW(0) / 2 - s * 0.28, mid + s * 0.02, xP + subW(0) / 2 - s * 0.06, mid + s * 0.26);
        doc.line(xP + subW(0) / 2 - s * 0.06, mid + s * 0.26, xP + subW(0) / 2 + s * 0.3, mid - s * 0.24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        color(VERDE);
        textoAjustado(dm(fechaLocal(pagado[0].fecha) ?? v), xF + subW(1) / 2, mid + 1.1, subW(1) - 1.5, 8, { align: 'center' });
        const iniciales = new Set(pagado.map((x) => inicialCobrador(x.observaciones)).filter(Boolean));
        ['Y', 'J', 'M'].forEach((ini, j) => {
          if (iniciales.has(ini)) {
            doc.setFontSize(10);
            doc.text('X', subX(i, j + 2) + subW(j + 2) / 2, mid + 1.4, { align: 'center' });
          }
        });
        return;
      }

      // Por marcar: cuadro "Pagó" y fecha de vencimiento como guía
      const s = Math.min(4.6, hFila - 3);
      trazo(TINTA, 0.35);
      doc.rect(xP + subW(0) / 2 - s / 2, mid - s / 2, s, s, 'S');
      doc.setFont('helvetica', 'normal');
      color(GUIA);
      doc.setFontSize(6);
      const guia = doc.getTextWidth(`vence ${dm(v)}`) <= subW(1) - 1.5 ? `vence ${dm(v)}` : dm(v);
      textoAjustado(guia, xF + subW(1) / 2, top + 2.6, subW(1) - 1.5, 6, { align: 'center' });
      textoAjustado('__/__', xF + subW(1) / 2, mid + 2.6, subW(1) - 1.5, 9, { align: 'center' });
    });
  }

  // ---------------- Cuadrícula ----------------
  const yFin = yFilas + nFilas * hFila;
  // Horizontales
  for (let r = 0; r <= nFilas; r++) {
    trazo(LINEA, 0.2);
    doc.line(M, yFilas + r * hFila, W - M, yFilas + r * hFila);
  }
  // Verticales de columnas fijas
  [xCuarto, xInq, xDia, xMonto, xDebe].forEach((x) => {
    trazo(LINEA, 0.2);
    doc.line(x, yTabla + hCab1 + hCab2, x, yFin);
  });
  // Verticales de meses: divisiones finas, borde de mes grueso
  columnas.forEach((_, i) => {
    sub.forEach((__, j) => {
      if (j === 0) return;
      trazo(LINEA, 0.15);
      doc.line(subX(i, j), yTabla + hCab1, subX(i, j), yFin);
    });
    trazo(TINTA, 0.6);
    doc.line(xMeses + i * wMes, yTabla, xMeses + i * wMes, yFin + hTotales);
  });
  trazo(TINTA, 0.6);
  doc.rect(M, yTabla, W - 2 * M, yFin + hTotales - yTabla, 'S');

  // ---------------- Totales ----------------
  relleno([245, 243, 241]);
  doc.rect(M + 0.3, yFin + 0.3, W - 2 * M - 0.6, hTotales - 0.6, 'F');
  trazo(TINTA, 0.5);
  doc.line(M, yFin, W - M, yFin);
  trazo(LINEA, 0.2);
  doc.line(M, yFin + hTotales / 2, W - M, yFin + hTotales / 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  color(TINTA);
  doc.text('Debe cobrarse', xInq + 1.3, yFin + 4.2);
  doc.text('Cobrado (escribir)', xInq + 1.3, yFin + 10.2);
  columnas.forEach((_, i) => {
    trazo(TINTA, 0.6);
    doc.line(xMeses + i * wMes, yFin, xMeses + i * wMes, yFin + hTotales);
    doc.setFont('helvetica', 'bold');
    color(TINTA);
    doc.text(soles(esperado[i]), xMeses + i * wMes + wMes / 2, yFin + 4.2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    color(GUIA);
    doc.text('S/ ____________', xMeses + i * wMes + wMes / 2, yFin + 10.2, { align: 'center' });
  });

  // ---------------- Pie ----------------
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  color(GRIS);
  const hoy = new Date();
  doc.text(
    `Impreso el ${dm(hoy)}/${hoy.getFullYear()} · ${inquilinos.length} cuartos con inquilino · Gris = aún no vivía · Verde = ya registrado en el sistema`,
    M,
    H - M + 1
  );
  doc.text('Revisado por: ____________________   Fecha: __________', W - M, H - M + 1, { align: 'right' });

  return doc;
}

export function nombreArchivoPlanilla(edificio: string, mes: number, anio: number) {
  const limpio = edificio.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-');
  return `Planilla-cobros-${limpio}-${anio}-${String(mes).padStart(2, '0')}.pdf`;
}
