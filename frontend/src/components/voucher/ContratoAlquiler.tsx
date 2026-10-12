import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { formatDate } from '@/utils/formatters';
import { urlConsulta } from '@/utils/constants';
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
 * Construye el PDF del Reglamento sin decidir que hacer con el.
 * Separado de la descarga para poder tambien archivarlo en Drive.
 * Es async porque el QR se genera con await.
 */
export async function buildContratoDoc(
  data: ContratoData
): Promise<{ doc: jsPDF; fileName: string }> {
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
  const consultaUrl = urlConsulta(habitacion.id);

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(consultaUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#1B1E2A', light: '#ffffff' }
    });
  } catch (err) {
    console.error('Error generating QR:', err);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);
  let y = 0;

  // Colores del sistema de diseño (alineados con la app web)
  // Paleta formal (DESIGN.md): azul noche como acento, grises cálidos
  const accent: [number, number, number] = [27, 30, 42];      // ink
  const dark: [number, number, number] = [27, 30, 42];        // ink
  const mid: [number, number, number] = [96, 99, 110];        // gris de texto secundario
  const lightBg: [number, number, number] = [247, 245, 242];  // fondo cálido
  const borderColor: [number, number, number] = [200, 196, 191]; // líneas
  const white: [number, number, number] = [255, 255, 255];

  // Helper: linea solida fina
  const hLine = (yPos: number, x1 = margin, x2 = pageWidth - margin, color = borderColor) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.4);
    doc.line(x1, yPos, x2, yPos);
  };

  // Helper: encabezado de seccion con linea (respeta columna via xStart)
  const sectionHeader = (title: string, yPos: number, xStart: number = margin): number => {
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(title, xStart, yPos);
    const tw = doc.getTextWidth(title);
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.3);
    doc.line(xStart, yPos + 1.6, xStart + tw, yPos + 1.6);
    return yPos + 8.5;
  };

  // Helper: checkbox (check dibujado con lineas, helvetica std no soporta ✓)
  const checkbox = (label: string, checked: boolean, xPos: number, yPos: number): number => {
    const boxSize = 5.5;
    const boxY = yPos - 4.2;
    doc.setDrawColor(dark[0], dark[1], dark[2]);
    doc.setLineWidth(0.4);
    doc.rect(xPos, boxY, boxSize, boxSize, 'S');
    if (checked) {
      doc.setFillColor(dark[0], dark[1], dark[2]);
      doc.rect(xPos, boxY, boxSize, boxSize, 'F');
      // Check dibujado con 2 lineas (V corta + larga)
      doc.setDrawColor(white[0], white[1], white[2]);
      doc.setLineWidth(0.8);
      doc.setLineCap('round');
      doc.setLineJoin('round');
      const cx = xPos;
      const cy = boxY;
      doc.line(cx + 1.1, cy + 2.9, cx + 2.3, cy + 4.0);
      doc.line(cx + 2.3, cy + 4.0, cx + 4.4, cy + 1.7);
      doc.setLineCap('butt');
      doc.setLineJoin('miter');
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(label, xPos + 7.5, yPos);
    return yPos + 8;
  };

  // ================================================================
  // BANDA SUPERIOR MINIMAL
  // ================================================================
  y = 18;

  // Marco exterior simple (una sola linea sutil)
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.6);
  doc.rect(margin - 4, y - 7, contentWidth + 8, pageHeight - y - 5, 'S');
  doc.setLineWidth(0.2);
  doc.rect(margin - 3, y - 6, contentWidth + 6, pageHeight - y - 7, 'S');

  // ================================================================
  // HEADER
  // ================================================================
  // QR en tarjeta con fondo slate-50 a la derecha (se alinea con el titulo)
  const qrSize = 20;
  const qrBoxW = 26;
  const qrBoxH = 30;
  const qrBoxX = pageWidth - margin - qrBoxW;
  const qrBoxY = y - 2;

  // Caja contenedora
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 'FD');

  // QR centrado dentro de la caja
  const qrX = qrBoxX + (qrBoxW - qrSize) / 2;
  const qrY = qrBoxY + 3;
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    // Enlace invisible sobre el QR: tocarlo abre la consulta
    doc.link(qrX, qrY, qrSize, qrSize, { url: consultaUrl });
  } else {
    doc.setDrawColor(mid[0], mid[1], mid[2]);
    doc.setLineWidth(0.4);
    doc.rect(qrX, qrY, qrSize, qrSize, 'S');
    doc.setFontSize(6);
    doc.setTextColor(mid[0], mid[1], mid[2]);
    doc.text('QR', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
  }

  // Etiqueta bajo el QR, dentro de la caja
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Consulta estado de pago', qrBoxX + qrBoxW / 2, qrY + qrSize + 3.5, { align: 'center' });

  // Titulo principal (ancho maximo = espacio hasta la caja del QR con 6mm de aire)
  const titleMaxWidth = qrBoxX - margin - 6;
  doc.setFontSize(19);
  doc.setFont('times', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const titleLines = doc.splitTextToSize('REGLAMENTO INTERNO DE CONVIVENCIA', titleMaxWidth);
  doc.text(titleLines, margin, y + 6);

  // Subtitulo con nombre del edificio
  const nombreEdificio = String(edificio?.nombre || (habitacion as Habitacion & { edificioNombre?: string }).edificioNombre || '');
  let headerBottomY = y + 6 + (titleLines.length - 1) * 7;
  if (nombreEdificio) {
    doc.setFontSize(11);
    doc.setFont('times', 'italic');
    doc.setTextColor(mid[0], mid[1], mid[2]);
    doc.text(nombreEdificio, margin, headerBottomY + 6);
    headerBottomY += 6;
  }

  // Direccion y telefono
  const dirY = headerBottomY + 5.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  const direccion = String(edificio?.direccion || 'Jr. Candelaria A16');
  const telefono = String(edificio?.telefono || '051-601731');
  doc.text(`${direccion}  |  Tel: ${telefono}`, margin, dirY);

  // La linea separadora debe quedar DEBAJO de la caja del QR y de la direccion
  y = Math.max(dirY + 6, qrBoxY + qrBoxH + 5);
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);
  y += 9;

  // ================================================================
  // DECLARACION DEL INQUILINO
  // ================================================================
  const nombreCompleto = `${inquilino.nombre || ''} ${inquilino.apellido || ''}`.trim() || '________________';
  const dniText = inquilino.dni ? String(inquilino.dni).replace(/\D/g, '').padStart(8, '0') : '________';

  doc.setFontSize(12.5);
  doc.setFont('times', 'normal');
  doc.setTextColor(dark[0], dark[1], dark[2]);

  // Texto de declaracion en parrafo
  const decl1 = `YO,`;
  doc.text(decl1, margin, y);
  doc.setFont('times', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(` ${nombreCompleto.toUpperCase()}`, margin + doc.getTextWidth(decl1), y);
  const nameEndX = margin + doc.getTextWidth(decl1) + doc.getTextWidth(` ${nombreCompleto.toUpperCase()}`);
  doc.setFont('times', 'normal');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(', IDENTIFICADO(A)', nameEndX, y);

  // Subrayado del nombre
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.25);
  doc.line(margin + doc.getTextWidth(decl1) + 1, y + 1.3, nameEndX, y + 1.3);

  y += 8.5;

  doc.setFontSize(12.5);
  doc.text('CON DNI N° ', margin, y);
  doc.setFont('times', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const dniStartX = margin + doc.getTextWidth('CON DNI N° ');
  doc.text(dniText, dniStartX, y);
  // Subrayado ajustado al ancho real del texto (sin guiones sobrantes)
  const dniWidth = doc.getTextWidth(dniText);
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.line(dniStartX, y + 1.3, dniStartX + dniWidth, y + 1.3);

  doc.setFont('times', 'normal');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(', EN CALIDAD DE OCUPANTE,', dniStartX + dniWidth + 1, y);

  y += 7.5;
  doc.text('ACEPTO LAS SIGUIENTES NORMAS DE CONVIVENCIA:', margin, y);

  y += 5.5;
  hLine(y);
  y += 9.5;

  // ================================================================
  // DOS COLUMNAS: DATOS + REGLAS
  // ================================================================
  const colLeftX = margin;
  const colGap = 8;
  const colLeftW = 72;
  const colRightX = margin + colLeftW + colGap;
  const colRightW = contentWidth - colLeftW - colGap;
  let yL = y;
  let yR = y;

  // ---- COLUMNA IZQUIERDA: DATOS DEL INQUILINO ----

  // Header FUERA de la caja (arriba)
  yL = sectionHeader('DATOS DEL OCUPANTE', yL, colLeftX + 1);

  // Marco empieza DESPUES del header
  const datosBoxY = yL - 2;
  yL += 2;

  // Datos del ocupante en tabla (etiqueta | valor), con bordes en todas las celdas
  {
    const filasDatos: [string, string, boolean][] = [
      ['Celular', String(inquilino.telefono || ''), false],
      ['Contacto familiar', String(inquilino.telefonoEmergencia || ''), false],
      ['Correo', String(inquilino.email || ''), false],
      ['Habitación N°', String(habitacion.codigo || ''), true],
    ];
    const tx = colLeftX + 1;
    const tw = colLeftW - 2;
    const wEtiqueta = 27;
    const hFilaDato = 8.5;
    const tablaTop = datosBoxY + 3;
    let ty = tablaTop;
    filasDatos.forEach(([etiqueta, valor, destacado]) => {
      const h = destacado ? hFilaDato + 2 : hFilaDato;
      // Celda de etiqueta (fondo claro) y celda de valor
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.3);
      doc.rect(tx, ty, wEtiqueta, h, 'FD');
      doc.rect(tx + wEtiqueta, ty, tw - wEtiqueta, h, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(mid[0], mid[1], mid[2]);
      doc.text(etiqueta, tx + 2, ty + h / 2 + 1.2);

      doc.setFont(destacado ? 'times' : 'helvetica', 'bold');
      doc.setTextColor(dark[0], dark[1], dark[2]);
      // La letra se achica hasta que el valor quepa entero (p. ej. correos largos)
      const anchoValor = tw - wEtiqueta - 4;
      let tam = destacado ? 14 : 9.5;
      doc.setFontSize(tam);
      while (tam > 6 && doc.getTextWidth(valor) > anchoValor) {
        tam -= 0.5;
        doc.setFontSize(tam);
      }
      doc.text(valor, tx + wEtiqueta + 2.5, ty + h / 2 + (destacado ? 1.8 : 1.3));
      ty += h;
    });
    // Borde exterior más marcado
    doc.setDrawColor(dark[0], dark[1], dark[2]);
    doc.setLineWidth(0.4);
    doc.rect(tx, tablaTop, tw, ty - tablaTop, 'S');
    yL = ty + 9;
  }

  // Seccion ENTREGA
  yL = sectionHeader('ENTREGA', yL, colLeftX + 1);

  // Checkbox garantía
  yL = checkbox('Garantía entregada', garantia, colLeftX + 1, yL);

  // Checkbox llaves
  yL = checkbox('Llave de habitación', llaveHabitacion, colLeftX + 1, yL);
  yL = checkbox('Llave puerta de calle', llavePuertaCalle, colLeftX + 1, yL);

  yL += 5;

  // Fecha de ingreso
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Fecha de ingreso:', colLeftX + 1, yL);
  yL += 6;

  // Caja de fecha
  // formatDate lee la fecha sin corrimiento de zona horaria: new Date().getDate()
  // sobre una fecha guardada en medianoche UTC devuelve el dia anterior en Peru.
  let fechaPagoText = '____/____/________';
  if (inquilino.fechaIngreso) {
    const texto = formatDate(inquilino.fechaIngreso);
    if (texto !== '-') fechaPagoText = texto;
  }

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(colLeftX + 1, yL - 4.5, colLeftW - 2, 12, 'FD');

  doc.setFontSize(12);
  if (fechaPagoText === '____/____/________') {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mid[0], mid[1], mid[2]);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
  }
  doc.text(fechaPagoText, colLeftX + colLeftW / 2, yL + 3.5, { align: 'center' });

  yL += 17;

  // Monto de alquiler
  yL = sectionHeader('APORTE MENSUAL', yL, colLeftX + 1);

  // Caja destacada con monto (con padding interno generoso)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.5);
  doc.rect(colLeftX + 1, yL - 2, colLeftW - 2, 18, 'FD');
  doc.setLineWidth(0.2);
  doc.rect(colLeftX + 2, yL - 1, colLeftW - 4, 16, 'S');
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const montoText = `S/ ${habitacion.montoAlquiler || '___'}`;
  doc.text(montoText, colLeftX + colLeftW / 2, yL + 9, { align: 'center' });

  yL += 21;

  // Marco alrededor de toda la columna izquierda (con padding)
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(colLeftX - 2, datosBoxY, colLeftW + 4, yL - datosBoxY + 4, 'S');

  // ---- COLUMNA DERECHA: REGLAS ----
  // Header FUERA de la caja (arriba)
  yR = sectionHeader('NORMAS DE CONVIVENCIA', yR, colRightX + 1);

  // Marco empieza DESPUES del header
  const reglasBoxY = yR - 2;
  yR += 2;

  const reglas = [
    'En esta vivienda está totalmente prohibido tomar bebidas alcohólicas o cualquier sustancia tóxica.',
    'La puerta principal se cierra a partir de las 10:50 PM como lapso máximo.',
    'Queda parcialmente impedido hacer uso de artefactos eléctricos que requieran una mayor potencia de uso.',
    'No dañaré las paredes (caso contrario dejaré como el dueño me brindó la habitación).',
    'Entregaré puntualmente el aporte mensual acordado (pasada la fecha adicionaré S/ 1 por día que transcurra).',
    'Mantendré limpios los pasadizos y los servicios higiénicos.',
    'Todo visitante del inquilino debe hacerse conocer al dueño.'
  ];

  reglas.forEach((regla, idx) => {
    // Numero de regla
    doc.setDrawColor(dark[0], dark[1], dark[2]);
    doc.setLineWidth(0.35);
    doc.circle(colRightX + 5, yR + 1.2, 3.4, 'S');
    doc.setFontSize(9.5);
    doc.setFont('times', 'bold');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(String(idx + 1), colRightX + 5, yR + 2.7, { align: 'center' });

    // Texto de la regla
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    const lines = doc.splitTextToSize(regla, colRightW - 18);
    lines.forEach((line: string, lineIdx: number) => {
      doc.text(line, colRightX + 12, yR + (lineIdx * 5) + 2.3);
    });
    yR += (lines.length * 5) + 6;
  });

  // Marco alrededor de la columna derecha (alineado con caja izquierda)
  const reglasBoxH = Math.max(yR - reglasBoxY + 4, yL - datosBoxY + 4);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(colRightX - 2, reglasBoxY, colRightW + 4, reglasBoxH, 'S');

  // ================================================================
  // FIRMA DEL OCUPANTE (centrada, sin huella dactilar)
  // ================================================================
  // footerTop considera la banda inferior + texto de footer + disclaimer legal
  const footerTop = pageHeight - 26; // banda + "Constancia..." + disclaimer (2 lineas)
  const firmaBlockHeight = 28; // linea + label + nombre + DNI
  // La firma va bajo las columnas, pero nunca tan abajo que su DNI pise el aviso legal
  const separatorY = Math.min(
    Math.max(Math.max(yL, yR) + 5, footerTop - firmaBlockHeight - 10),
    pageHeight - 54
  );

  // Linea separadora antes de la firma
  hLine(separatorY, margin, pageWidth - margin, borderColor);

  // Firma del ocupante - centrada horizontalmente en la pagina
  const firmaLineWidth = 80;
  const firmaCenterX = pageWidth / 2;
  const firmaLineX1 = firmaCenterX - firmaLineWidth / 2;
  const firmaLineX2 = firmaCenterX + firmaLineWidth / 2;
  const firmaY = separatorY + 15; // espacio para la firma manuscrita

  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(
    `Puno, ${inquilino.fechaIngreso && formatDate(inquilino.fechaIngreso) !== '-' ? formatDate(inquilino.fechaIngreso) : '____ de ______________ de 20____'}`,
    pageWidth - margin,
    separatorY + 6,
    { align: 'right' }
  );

  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.4);
  doc.line(firmaLineX1, firmaY, firmaLineX2, firmaY);

  doc.setFontSize(10.5);
  doc.setFont('times', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('FIRMA DEL OCUPANTE', firmaCenterX, firmaY + 5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text(nombreCompleto.toUpperCase(), firmaCenterX, firmaY + 10, { align: 'center' });
  doc.text(`DNI: ${dniText}`, firmaCenterX, firmaY + 14.5, { align: 'center' });

  // ================================================================
  // FOOTER
  // ================================================================
  // Disclaimer legal (encima del texto del footer, en italica y mas chico)
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  const disclaimer = 'El presente documento tiene fines exclusivos de registro interno de convivencia y no constituye contrato de arrendamiento ni título equivalente para efectos legales, bancarios o tributarios.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 20);
  const disclaimerY = pageHeight - 14 - (disclaimerLines.length - 1) * 3;
  doc.text(disclaimerLines, pageWidth / 2, disclaimerY, { align: 'center' });

  // Banda inferior minimal (una sola linea)

  // Texto del footer
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text('Documento generado electrónicamente  |  Constancia de compromiso de cumplimiento de normas', pageWidth / 2, pageHeight - 7, { align: 'center' });

  const fileName = `Reglamento_${inquilino.nombre || 'Ocupante'}_${inquilino.apellido || ''}_${habitacion.codigo || 'HAB'}.pdf`;
  return { doc, fileName };
}

/**
 * Genera y descarga el Reglamento.
 */
export async function generateContratoPDF(data: ContratoData): Promise<void> {
  const { doc, fileName } = await buildContratoDoc(data);
  doc.save(fileName);
}

/**
 * Devuelve el Reglamento como Blob, para archivarlo en Drive.
 */
export async function getContratoBlob(data: ContratoData): Promise<Blob> {
  const { doc } = await buildContratoDoc(data);
  return doc.output('blob');
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
        <p className="text-sm text-slate-500">{edificio?.direccion || 'Jr. Candelaria A16'}</p>
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
