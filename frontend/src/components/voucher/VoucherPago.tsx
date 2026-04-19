import { forwardRef } from 'react';
import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatters';
import type { Pago, Inquilino, Habitacion } from '@/types';

interface VoucherPagoProps {
  pago: Pago;
  inquilino?: Inquilino | null;
  habitacion?: Habitacion | null;
  negocio?: {
    nombre: string;
    direccion: string;
    telefono: string;
    ruc?: string;
  };
}

interface GeneratePDFParams {
  pago: Pago;
  inquilino?: Inquilino | null;
  habitacion?: Habitacion | null;
  negocio?: {
    nombre: string;
    direccion: string;
    telefono?: string;
    ruc?: string;
  };
}

export const VoucherPago = forwardRef<HTMLDivElement, VoucherPagoProps>(
  ({ pago, inquilino, habitacion, negocio }, ref) => {
    const defaultNegocio = {
      nombre: 'SISTEMA DE ALQUILER',
      direccion: 'Puno - Peru',
      telefono: '',
      ruc: '',
    };

    const empresa = negocio || defaultNegocio;
    const conceptoLabel: Record<string, string> = {
      alquiler: 'ALQUILER',
      internet: 'INTERNET',
      servicios: 'SERVICIOS',
      otro: 'OTRO',
    };

    const metodoPagoLabel: Record<string, string> = {
      efectivo: 'EFECTIVO',
      yape: 'YAPE',
      plin: 'PLIN',
      transferencia: 'TRANSFERENCIA',
    };

    return (
      <div
        ref={ref}
        id="voucher-content"
        className="voucher-container bg-white p-4 font-mono text-xs"
        style={{
          width: '280px',
          margin: '0 auto',
          border: '1px dashed #ccc',
        }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
          <div className="text-base font-bold tracking-wide">{empresa.nombre}</div>
          <div className="text-[10px] text-slate-500">{empresa.direccion}</div>
        </div>

        {/* Titulo */}
        <div className="text-center mb-3">
          <div className="text-sm font-bold">COMPROBANTE DE PAGO</div>
          <div className="text-[10px] text-slate-500">N° {pago.id}</div>
        </div>

        {/* Linea separadora */}
        <div className="border-b border-dashed border-slate-400 mb-3"></div>

        {/* Info del inquilino */}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">FECHA:</span>
            <span className="font-medium">{formatDate(pago.fecha)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CLIENTE:</span>
            <span className="font-medium text-right">
              {inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">HABITACION:</span>
            <span className="font-medium">{habitacion?.codigo || pago.habitacionId}</span>
          </div>
        </div>

        {/* Linea separadora */}
        <div className="border-b border-dashed border-slate-400 mb-3"></div>

        {/* Detalle del pago */}
        <div className="mb-3">
          <div className="text-[10px] text-slate-500 mb-2">DETALLE:</div>
          <div className="flex justify-between items-center py-1">
            <div>
              <div className="font-medium">{conceptoLabel[pago.concepto] || pago.concepto}</div>
              <div className="text-[10px] text-slate-500">
                {getMonthName(pago.mes)} {pago.anio}
              </div>
            </div>
            <div className="font-bold">{formatCurrency(pago.monto)}</div>
          </div>
        </div>

        {/* Linea separadora doble */}
        <div className="border-b-2 border-double border-slate-600 mb-2"></div>

        {/* Total */}
        <div className="flex justify-between items-center text-sm font-bold mb-3">
          <span>TOTAL:</span>
          <span className="text-lg">{formatCurrency(pago.monto)}</span>
        </div>

        {/* Metodo de pago */}
        <div className="flex justify-between text-[10px] mb-3">
          <span className="text-slate-500">METODO PAGO:</span>
          <span className="font-medium">{metodoPagoLabel[pago.metodoPago] || pago.metodoPago}</span>
        </div>

        {/* Linea separadora */}
        <div className="border-b border-dashed border-slate-400 mb-3"></div>

        {/* Estado */}
        <div className="text-center mb-3">
          <span
            className={`inline-block px-3 py-1 rounded border text-[10px] font-bold ${
              pago.estado === 'pagado'
                ? 'border-success-500 text-success-700'
                : pago.estado === 'pendiente'
                ? 'border-warning-500 text-warning-700'
                : 'border-danger-500 text-danger-700'
            }`}
          >
            {pago.estado === 'pagado' ? 'PAGADO' : pago.estado === 'pendiente' ? 'PENDIENTE' : 'ANULADO'}
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-slate-400 pt-3 text-center">
          <div className="text-[10px] font-medium">GRACIAS POR SU PAGO</div>
          <div className="text-[9px] text-slate-400 mt-1">
            Documento generado electronicamente
          </div>
          <div className="text-[9px] text-slate-400">
            {new Date().toLocaleString('es-PE')}
          </div>
        </div>

        {/* Codigo de barras simulado */}
        <div className="mt-3 text-center">
          <div className="inline-block">
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="inline-block bg-black"
                style={{
                  width: Math.random() > 0.5 ? '2px' : '1px',
                  height: '20px',
                  marginRight: '1px',
                }}
              />
            ))}
          </div>
          <div className="text-[8px] text-slate-400 mt-1">{pago.id}</div>
        </div>
      </div>
    );
  }
);

