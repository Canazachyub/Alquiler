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
 * Genera el PDF del contrato de alquiler con mejor diseño
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
      color: {
        dark: '#323232',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR:', err);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Colores
  const primaryColor = [41, 128, 185]; // Azul
  const darkGray = [50, 50, 50];
  const lightGray = [150, 150, 150];

  // ========== HEADER ==========
  // Borde superior decorativo
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  y = 15;

  // Logo - Cuadrado con icono de casa
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, 18, 18, 3, 3, 'S');

  // Icono de casa dentro del logo
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  // Techo
  doc.triangle(margin + 9, y + 4, margin + 3, y + 10, margin + 15, y + 10, 'F');
  // Cuerpo de la casa
  doc.rect(margin + 5, y + 10, 8, 6, 'F');
  // Puerta
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 7.5, y + 12, 3, 4, 'F');

  // Titulo
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Contrato De Alquiler', margin + 23, y + 8);

  // Direccion y telefono
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  const direccion = String(edificio?.direccion || 'Jr. Candelaria A16');
  const telefono = String(edificio?.telefono || '051-601731');
  doc.text(direccion, margin + 23, y + 14);
  doc.text(telefono, margin + 23, y + 19);

  // QR Code real
  const qrX = pageWidth - margin - 22;
  const qrY = y;

  if (qrDataUrl) {
    // Agregar imagen QR real
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 22, 22);
  } else {
    // Fallback: patron QR simple si no se pudo generar
    doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setLineWidth(0.5);
    doc.rect(qrX, qrY, 22, 22);
    doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.rect(qrX + 2, qrY + 2, 5, 5, 'F');
    doc.rect(qrX + 15, qrY + 2, 5, 5, 'F');
    doc.rect(qrX + 2, qrY + 15, 5, 5, 'F');
  }

  // Etiqueta bajo el QR
  doc.setFontSize(5);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('Escanea para consultar', qrX - 1, qrY + 24);
  doc.text('estado de pago', qrX + 2, qrY + 27);

  y += 30;

  // Linea separadora
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // ========== IDENTIFICACION DEL INQUILINO ==========
  doc.setFontSize(11);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');

  const nombreCompleto = `${inquilino.nombre || ''} ${inquilino.apellido || ''}`.trim() || '________________';

  // YO ______ IDENTIFICADO(A)
  doc.text('YO', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(nombreCompleto.toUpperCase(), margin + 8, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  // Linea bajo el nombre
  const nombreWidth = doc.getTextWidth(nombreCompleto.toUpperCase());
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(margin + 8, y + 1, margin + 8 + Math.max(nombreWidth, 70), y + 1);
  doc.text('IDENTIFICADO(A)', pageWidth - margin - 32, y);

  y += 8;

  // CON DNI ______ EN CONDICION DE INQUILINO ACEPTO
  doc.text('CON DNI', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(String(inquilino.dni || '') || '________', margin + 18, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.line(margin + 18, y + 1, margin + 40, y + 1);
  doc.text('EN CONDICION DE INQUILINO ACEPTO', margin + 45, y);

  y += 8;

  // LAS SIGUIENTES CONDICIONES:
  doc.text('LAS SIGUIENTES CONDICIONES:', margin, y);

  // Linea separadora
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // ========== SECCION DE DOS COLUMNAS ==========
  const leftColX = margin;
  const rightColX = 85;
  let yLeft = y;
  let yRight = y;

  // ========== COLUMNA IZQUIERDA - DATOS DEL INQUILINO ==========
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('DATOS DEL INQUILINO', leftColX, yLeft);

  yLeft += 10;

  // Funcion para dibujar icono de telefono
  const drawPhoneIcon = (x: number, y: number, size: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    // Cuerpo del telefono (rectangulo redondeado)
    doc.roundedRect(x + size * 0.25, y + size * 0.1, size * 0.5, size * 0.8, size * 0.1, size * 0.1, 'F');
    // Pantalla (blanco)
    doc.setFillColor(255, 255, 255);
    doc.rect(x + size * 0.3, y + size * 0.2, size * 0.4, size * 0.5, 'F');
    // Boton inferior
    doc.circle(x + size * 0.5, y + size * 0.8, size * 0.06, 'F');
  };

  // Funcion para dibujar icono de correo
  const drawEmailIcon = (x: number, y: number, size: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    // Sobre (rectangulo)
    doc.rect(x + size * 0.1, y + size * 0.25, size * 0.8, size * 0.5, 'F');
    // Triangulo del sobre (blanco)
    doc.setFillColor(255, 255, 255);
    doc.triangle(
      x + size * 0.1, y + size * 0.25,
      x + size * 0.5, y + size * 0.55,
      x + size * 0.9, y + size * 0.25,
      'F'
    );
  };

  // Funcion para dibujar icono de llave/habitacion
  const drawKeyIcon = (x: number, y: number, size: number) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    // Cabeza de la llave (circulo)
    doc.circle(x + size * 0.3, y + size * 0.35, size * 0.2, 'F');
    // Agujero de la llave (blanco)
    doc.setFillColor(255, 255, 255);
    doc.circle(x + size * 0.3, y + size * 0.35, size * 0.08, 'F');
    // Cuerpo de la llave
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(x + size * 0.45, y + size * 0.3, size * 0.45, size * 0.1, 'F');
    // Dientes de la llave
    doc.rect(x + size * 0.7, y + size * 0.4, size * 0.08, size * 0.15, 'F');
    doc.rect(x + size * 0.82, y + size * 0.4, size * 0.08, size * 0.1, 'F');
  };

  // Funcion helper para campos con icono
  const drawField = (label: string, value: string, iconType: 'phone' | 'email' | 'key', yPos: number) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(label, leftColX, yPos);

    // Cuadro con icono
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(leftColX, yPos + 3, 10, 10, 1, 1, 'S');

    // Dibujar icono segun tipo
    if (iconType === 'phone') {
      drawPhoneIcon(leftColX, yPos + 3, 10);
    } else if (iconType === 'email') {
      drawEmailIcon(leftColX, yPos + 3, 10);
    } else if (iconType === 'key') {
      drawKeyIcon(leftColX, yPos + 3, 10);
    }

    // Valor
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(String(value || '') || '________________', leftColX + 14, yPos + 10);

    // Linea bajo el valor
    doc.setDrawColor(220, 220, 220);
    doc.line(leftColX + 14, yPos + 11, leftColX + 55, yPos + 11);

    return yPos + 18;
  };

  // CELULAR
  yLeft = drawField('CELULAR:', String(inquilino.telefono || ''), 'phone', yLeft);

  // CELULAR APODERADO
  yLeft = drawField('CELULAR APODERADO:', String(inquilino.telefonoEmergencia || ''), 'phone', yLeft);

  // CORREO
  yLeft = drawField('CORREO:', String(inquilino.email || ''), 'email', yLeft);

  // NUMERO DE HABITACION
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('NUMERO DE HABITACION:', leftColX, yLeft);

  yLeft += 3;
  // Cuadro con icono de llave
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(leftColX, yLeft, 10, 10, 1, 1, 'S');
  drawKeyIcon(leftColX, yLeft, 10);

  // Cuadro grande con codigo de habitacion
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(leftColX + 14, yLeft - 1, 20, 12, 2, 2, 'FD');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(habitacion.codigo || '___', leftColX + 17, yLeft + 7);

  yLeft += 18;

  // GARANTIA
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('GARANTIA', leftColX + 5, yLeft);
  // Checkbox
  doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setLineWidth(0.5);
  doc.rect(leftColX + 28, yLeft - 4, 6, 6);
  if (garantia) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('X', leftColX + 29.5, yLeft);
  }

  yLeft += 10;

  // LLAVES
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('LLAVES', leftColX, yLeft);

  yLeft += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // HABITACION checkbox
  doc.text('HABITACION:', leftColX + 5, yLeft);
  doc.rect(leftColX + 30, yLeft - 4, 6, 6);
  if (llaveHabitacion) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('X', leftColX + 31.5, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  }

  yLeft += 7;
  // PUERTA DE CALLE checkbox
  doc.text('PUERTA DE CALLE:', leftColX + 5, yLeft);
  doc.rect(leftColX + 38, yLeft - 4, 6, 6);
  if (llavePuertaCalle) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('X', leftColX + 39.5, yLeft);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  }

  yLeft += 12;

  // FECHA DE PAGO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DE PAGO:', leftColX, yLeft);

  yLeft += 5;
  // Cuadro para fecha
  doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setLineWidth(0.8);
  doc.rect(leftColX, yLeft, 45, 14);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('____/____/________', leftColX + 5, yLeft + 9);

  // ========== COLUMNA DERECHA - REGLAS ==========
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  const reglas = [
    { num: '1', text: 'EN ESTA VIVIENDA ESTA TOTALMENTE PROHIBIDO TOMAR BEBIDAS ALCOHOLICAS O CUALQUIER SUSTANCIA TOXICA.' },
    { num: '2', text: 'LA PUERTA PRINCIPAL SE CIERRA A PARTIR DE LA 10:50 PM COMO LAPSO MAXIMO.' },
    { num: '3', text: 'QUEDA PARCIALMENTE IMPEDIDO HACER USO DE ARTEFACTOS ELECTRICOS QUE REQUIERAN UNA MAYOR POTENCIA DE USO.' },
    { num: '4', text: 'NO DANARE LAS PAREDES (CASO CONTRARIO DEJARE COMO EL DUENO ME BRINDO LA HABITACION).' },
    { num: '5', text: 'PAGARE PUNTUALMENTE LA PENSION DE ALQUILER (PASADA LA FECHA DE PAGO ADICIONARE $1 POR DIA QUE TRANSCURRA).' },
    { num: '6', text: 'MANTENDRE LIMPIO EL PASADIZOS Y LOS SERVICIOS HIGIENICOS.' },
    { num: '7', text: 'TODO VISITANTE DEL INQUILINO DEBE HACERSE CONOCER AL DUENO.' }
  ];

  reglas.forEach((regla) => {
    // Numero de regla en circulo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(rightColX + 3, yRight + 1, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(regla.num, rightColX + 2, yRight + 2.5);

    // Texto de la regla
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const lines = doc.splitTextToSize(regla.text, contentWidth - 75);
    lines.forEach((line: string, idx: number) => {
      doc.text(line, rightColX + 8, yRight + (idx * 4) + 2);
    });
    yRight += (lines.length * 4) + 6;
  });

  // ========== FIRMA ==========
  const firmaY = Math.max(yLeft + 25, yRight + 15);

  // Linea para firma
  doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 55, firmaY, pageWidth - margin, firmaY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('FIRMA', pageWidth - margin - 35, firmaY + 6);

  // ========== DECORACION INFERIOR ==========
  // Olas decorativas con gradiente
  const waveStartY = pageHeight - 30;

  for (let i = 0; i < 6; i++) {
    const alpha = 0.15 + (i * 0.15);
    const r = Math.round(primaryColor[0] + (255 - primaryColor[0]) * (1 - alpha));
    const g = Math.round(primaryColor[1] + (255 - primaryColor[1]) * (1 - alpha));
    const b = Math.round(primaryColor[2] + (255 - primaryColor[2]) * (1 - alpha));

    doc.setFillColor(r, g, b);
    doc.setDrawColor(r, g, b);

    // Dibujar onda
    const waveY = waveStartY + (i * 4);
    doc.rect(0, waveY, pageWidth, pageHeight - waveY, 'F');
  }

  // Borde inferior
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');

  // ========== GUARDAR PDF ==========
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
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
