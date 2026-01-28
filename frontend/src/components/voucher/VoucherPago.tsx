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
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="text-base font-bold tracking-wide">{empresa.nombre}</div>
          <div className="text-[10px] text-gray-500">{empresa.direccion}</div>
        </div>

        {/* Titulo */}
        <div className="text-center mb-3">
          <div className="text-sm font-bold">COMPROBANTE DE PAGO</div>
          <div className="text-[10px] text-gray-500">N° {pago.id}</div>
        </div>

        {/* Linea separadora */}
        <div className="border-b border-dashed border-gray-400 mb-3"></div>

        {/* Info del inquilino */}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">FECHA:</span>
            <span className="font-medium">{formatDate(pago.fecha)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">CLIENTE:</span>
            <span className="font-medium text-right">
              {inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">HABITACION:</span>
            <span className="font-medium">{habitacion?.codigo || pago.habitacionId}</span>
          </div>
        </div>

        {/* Linea separadora */}
        <div className="border-b border-dashed border-gray-400 mb-3"></div>

        {/* Detalle del pago */}
        <div className="mb-3">
          <div className="text-[10px] text-gray-500 mb-2">DETALLE:</div>
          <div className="flex justify-between items-center py-1">
            <div>
              <div className="font-medium">{conceptoLabel[pago.concepto] || pago.concepto}</div>
              <div className="text-[10px] text-gray-500">
                {getMonthName(pago.mes)} {pago.anio}
              </div>
            </div>
            <div className="font-bold">{formatCurrency(pago.monto)}</div>
          </div>
        </div>

        {/* Linea separadora doble */}
        <div className="border-b-2 border-double border-gray-600 mb-2"></div>

        {/* Total */}
        <div className="flex justify-between items-center text-sm font-bold mb-3">
          <span>TOTAL:</span>
          <span className="text-lg">{formatCurrency(pago.monto)}</span>
        </div>

        {/* Metodo de pago */}
        <div className="flex justify-between text-[10px] mb-3">
          <span className="text-gray-500">METODO PAGO:</span>
          <span className="font-medium">{metodoPagoLabel[pago.metodoPago] || pago.metodoPago}</span>
        </div>

        {/* Linea separadora */}
        <div className="border-b border-dashed border-gray-400 mb-3"></div>

        {/* Estado */}
        <div className="text-center mb-3">
          <span
            className={`inline-block px-3 py-1 rounded border text-[10px] font-bold ${
              pago.estado === 'pagado'
                ? 'border-green-500 text-green-700'
                : pago.estado === 'pendiente'
                ? 'border-yellow-500 text-yellow-700'
                : 'border-red-500 text-red-700'
            }`}
          >
            {pago.estado === 'pagado' ? 'PAGADO' : pago.estado === 'pendiente' ? 'PENDIENTE' : 'ANULADO'}
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-gray-400 pt-3 text-center">
          <div className="text-[10px] font-medium">GRACIAS POR SU PAGO</div>
          <div className="text-[9px] text-gray-400 mt-1">
            Documento generado electronicamente
          </div>
          <div className="text-[9px] text-gray-400">
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
          <div className="text-[8px] text-gray-400 mt-1">{pago.id}</div>
        </div>
      </div>
    );
  }
);

VoucherPago.displayName = 'VoucherPago';

/**
 * Genera un PDF estilo voucher de impresora termica
 */