VoucherPago.displayName = 'VoucherPago';

/**
 * Genera un PDF voucher profesional y formal
 */
export function generateVoucherPDF(params: GeneratePDFParams): void {
  const { pago, inquilino, habitacion, negocio } = params;

  const empresa = negocio || {
    nombre: 'SISTEMA DE ALQUILER',
    direccion: 'Puno - Peru',
  };

  const conceptoLabel: Record<string, string> = {
    alquiler: 'ALQUILER DE HABITACION',
    internet: 'SERVICIO DE INTERNET',
    servicios: 'SERVICIOS BASICOS',
    otro: 'OTRO CONCEPTO',
  };

  const metodoPagoLabel: Record<string, string> = {
    efectivo: 'EFECTIVO',
    yape: 'YAPE',
    plin: 'PLIN',
    transferencia: 'TRANSFERENCIA BANCARIA',
  };

  // PDF 80mm ancho, altura dinamica
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 220],
  });

  const pageWidth = 80;
  const ml = 6; // margin left
  const mr = 6; // margin right
  const cw = pageWidth - ml - mr; // content width
  let y = 6;

  // Colores
  const dark: [number, number, number] = [33, 37, 41];
  const mid: [number, number, number] = [108, 117, 125];
  const accent: [number, number, number] = [55, 48, 107]; // indigo oscuro
  const light: [number, number, number] = [173, 181, 189];

  // Helper: linea punteada
  const dashedLine = (yPos: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.line(ml, yPos, pageWidth - mr, yPos);
    doc.setLineDashPattern([], 0);
  };

  // Helper: fila label-valor (con padding para cajas)
  const drawRow = (label: string, value: string, yPos: number, bold = false) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mid[0], mid[1], mid[2]);
    doc.text(label, ml + 3, yPos);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(value, pageWidth - mr - 3, yPos, { align: 'right' });
    return yPos + 5;
  };

  // ========== BORDE SUPERIOR DECORATIVO ==========
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  y = 8;

  // ========== HEADER EMPRESA ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(empresa.nombre, pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text(empresa.direccion, pageWidth / 2, y, { align: 'center' });
  if (empresa.telefono) {
    y += 3;
    doc.text(`Tel: ${empresa.telefono}`, pageWidth / 2, y, { align: 'center' });
  }
  if (empresa.ruc) {
    y += 3;
    doc.text(`RUC: ${empresa.ruc}`, pageWidth / 2, y, { align: 'center' });
  }
  y += 5;

  dashedLine(y);
  y += 5;

  // ========== TITULO COMPROBANTE ==========
  // Caja con fondo para el titulo
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(ml, y - 3, cw, 10, 1.5, 1.5, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, y + 2.5, { align: 'center' });
  y += 11;

  // Numero de comprobante
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text(`Comprobante N°: ${pago.id}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  dashedLine(y);
  y += 5;

  // ========== DATOS DEL CLIENTE ==========
  // Encabezado de seccion
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('DATOS DEL CLIENTE', ml + 1, y);
  y += 5;

  // Marco alrededor de datos del cliente
  const clienteBoxY = y - 3;
  const clienteName = inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '-';

  y = drawRow('Fecha:', formatDate(pago.fecha) || '-', y);
  y = drawRow('Cliente:', clienteName, y, true);
  if (inquilino?.dni) {
    y = drawRow('DNI:', String(inquilino.dni), y);
  }
  y = drawRow('Habitacion:', habitacion?.codigo || String(pago.habitacionId || '-'), y, true);

  // Dibujar marco con padding
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, clienteBoxY, cw, y - clienteBoxY + 2, 1, 1, 'S');
  y += 5;

  dashedLine(y);
  y += 5;

  // ========== DETALLE DEL PAGO ==========
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('DETALLE', ml + 1, y);
  y += 5;

  // Marco del detalle
  const detalleBoxY = y - 3;

  // Concepto
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(conceptoLabel[pago.concepto] || pago.concepto.toUpperCase(), ml + 3, y + 1);
  y += 5;

  // Periodo
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mid[0], mid[1], mid[2]);
  doc.text(`Periodo: ${getMonthName(pago.mes)} ${pago.anio}`, ml + 3, y + 1);

  // Monto a la derecha
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(formatCurrency(pago.monto), pageWidth - mr - 3, y, { align: 'right' });
  y += 5;

  // Marco del detalle
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, detalleBoxY, cw, y - detalleBoxY + 2, 1, 1, 'S');
  y += 4;

  // ========== LINEA DOBLE TOTAL ==========
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pageWidth - mr, y);
  y += 1.2;
  doc.setLineWidth(0.2);
  doc.line(ml, y, pageWidth - mr, y);
  y += 5;

  // ========== TOTAL ==========
  // Caja de total con fondo y padding
  const totalBoxY = y - 2;
  const totalBoxH = 14;
  doc.setFillColor(245, 245, 248);
  doc.roundedRect(ml, totalBoxY, cw, totalBoxH, 1.5, 1.5, 'F');
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(ml, totalBoxY, cw, totalBoxH, 1.5, 1.5, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('TOTAL A PAGAR', ml + 4, totalBoxY + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(formatCurrency(pago.monto), pageWidth - mr - 4, totalBoxY + 7, { align: 'right' });
  y = totalBoxY + totalBoxH + 3;

  // ========== METODO DE PAGO ==========
  y = drawRow('Metodo de pago:', metodoPagoLabel[pago.metodoPago] || pago.metodoPago?.toUpperCase() || 'EFECTIVO', y, true);
  y += 3;

  dashedLine(y);
  y += 5;

  // ========== ESTADO ==========
  const estadoText = pago.estado === 'pagado' ? 'PAGADO' : pago.estado === 'pendiente' ? 'PENDIENTE' : 'ANULADO';
  const estadoBg: [number, number, number] = pago.estado === 'pagado' ? [16, 122, 87] : pago.estado === 'pendiente' ? [180, 130, 20] : [190, 30, 45];
  const estadoTextColor: [number, number, number] = [255, 255, 255];

  // Badge del estado centrado con padding
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const estadoW = doc.getTextWidth(estadoText) + 12;
  const estadoBoxX = (pageWidth - estadoW) / 2;
  doc.setFillColor(estadoBg[0], estadoBg[1], estadoBg[2]);
  doc.roundedRect(estadoBoxX, y - 2, estadoW, 8, 2, 2, 'F');
  doc.setTextColor(estadoTextColor[0], estadoTextColor[1], estadoTextColor[2]);
  doc.text(estadoText, pageWidth / 2, y + 3, { align: 'center' });
  y += 11;

  dashedLine(y);
  y += 5;

  // ========== FOOTER ==========
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text('Gracias por su pago', pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(light[0], light[1], light[2]);
  doc.text('Documento generado electronicamente', pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.text(new Date().toLocaleString('es-PE'), pageWidth / 2, y, { align: 'center' });
  y += 6;

  // ========== CODIGO DE BARRAS SIMULADO ==========
  doc.setFillColor(dark[0], dark[1], dark[2]);
  const barcodeWidth = 46;
  const barcodeX = (pageWidth - barcodeWidth) / 2;

  let seed = pago.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < 35; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const barW = (seed / 233280) > 0.5 ? 1.3 : 0.7;
    doc.rect(barcodeX + i * 1.3, y, barW, 7, 'F');
  }
  y += 9;

  doc.setFontSize(5.5);
  doc.setTextColor(light[0], light[1], light[2]);
  doc.text(pago.id, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // ========== BORDE INFERIOR DECORATIVO ==========
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, y, pageWidth, 2.5, 'F');

  // Guardar el PDF
  doc.save(`voucher_${pago.id}.pdf`);
}

// Funcion para imprimir el voucher
export function printVoucher(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Voucher de Pago</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 0;
            margin: 0;
          }
          @media print {
            body {
              width: 80mm;
            }
            @page {
              margin: 0;
              size: 80mm auto;
            }
          }
          .voucher-container {
            width: 80mm;
            padding: 5mm;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
