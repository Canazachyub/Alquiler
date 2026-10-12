import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatters';
import { coberturaDePago } from '@/utils/modalidad';
import type { Pago, Inquilino, Habitacion } from '@/types';

/**
 * Voucher pensado para el celular (se envía por WhatsApp): proporción de pantalla de
 * teléfono, letra grande, monto y sello arriba, cobertura del pago destacada y QR de consulta.
 * El ticket de 80 mm (buildVoucherDoc) se mantiene para imprimir.
 */

interface Params {
  pago: Pago;
  inquilino?: Inquilino | null;
  habitacion?: Habitacion | null;
  negocio?: { nombre: string; direccion: string; telefono?: string; ruc?: string };
}

type RGB = [number, number, number];
const TINTA: RGB = [27, 30, 42];
const GRIS: RGB = [111, 113, 123];
const LINEA: RGB = [231, 227, 223];
const FONDO: RGB = [245, 243, 241];
const VERDE: RGB = [16, 150, 100];
const VERDE_FONDO: RGB = [226, 245, 235];
const ACENTO: RGB = [43, 92, 230];

const CONCEPTO: Record<string, string> = {
  alquiler: 'Alquiler de habitación',
  internet: 'Servicio de internet',
  servicios: 'Servicios básicos',
  otro: 'Otro concepto',
};
const METODO: Record<string, string> = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia' };

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function hasta999(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const resto = r < 30 ? UNIDADES[r] : `${DECENAS[Math.floor(r / 10)]}${r % 10 ? ` y ${UNIDADES[r % 10]}` : ''}`;
  return [CENTENAS[c], resto].filter(Boolean).join(' ');
}

/** 180.5 → "ciento ochenta con 50/100 soles" */
export function montoEnLetras(monto: number): string {
  const entero = Math.floor(Math.abs(monto));
  const cent = Math.round((Math.abs(monto) - entero) * 100);
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  const texto =
    entero === 0
      ? 'cero'
      : [miles ? (miles === 1 ? 'mil' : `${hasta999(miles)} mil`) : '', hasta999(resto)].filter(Boolean).join(' ');
  return `${texto} con ${String(cent).padStart(2, '0')}/100 soles`;
}