export function generateVoucherPDF(params: GeneratePDFParams): void {
  const { pago, inquilino, habitacion, negocio } = params;

  const empresa = negocio || {
    nombre: 'SISTEMA DE ALQUILER',
    direccion: 'Puno - Peru',
  };

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

  // Crear PDF con ancho de 80mm (tipico de impresora termica)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200],
  });

  const pageWidth = 80;
  const marginLeft = 5;
  const marginRight = 5;
  let y = 10;

  // Configurar fuente
  doc.setFont('courier', 'normal');

  // ========== HEADER ==========
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.text(empresa.nombre, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100);
  doc.text(empresa.direccion, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Linea separadora
  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  // ========== TITULO ==========
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100);
  doc.text(`N° ${pago.id}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Linea separadora
  doc.setDrawColor(150);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  // ========== INFO CLIENTE ==========
  doc.setTextColor(0);
  doc.setFontSize(8);

  // Fecha
  doc.setFont('courier', 'normal');
  doc.setTextColor(100);
  doc.text('FECHA:', marginLeft, y);
  doc.setTextColor(0);
  doc.text(formatDate(pago.fecha) || '-', pageWidth - marginRight, y, { align: 'right' });
  y += 5;

  // Cliente
  doc.setTextColor(100);
  doc.text('CLIENTE:', marginLeft, y);
  doc.setTextColor(0);
  const clienteName = inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '-';
  doc.text(clienteName, pageWidth - marginRight, y, { align: 'right' });
  y += 5;

  // Habitacion
  doc.setTextColor(100);
  doc.text('HABITACION:', marginLeft, y);
  doc.setTextColor(0);
  doc.text(habitacion?.codigo || '-', pageWidth - marginRight, y, { align: 'right' });
  y += 6;

  // Linea separadora
  doc.setDrawColor(150);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  // ========== DETALLE ==========
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('DETALLE:', marginLeft, y);
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont('courier', 'bold');
  doc.text(conceptoLabel[pago.concepto] || pago.concepto.toUpperCase(), marginLeft, y);
  doc.text(formatCurrency(pago.monto), pageWidth - marginRight, y, { align: 'right' });
  y += 4;

  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100);
  doc.text(`${getMonthName(pago.mes)} ${pago.anio}`, marginLeft, y);
  y += 8;

  // Linea separadora doble
  doc.setDrawColor(50);
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 1;
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  doc.setLineWidth(0.2);
  y += 6;

  // ========== TOTAL ==========
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('TOTAL:', marginLeft, y);

  doc.setFontSize(14);
  doc.text(formatCurrency(pago.monto), pageWidth - marginRight, y, { align: 'right' });
  y += 8;

  // Metodo de pago
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100);
  doc.text('METODO PAGO:', marginLeft, y);
  doc.setTextColor(0);
  doc.text(metodoPagoLabel[pago.metodoPago] || pago.metodoPago?.toUpperCase() || 'EFECTIVO', pageWidth - marginRight, y, { align: 'right' });
  y += 6;

  // Linea separadora
  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  // ========== ESTADO ==========
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont('courier', 'bold');

  const estadoText = pago.estado === 'pagado' ? 'PAGADO' : pago.estado === 'pendiente' ? 'PENDIENTE' : 'ANULADO';
  const estadoColor: [number, number, number] = pago.estado === 'pagado' ? [34, 139, 34] : pago.estado === 'pendiente' ? [218, 165, 32] : [220, 20, 60];

  // Dibujar recuadro del estado
  const estadoWidth = doc.getTextWidth(estadoText) + 8;
  const estadoX = (pageWidth - estadoWidth) / 2;

  doc.setDrawColor(estadoColor[0], estadoColor[1], estadoColor[2]);
  doc.setLineDashPattern([], 0);
  doc.roundedRect(estadoX, y - 4, estadoWidth, 7, 1, 1, 'S');

  doc.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2]);
  doc.text(estadoText, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Linea separadora
  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  // ========== FOOTER ==========
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont('courier', 'bold');
  doc.text('GRACIAS POR SU PAGO', pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(6);
  doc.setFont('courier', 'normal');
  doc.setTextColor(120);
  doc.text('Documento generado electronicamente', pageWidth / 2, y, { align: 'center' });
  y += 3;

  doc.text(new Date().toLocaleString('es-PE'), pageWidth / 2, y, { align: 'center' });
  y += 8;

  // ========== CODIGO DE BARRAS SIMULADO ==========
  doc.setFillColor('0');
  const barcodeWidth = 50;
  const barcodeX = (pageWidth - barcodeWidth) / 2;

  // Generar barras consistentes basadas en el ID
  let seed = pago.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < 40; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const barWidth = (seed / 233280) > 0.5 ? 1.5 : 0.8;
    doc.rect(barcodeX + i * 1.2, y, barWidth, 8, 'F');
  }
  y += 10;

  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(pago.id, pageWidth / 2, y, { align: 'center' });

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
