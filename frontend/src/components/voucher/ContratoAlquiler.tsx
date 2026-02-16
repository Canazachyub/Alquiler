import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Inquilino, Habitacion } from '@/types';

interface ContratoData {
  inquilino: Inquilino;
  habitacion: Habitacion;
  edificio?: {
    nombre: string;
    direccion: string;
    telefono?: string;
  };
  garantia?: boolean;
  llaveHabitacion?: boolean;
  llavePuertaCalle?: boolean;
}

/**
 * Genera el PDF del contrato de alquiler - Diseño profesional y formal
 */
export async function generateContratoPDF(data: ContratoData): Promise<void> {
  const { inquilino, habitacion, edificio } = data;
  const garantia = data.garantia ?? (inquilino as any).garantia ?? false;
  const llaveHabitacion = data.llaveHabitacion ?? (inquilino as any).llaveHabitacion ?? false;
  const llavePuertaCalle = data.llavePuertaCalle ?? (inquilino as any).llavePuertaCalle ?? false;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Generar URL de consulta y QR
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
  const consultaUrl = `${baseUrl}/consulta?hab=${habitacion.id}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(consultaUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#37306B', light: '#ffffff' }
    });
  } catch (err) {
    console.error('Error generating QR:', err);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2);
  let y = 0;

  // Colores del sistema de diseño
  const accent: [number, number, number] = [55, 48, 107];   // indigo oscuro
  const accentLight: [number, number, number] = [99, 91, 160]; // indigo claro
  const dark: [number, number, number] = [33, 37, 41];
  const mid: [number, number, number] = [108, 117, 125];
  const lightBg: [number, number, number] = [245, 245, 250];
  const borderColor: [number, number, number] = [210, 210, 220];
  const white: [number, number, number] = [255, 255, 255];

  // Helper: linea solida fina
  const hLine = (yPos: number, x1 = margin, x2 = pageWidth - margin, color = borderColor) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.4);
    doc.line(x1, yPos, x2, yPos);
  };

  // Helper: encabezado de seccion con linea
  const sectionHeader = (title: string, yPos: number): number => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(title, margin, yPos);
    const tw = doc.getTextWidth(title);
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, yPos + 1.5, margin + tw, yPos + 1.5);
    return yPos + 7;
  };

  // Helper: campo con etiqueta y valor en fila
  const fieldRow = (label: string, value: string, yPos: number, xStart = margin, maxWidth = contentWidth): number => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mid[0], mid[1], mid[2]);
    doc.text(label, xStart, yPos);
    const labelW = doc.getTextWidth(label + ' ');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(String(value || '________'), xStart + labelW, yPos);
    // linea punteada bajo el valor
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(xStart + labelW, yPos + 1, xStart + maxWidth * 0.45, yPos + 1);
    doc.setLineDashPattern([], 0);
    return yPos + 6;
  };

  // Helper: checkbox
  const checkbox = (label: string, checked: boolean, xPos: number, yPos: number): number => {
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(xPos, yPos - 3.5, 4.5, 4.5, 0.5, 0.5, 'S');
    if (checked) {
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.roundedRect(xPos + 0.5, yPos - 3, 3.5, 3.5, 0.3, 0.3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(white[0], white[1], white[2]);
      doc.text('✓', xPos + 1, yPos - 0.3);
    }
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(label, xPos + 6.5, yPos);
    return yPos + 7;
  };

  // ================================================================
  // BORDE SUPERIOR DECORATIVO
  // ================================================================
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Franja secundaria mas fina
  doc.setFillColor(accentLight[0], accentLight[1], accentLight[2]);
  doc.rect(0, 4, pageWidth, 1.5, 'F');

  y = 12;

  // ================================================================
  // MARCO EXTERIOR DEL DOCUMENTO
  // ================================================================
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin - 4, y - 3, contentWidth + 8, pageHeight - y - 12, 2, 2, 'S');

  // Marco interior decorativo (doble linea)
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin - 2, y - 1, contentWidth + 4, pageHeight - y - 16, 1.5, 1.5, 'S');

  // ================================================================
  // HEADER
  // ================================================================
  // Titulo principal
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('CONTRATO DE ALQUILER', margin, y + 5);

  // Subtitulo con nombre del edificio
  const nombreEdificio = String(edificio?.nombre || '');
  if (nombreEdificio) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(nombreEdificio.toUpperCase(), margin, y + 11);
  }

  // Direccion y telefono
  const dirY = nombreEdificio ? y + 15 : y + 11;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  const direccion = String(edificio?.direccion || 'Jr. Candelaria A16');
  const telefono = String(edificio?.telefono || '051-601731');
  doc.text(`${direccion}  |  Tel: ${telefono}`, margin, dirY);

  // QR Code a la derecha
  const qrSize = 22;
  const qrX = pageWidth - margin - qrSize;
  const qrY = y;

  if (qrDataUrl) {
    // Marco del QR
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 1, 1, 'S');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } else {
    doc.setDrawColor(mid[0], mid[1], mid[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'S');
    doc.setFontSize(6);
    doc.setTextColor(mid[0], mid[1], mid[2]);
    doc.text('QR', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
  }

  // Etiqueta bajo el QR
  doc.setFontSize(5.5);
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Consulta estado de pago', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });

  y = dirY + 6;
  hLine(y, margin, pageWidth - margin, accent);
  y += 8;

  // ================================================================
  // DECLARACION DEL INQUILINO
  // ================================================================
  const nombreCompleto = `${inquilino.nombre || ''} ${inquilino.apellido || ''}`.trim() || '________________';
  const dniText = String(inquilino.dni || '') || '________';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(dark[0], dark[1], dark[2]);

  // Texto de declaracion en parrafo
  const decl1 = `YO,`;
  doc.text(decl1, margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(` ${nombreCompleto.toUpperCase()}`, margin + doc.getTextWidth(decl1), y);
  const nameEndX = margin + doc.getTextWidth(decl1) + doc.getTextWidth(` ${nombreCompleto.toUpperCase()}`);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(', IDENTIFICADO(A)', nameEndX, y);

  // Subrayado del nombre
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.line(margin + doc.getTextWidth(decl1) + 1, y + 1, nameEndX, y + 1);

  y += 7;

  doc.text('CON DNI N° ', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  const dniStartX = margin + doc.getTextWidth('CON DNI N° ');
  doc.text(dniText, dniStartX, y);
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.line(dniStartX, y + 1, dniStartX + 22, y + 1);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(', EN CONDICION DE INQUILINO, ACEPTO LAS SIGUIENTES CONDICIONES:', dniStartX + 23, y);

  y += 6;
  hLine(y);
  y += 8;

  // ================================================================
  // DOS COLUMNAS: DATOS + REGLAS
  // ================================================================
  const colLeftX = margin;
  const colGap = 8;
  const colLeftW = 63;
  const colRightX = margin + colLeftW + colGap;
  const colRightW = contentWidth - colLeftW - colGap;
  let yL = y;
  let yR = y;

  // ---- COLUMNA IZQUIERDA: DATOS DEL INQUILINO ----

  // Marco de la seccion datos (empieza antes del header para darle espacio)
  const datosBoxY = yL - 5;

  yL = sectionHeader('DATOS DEL INQUILINO', yL);
  yL += 1;

  // Campo: Celular
  yL = fieldRow('Celular:', String(inquilino.telefono || ''), yL, colLeftX + 1, colLeftW - 2);

  // Campo: Celular apoderado
  yL = fieldRow('Cel. Apoderado:', String(inquilino.telefonoEmergencia || ''), yL, colLeftX + 1, colLeftW - 2);

  // Campo: Correo
  yL = fieldRow('Correo:', String(inquilino.email || ''), yL, colLeftX + 1, colLeftW - 2);

  yL += 2;

  // Campo: Habitacion con caja destacada
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Habitacion N°:', colLeftX + 1, yL);

  // Caja con el codigo
  const habBoxX = colLeftX + 1 + doc.getTextWidth('Habitacion N°: ') + 1;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(habBoxX, yL - 4, 16, 7, 1.5, 1.5, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(habitacion.codigo || '___', habBoxX + 8, yL + 0.5, { align: 'center' });

  yL += 10;

  // Seccion ENTREGA
  yL = sectionHeader('ENTREGA', yL);

  // Checkbox garantia
  yL = checkbox('Garantia entregada', garantia, colLeftX + 1, yL);

  // Checkbox llaves
  yL = checkbox('Llave de habitacion', llaveHabitacion, colLeftX + 1, yL);
  yL = checkbox('Llave puerta de calle', llavePuertaCalle, colLeftX + 1, yL);

  yL += 3;

  // Fecha de ingreso
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Fecha de ingreso:', colLeftX + 1, yL);
  yL += 5;

  // Caja de fecha
  let fechaPagoText = '____/____/________';
  if (inquilino.fechaIngreso) {
    const fecha = new Date(inquilino.fechaIngreso);
    if (!isNaN(fecha.getTime())) {
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      fechaPagoText = `${dia}/${mes}/${anio}`;
    }
  }

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(colLeftX + 1, yL - 3, 42, 9, 1.5, 1.5, 'FD');

  doc.setFontSize(10);
  if (fechaPagoText === '____/____/________') {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mid[0], mid[1], mid[2]);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
  }
  doc.text(fechaPagoText, colLeftX + 5, yL + 3);

  yL += 14;

  // Monto de alquiler
  yL = sectionHeader('MONTO DE ALQUILER', yL);

  // Caja destacada con monto (con padding interno)
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(colLeftX + 1, yL - 2, colLeftW - 2, 12, 2, 2, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(white[0], white[1], white[2]);
  const montoText = `S/ ${habitacion.montoAlquiler || '___'}`;
  doc.text(montoText, colLeftX + colLeftW / 2, yL + 6, { align: 'center' });

  yL += 15;

  // Marco alrededor de toda la columna izquierda (con padding)
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(colLeftX - 2, datosBoxY, colLeftW + 4, yL - datosBoxY + 4, 2, 2, 'S');

  // ---- COLUMNA DERECHA: REGLAS ----
  const reglasBoxY = yR - 5;

  yR = sectionHeader('REGLAS DEL INQUILINO', yR);
  yR += 1;

  const reglas = [
    'En esta vivienda esta totalmente prohibido tomar bebidas alcoholicas o cualquier sustancia toxica.',
    'La puerta principal se cierra a partir de las 10:50 PM como lapso maximo.',
    'Queda parcialmente impedido hacer uso de artefactos electricos que requieran una mayor potencia de uso.',
    'No danare las paredes (caso contrario dejare como el dueno me brindo la habitacion).',
    'Pagare puntualmente la pension de alquiler (pasada la fecha de pago adicionare S/1 por dia que transcurra).',
    'Mantendre limpio los pasadizos y los servicios higienicos.',
    'Todo visitante del inquilino debe hacerse conocer al dueno.'
  ];

  reglas.forEach((regla, idx) => {
    // Numero de regla (con padding izquierdo +2)
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.circle(colRightX + 4, yR + 0.5, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(white[0], white[1], white[2]);
    doc.text(String(idx + 1), colRightX + 3, yR + 2);

    // Texto de la regla (con padding derecho -4)
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    const lines = doc.splitTextToSize(regla, colRightW - 14);
    lines.forEach((line: string, lineIdx: number) => {
      doc.text(line, colRightX + 10, yR + (lineIdx * 3.8) + 1.5);
    });
    yR += (lines.length * 3.8) + 5;
  });

  // Marco alrededor de la columna derecha (alineado con caja izquierda)
  const reglasBoxH = Math.max(yR - reglasBoxY + 4, yL - datosBoxY + 4);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(colRightX - 2, reglasBoxY, colRightW + 4, reglasBoxH, 2, 2, 'S');

  // ================================================================
  // FIRMA Y HUELLA DACTILAR
  // ================================================================
  const firmaY = Math.max(yL, yR) + 18;

  // Linea separadora antes de firmas
  hLine(firmaY - 10, margin, pageWidth - margin, accent);

  // Firma del inquilino - centrado izquierda
  const firmaLineX1 = margin + 10;
  const firmaLineX2 = margin + 70;
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.5);
  doc.line(firmaLineX1, firmaY, firmaLineX2, firmaY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('FIRMA DEL INQUILINO', (firmaLineX1 + firmaLineX2) / 2, firmaY + 4, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text(nombreCompleto.toUpperCase(), (firmaLineX1 + firmaLineX2) / 2, firmaY + 8, { align: 'center' });
  doc.text(`DNI: ${dniText}`, (firmaLineX1 + firmaLineX2) / 2, firmaY + 12, { align: 'center' });

  // Huella dactilar - derecha
  const huellaW = 26;
  const huellaH = 30;
  const huellaX = pageWidth - margin - huellaW - 5;
  const huellaY = firmaY - 25;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(huellaX, huellaY, huellaW, huellaH, 2, 2, 'S');

  // Lineas guia para la huella
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.2);
  for (let i = 1; i < 4; i++) {
    doc.line(huellaX + 4, huellaY + (huellaH * i / 4), huellaX + huellaW - 4, huellaY + (huellaH * i / 4));
  }

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('HUELLA', huellaX + huellaW / 2, huellaY + huellaH + 4, { align: 'center' });
  doc.text('DACTILAR', huellaX + huellaW / 2, huellaY + huellaH + 7.5, { align: 'center' });

  // ================================================================
  // FOOTER
  // ================================================================
  // Franja inferior decorativa
  doc.setFillColor(accentLight[0], accentLight[1], accentLight[2]);
  doc.rect(0, pageHeight - 5.5, pageWidth, 1.5, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  // Texto del footer
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Documento generado electronicamente | Este contrato tiene validez legal', pageWidth / 2, pageHeight - 8, { align: 'center' });

  // ================================================================
  // GUARDAR PDF
  // ================================================================
  const fileName = `Contrato_${inquilino.nombre || 'Inquilino'}_${inquilino.apellido || ''}_${habitacion.codigo || 'HAB'}.pdf`;
  doc.save(fileName);
}

/**
 * Componente visual del contrato (preview)
 */
interface ContratoAlquilerProps {
  inquilino: Inquilino;
  habitacion: Habitacion;
  edificio?: {
    nombre: string;
    direccion: string;
    telefono?: string;
  };
  onDownload?: () => void;
}

export function ContratoAlquiler({ inquilino, habitacion, edificio, onDownload }: ContratoAlquilerProps) {
  const handleDownload = async () => {
    await generateContratoPDF({ inquilino, habitacion, edificio });
    onDownload?.();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Contrato De Alquiler</h2>
        <p className="text-sm text-gray-500">{edificio?.direccion || 'Jr. Candelaria A16'}</p>
      </div>

      <div className="border-t pt-4 space-y-3 text-sm">
        <p>
          <span className="font-medium">Inquilino:</span>{' '}
          {inquilino.nombre} {inquilino.apellido}
        </p>
        <p>
          <span className="font-medium">DNI:</span> {inquilino.dni}
        </p>
        <p>
          <span className="font-medium">Telefono:</span> {inquilino.telefono}
        </p>
        <p>
          <span className="font-medium">Habitacion:</span> {habitacion.codigo}
        </p>
        <p>
          <span className="font-medium">Monto Alquiler:</span> S/ {habitacion.montoAlquiler}
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleDownload}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar Contrato PDF
        </button>
      </div>
    </div>
  );
}

export default ContratoAlquiler;