export async function buildVoucherMovilDoc({ pago, inquilino, habitacion, negocio }: Params): Promise<{ doc: jsPDF; fileName: string }> {
  const W = 100;
  const M = 7;

  const empresa = negocio?.nombre || 'Sistema de Alquiler Puno';
  const direccion = negocio?.direccion || 'Puno - Perú';
  const cobertura = pago.concepto === 'alquiler' || !pago.concepto ? coberturaDePago(pago, inquilino, habitacion as { diaPago?: number } | null) : null;

  // Filas del detalle
  const filas: [string, string][] = [
    ['Inquilino', inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '—'],
    ['DNI', inquilino?.dni ? String(inquilino.dni).replace(/\D/g, '').padStart(8, '0') : '—'],
    [
      'Habitación',
      `${habitacion?.codigo || pago.habitacionId}${
        habitacion?.codigo && /^[A-Za-zÑñ]+/.test(habitacion.codigo) ? ` · Piso ${habitacion.codigo.match(/^[A-Za-zÑñ]+/)![0].toUpperCase()}` : ''
      }`,
    ],
    ['Concepto', CONCEPTO[pago.concepto] || pago.concepto],
    ['Periodo', `${getMonthName(Number(pago.mes))} ${pago.anio}`],
    ['Método', METODO[pago.metodoPago] || pago.metodoPago],
    ...(pago.referencia ? ([['N° operación', String(pago.referencia)]] as [string, string][]) : []),
  ];

  // Altura según el contenido (mínimo proporción de pantalla de teléfono 9:16)
  const alto = 83 + (cobertura ? 25 : 0) + filas.length * 7.4 + (cobertura ? 10 : 0) + 40;
  const H = Math.max(178, Math.ceil(alto));
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H] });
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const relleno = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const trazo = (c: RGB, w = 0.3) => {
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(w);
  };


  // QR a la consulta pública del cuarto
  let qr = '';
  try {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    qr = await QRCode.toDataURL(`${base}/consulta?hab=${pago.habitacionId}`, { width: 200, margin: 0, color: { dark: '#1B1E2A', light: '#ffffff' } });
  } catch {
    /* sin QR */
  }

  // ===== Encabezado oscuro =====
  relleno(TINTA);
  doc.rect(0, 0, W, 30, 'F');
  // Logo: tres puntos de colores (DESIGN.md)
  ([[68, 149, 140], [223, 94, 65], [180, 160, 74]] as RGB[]).forEach((c, i) => {
    relleno(c);
    doc.circle(M + 2.2 + i * 3.4, 9.6, 2, 'F');
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text(empresa.toUpperCase(), M + 12.5, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 203, 214);
  doc.text(direccion, M + 12.5, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('COMPROBANTE DE PAGO', M, 25);
  doc.text(`N° ${pago.id}`, W - M, 25, { align: 'right' });

  // ===== Tarjeta del monto =====
  let y = 37;
  relleno(VERDE_FONDO);
  doc.roundedRect(M, y, W - 2 * M, 37, 3, 3, 'F');
  // Sello PAGADO con check dibujado
  relleno(VERDE);
  doc.circle(M + 9, y + 10, 4.2, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.9);
  doc.line(M + 7, y + 10.2, M + 8.6, y + 11.8);
  doc.line(M + 8.6, y + 11.8, M + 11.4, y + 8.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  color(VERDE);
  doc.text(pago.estado === 'anulado' ? 'ANULADO' : 'PAGADO', M + 15.5, y + 11.4);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  color(GRIS);
  doc.text(formatDate(pago.fecha), W - M - 4, y + 11.2, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  color(TINTA);
  doc.text(formatCurrency(Number(pago.monto)), W / 2, y + 25, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  color(GRIS);
  const letras = montoEnLetras(Number(pago.monto));
  doc.text(`Son: ${letras.charAt(0).toUpperCase()}${letras.slice(1)}`, W / 2, y + 32, { align: 'center' });
  y += 45;

  // ===== Cobertura destacada =====
  if (cobertura) {
    trazo(ACENTO, 0.6);
    relleno([238, 242, 254]);
    doc.roundedRect(M, y, W - 2 * M, 19, 2.5, 2.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    color(ACENTO);
    doc.text(`CUBRE · ${cobertura.modalidad === 'vencido' ? 'MES VENCIDO' : 'PAGO ADELANTADO'}`, M + 4, y + 5.6);
    doc.setFontSize(12.5);
    color(TINTA);
    doc.text(`${cobertura.desde}  al  ${cobertura.hasta}`, M + 4, y + 13.4);
    y += 25;
  }

  // ===== Detalle en filas =====
  doc.setFontSize(9.5);
  filas.forEach(([k, v], i) => {
    if (i % 2 === 0) {
      relleno(FONDO);
      doc.rect(M, y - 4.6, W - 2 * M, 7.4, 'F');
    }
    doc.setFont('helvetica', 'normal');
    color(GRIS);
    doc.text(k, M + 3, y);
    doc.setFont('helvetica', 'bold');
    color(TINTA);
    // Valores largos (nombres) achican la letra hasta caber completos
    const ancho = W - 2 * M - 26;
    let tam = 9.5;
    doc.setFontSize(tam);
    while (tam > 6.5 && doc.getTextWidth(v) > ancho) {
      tam -= 0.5;
      doc.setFontSize(tam);
    }
    doc.text(v, W - M - 3, y, { align: 'right' });
    doc.setFontSize(9.5);
    y += 7.4;
  });

  // Próximo pago (solo alquiler adelantado: al día siguiente de terminar la cobertura)
  if (cobertura) {
    const [d, m, a] = cobertura.hasta.split('/').map(Number);
    const proximo = new Date(a, m - 1, d + 1);
    y += 2;
    trazo(LINEA, 0.3);
    doc.line(M, y, W - M, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    color(GRIS);
    doc.text('Próximo pago', M + 3, y);
    doc.setFont('helvetica', 'bold');
    color(TINTA);
    doc.text(
      proximo.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
      W - M - 3,
      y,
      { align: 'right' }
    );
  }

  // ===== Pie: QR + gracias =====
  const yPie = H - 30;
  trazo(LINEA, 0.3);
  doc.line(M, yPie - 3, W - M, yPie - 3);
  if (qr) doc.addImage(qr, 'PNG', M, yPie, 22, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  color(TINTA);
  doc.text('¡Gracias por su pago!', M + 27, yPie + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  color(GRIS);
  doc.text(doc.splitTextToSize('Escanee el código para ver el estado de pago de su habitación.', W - 2 * M - 27), M + 27, yPie + 12);
  doc.setFontSize(6.5);
  doc.text('Conserve este comprobante.', M + 27, yPie + 18);
  doc.text(`Emitido el ${new Date().toLocaleString('es-PE')}`, M + 27, yPie + 21.5);

  relleno(TINTA);
  doc.rect(0, H - 3, W, 3, 'F');

  const nombre = inquilino ? `${inquilino.nombre}`.split(' ')[0] : 'Inquilino';
  const fileName = `Voucher_${pago.id}_${habitacion?.codigo ?? ''}_${nombre}.pdf`.replace(/\s+/g, '_');
  return { doc, fileName };
}
