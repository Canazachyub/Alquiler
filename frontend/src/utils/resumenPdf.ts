import { jsPDF } from 'jspdf';
import { calcularCobro } from './cobro';
import { compararCodigos, letraDePiso } from './plano';
import { inicialCobrador, COBRADORES } from './cobradores';
import { getMonthName } from './formatters';
import type { HabitacionConDetalles, Pago } from '@/types';

/**
 * Resumen impreso de pagos de un edificio en UNA hoja A4 horizontal.
 * Pensado como respaldo físico y para leerlo sin sistema: letra grande,
 * puntitos de color y fechas "desde–hasta" de cada pago.
 */

interface ResumenParams {
  edificio: string;
  ciudad?: string;
  habitaciones: HabitacionConDetalles[];
  pagos: Pago[];
  /** Último mes de la tabla */
  mesFin: number;
  anioFin: number;
  /** Cantidad de meses (columnas) */
  meses?: number;
}

type RGB = [number, number, number];
const TINTA: RGB = [27, 30, 42];
const GRIS: RGB = [111, 113, 123];
const GRIS_CLARO: RGB = [231, 227, 223];
const VERDE: RGB = [16, 150, 100];
const VERDE_FONDO: RGB = [232, 247, 238];
const ROJO: RGB = [220, 38, 38];
const ROJO_FONDO: RGB = [254, 236, 236];
const OLIVA: RGB = [151, 133, 59];
const OLIVA_FONDO: RGB = [247, 244, 230];

const dm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const vence = (mes: number, anio: number, dia: number) =>
  new Date(anio, mes - 1, Math.min(dia, new Date(anio, mes, 0).getDate()));
const soles = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fechaLocal = (iso?: string) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export function generarResumenPagosPdf(p: ResumenParams): jsPDF {
  const nMeses = p.meses ?? 6;
  const hoy = new Date();
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Columnas de meses (de más antiguo a más reciente)
  const columnas: { mes: number; anio: number }[] = [];
  for (let i = nMeses - 1; i >= 0; i--) {
    const d = new Date(p.anioFin, p.mesFin - 1 - i, 1);
    columnas.push({ mes: d.getMonth() + 1, anio: d.getFullYear() });
  }

  // Pisos en orden de nivel, cuartos en orden natural
  const pisos = new Map<string, { numero: number; habs: HabitacionConDetalles[] }>();
  p.habitaciones.forEach((h) => {
    const g = pisos.get(h.pisoId) ?? { numero: Number(h.pisoNumero ?? 0), habs: [] };
    g.habs.push(h);
    pisos.set(h.pisoId, g);
  });
  const grupos = [...pisos.values()]
    .sort((a, b) => a.numero - b.numero)
    .map((g) => {
      const habs = [...g.habs].sort((a, b) => compararCodigos(a.codigo, b.codigo));
      return {
        numero: g.numero,
        letra: letraDePiso(habs.map((h) => h.codigo)),
        // Filas: ocupados, y exonerados solo si alguien vive ahí
        conGente: habs.filter((h) => h.estado === 'occupied' || (h.estado === 'exonerated' && h.nombreInquilino)),
        exoneradosVacios: habs.filter((h) => h.estado === 'exonerated' && !h.nombreInquilino),
        vacantes: habs.filter((h) => h.estado !== 'occupied' && h.estado !== 'exonerated'),
      };
    });

  const alquileres = p.pagos.filter((x) => x.concepto === 'alquiler' && x.estado !== 'anulado');

  // ---------------- Página ----------------
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const M = 9;
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const relleno = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const trazo = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  color(TINTA);
  doc.text(`${p.edificio} · Resumen de pagos`, M, M + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  color(GRIS);
  const primero = columnas[0];
  const ultimo = columnas[columnas.length - 1];
  doc.text(
    `${p.ciudad ? `${p.ciudad} · ` : ''}De ${getMonthName(primero.mes)} ${primero.anio} a ${getMonthName(ultimo.mes)} ${ultimo.anio} · Impreso el ${dm(hoy)}/${hoy.getFullYear()}`,
    M,
    M + 11.5
  );

  // Deuda total vencida (arriba a la derecha)
  let deudaTotal = 0;
  grupos.forEach((g) =>
    g.conGente.forEach((h) => {
      if (h.estado !== 'occupied' || !h.nombreInquilino) return;
      deudaTotal += calcularCobro(h, p.pagos).atrasados.length * Number(h.montoAlquiler || 0);
    })
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  color(GRIS);
  doc.text('DEUDA VENCIDA HOY', W - M, M + 3, { align: 'right' });
  doc.setFontSize(16);
  color(deudaTotal > 0 ? ROJO : VERDE);
  doc.text(soles(deudaTotal), W - M, M + 10, { align: 'right' });

  // Geometría de la tabla
  const xCuarto = M;
  const wCuarto = 14;
  const xInq = xCuarto + wCuarto;
  const wInq = 52;
  const xDia = xInq + wInq;
  const wDia = 14;
  const wDebe = 22;
  const xMeses = xDia + wDia;
  const wMes = (W - M - wDebe - xMeses) / columnas.length;
  const xDebe = W - M - wDebe;

  const yTabla = M + 16;
  const hCab = 9;
  const hPiso = 5.5;
  const hTotal = 7;
  const hLeyenda = 15;
  const filas = grupos.reduce((s, g) => s + g.conGente.length, 0);
  const disponible = H - M - hLeyenda - hTotal - (yTabla + hCab) - grupos.length * hPiso;
  const hFila = Math.max(7.5, Math.min(14, disponible / Math.max(1, filas)));
  const fs = hFila >= 11 ? 1 : hFila >= 9 ? 0.9 : 0.8; // escala de letra según espacio

  // Cabecera
  relleno(TINTA);
  doc.rect(M, yTabla, W - 2 * M, hCab, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const yc = yTabla + 5.8;
  doc.text('Cuarto', xCuarto + 2, yc);
  doc.text('Inquilino', xInq + 2, yc);
  doc.text('Paga', xDia + wDia / 2, yc - 1.6, { align: 'center' });
  doc.setFontSize(7);
  doc.text('el día', xDia + wDia / 2, yc + 1.8, { align: 'center' });
  columnas.forEach((c, i) => {
    const cx = xMeses + i * wMes + wMes / 2;
    doc.setFontSize(10);
    doc.text(getMonthName(c.mes), cx, yc - 0.6, { align: 'center' });
    doc.setFontSize(7);
    doc.text(String(c.anio), cx, yc + 2.6, { align: 'center' });
  });
  doc.setFontSize(9);
  doc.text('Debe hoy', xDebe + wDebe / 2, yc, { align: 'center' });

  let y = yTabla + hCab;
  const cobradoMes = columnas.map(() => 0);

  grupos.forEach((g) => {
    // Barra del piso
    relleno([245, 243, 241]);
    doc.rect(M, y, W - 2 * M, hPiso, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    color(TINTA);
    const titulo = `PISO ${g.letra ?? g.numero}`;
    doc.text(titulo, M + 2, y + 3.8);
    const anchoTitulo = doc.getTextWidth(titulo);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    color(GRIS);
    const extras = [
      g.vacantes.length ? `vacantes: ${g.vacantes.map((h) => h.codigo).join(', ')}` : '',
      g.exoneradosVacios.length ? `exonerados: ${g.exoneradosVacios.map((h) => h.codigo).join(', ')}` : '',
    ].filter(Boolean);
    const nota = `nivel ${g.numero}${extras.length ? ` · ${extras.join(' · ')}` : ''}`;
    doc.text(nota, M + 2 + anchoTitulo + 3, y + 3.8);
    y += hPiso;

    g.conGente.forEach((h, idx) => {
      const top = y;
      const mid = top + hFila / 2;
      if (idx > 0) {
        trazo(GRIS_CLARO);
        doc.setLineWidth(0.2);
        doc.line(M, top, W - M, top);
      }

      // Cuarto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13 * fs);
      color(TINTA);
      doc.text(h.codigo, xCuarto + 2, mid + 1.6);

      // Inquilino
      const nombre = (h.nombreInquilino || 'Sin inquilino registrado').toUpperCase();
      doc.setFontSize(9 * fs);
      const lineas = doc.splitTextToSize(nombre, wInq - 3).slice(0, 2);
      doc.text(lineas, xInq + 2, mid - (lineas.length - 1) * 1.8 + 1);

      if (h.estado === 'occupied' && !h.nombreInquilino) {
        relleno([255, 247, 230]);
        doc.rect(xDia, top + 0.6, xDebe + wDebe - xDia, hFila - 1.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10 * fs);
        color([180, 83, 9]);
        doc.text('OCUPADO SIN INQUILINO REGISTRADO — registrarlo en el sistema', xDia + 3, mid + 1.4);
        y += hFila;
        return;
      }

      if (h.estado === 'exonerated') {
        relleno(OLIVA_FONDO);
        doc.rect(xDia, top + 0.6, xDebe + wDebe - xDia, hFila - 1.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10 * fs);
        color(OLIVA);
        doc.text(
          `EXONERADO${h.motivoExoneracion ? ` — ${h.motivoExoneracion}` : ' — no paga alquiler'}`,
          xDia + 3,
          mid + 1.4
        );
        y += hFila;
        return;
      }

      const cobro = calcularCobro(h, p.pagos);
      const desde = fechaLocal(h.fechaIngreso);
      const dia = cobro.diaPago;
      const inicioK = desde ? desde.getFullYear() * 12 + desde.getMonth() : null;

      // Día de pago
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14 * fs);
      color(TINTA);
      doc.text(String(dia), xDia + wDia / 2, mid + 1.8, { align: 'center' });

      columnas.forEach((c, i) => {
        const x0 = xMeses + i * wMes;
        const cx = x0 + wMes / 2;
        const k = c.anio * 12 + (c.mes - 1);
        const delMes = alquileres.filter(
          (x) => x.habitacionId === h.id && Number(x.mes) === c.mes && Number(x.anio) === c.anio
        );
        const v = vence(c.mes, c.anio, dia);
        const hasta = new Date(vence(c.mes === 12 ? 1 : c.mes + 1, c.mes === 12 ? c.anio + 1 : c.anio, dia).getTime() - 86_400_000);

        if (inicioK !== null && k < inicioK) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          color(GRIS_CLARO);
          doc.text('—', cx, mid + 1.2, { align: 'center' });
          return;
        }

        const linea1Y = mid - 0.6;
        const linea2Y = mid + 3.4;
        const xDot = x0 + 3.6;

        if (delMes.length) {
          const monto = delMes.reduce((s, x) => s + Number(x.monto || 0), 0);
          cobradoMes[i] += monto;
          const iniciales = [...new Set(delMes.map((x) => inicialCobrador(x.observaciones)).filter(Boolean))].join('/');
          relleno(VERDE_FONDO);
          doc.rect(x0 + 0.6, top + 0.6, wMes - 1.2, hFila - 1.2, 'F');
          relleno(VERDE);
          doc.circle(xDot, linea1Y - 1.1, 1.7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5 * fs);
          color(TINTA);
          doc.text(soles(monto), xDot + 3, linea1Y);
          if (iniciales) {
            // Inicial de quien cobró, en un recuadro
            const tw = doc.getTextWidth(iniciales) + 2.4;
            const bx = x0 + wMes - tw - 1.6;
            relleno([255, 255, 255]);
            trazo(VERDE);
            doc.setLineWidth(0.3);
            doc.roundedRect(bx, linea1Y - 3.4, tw, 4.4, 0.8, 0.8, 'FD');
            color(VERDE);
            doc.text(iniciales, bx + tw / 2, linea1Y, { align: 'center' });
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5 * fs);
          color(GRIS);
          doc.text(`${dm(v)} al ${dm(hasta)}`, xDot - 1.7, linea2Y);
        } else if (v <= hoy0) {
          relleno(ROJO_FONDO);
          doc.rect(x0 + 0.6, top + 0.6, wMes - 1.2, hFila - 1.2, 'F');
          relleno(ROJO);
          doc.circle(xDot, linea1Y - 1.1, 1.7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5 * fs);
          color(ROJO);
          doc.text(`DEBE ${soles(Number(h.montoAlquiler || 0))}`, xDot + 3, linea1Y);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5 * fs);
          doc.text(`venció el ${dm(v)}`, xDot - 1.7, linea2Y);
        } else {
          trazo(GRIS);
          doc.setLineWidth(0.35);
          doc.circle(xDot, linea1Y - 1.1, 1.6, 'S');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9 * fs);
          color(GRIS);
          doc.text('Pendiente', xDot + 3, linea1Y);
          doc.setFontSize(7.5 * fs);
          doc.text(`vence el ${dm(v)}`, xDot - 1.7, linea2Y);
        }
      });

      // Debe hoy
      const debe = cobro.atrasados.length * Number(h.montoAlquiler || 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11 * fs);
      color(debe > 0 ? ROJO : VERDE);
      doc.text(debe > 0 ? soles(debe) : 'Al día', xDebe + wDebe / 2, mid + 1.4, { align: 'center' });

      y += hFila;
    });
  });

  // Fila de totales cobrados por mes
  relleno([245, 243, 241]);
  doc.rect(M, y, W - 2 * M, hTotal, 'F');
  trazo(TINTA);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  color(TINTA);
  doc.text('COBRADO EN EL MES', xInq + 2, y + 4.6);
  columnas.forEach((_, i) => {
    doc.text(soles(cobradoMes[i]), xMeses + i * wMes + wMes / 2, y + 4.6, { align: 'center' });
  });
  color(deudaTotal > 0 ? ROJO : VERDE);
  doc.text(soles(deudaTotal), xDebe + wDebe / 2, y + 4.6, { align: 'center' });
  y += hTotal;

  // Leyenda grande
  const yl = H - M - 7;
  doc.setFontSize(10);
  let lx = M;
  const punto = (c: RGB | null, txt: string) => {
    if (c) {
      relleno(c);
      doc.circle(lx + 2, yl - 1.2, 2, 'F');
    } else {
      trazo(GRIS);
      doc.setLineWidth(0.4);
      doc.circle(lx + 2, yl - 1.2, 1.9, 'S');
    }
    doc.setFont('helvetica', 'bold');
    color(TINTA);
    doc.text(txt, lx + 5.5, yl);
    lx += doc.getTextWidth(txt) + 12;
  };
  punto(VERDE, 'Pagó');
  punto(ROJO, 'Debe (ya venció)');
  punto(null, 'Pendiente (aún no vence)');
  doc.setFont('helvetica', 'bold');
  color(GRIS_CLARO);
  doc.text('—', lx, yl);
  color(TINTA);
  doc.text('Aún no vivía', lx + 5, yl);
  lx += doc.getTextWidth('Aún no vivía') + 14;
  doc.setFont('helvetica', 'normal');
  color(GRIS);
  doc.text(`Cobró: ${COBRADORES.map((c) => `${c.inicial} = ${c.nombre}`).join(' · ')}`, lx, yl);

  doc.setFontSize(9);
  doc.text('Fechas: desde el día de pago hasta un día antes del siguiente.', M, yl + 5);
  doc.text('Revisado por: ______________________   Fecha: ___________', W - M, yl + 5, { align: 'right' });

  return doc;
}

export function nombreArchivoResumen(edificio: string, mes: number, anio: number) {
  const limpio = edificio.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-');
  return `Resumen-pagos-${limpio}-${anio}-${String(mes).padStart(2, '0')}.pdf`;
}
