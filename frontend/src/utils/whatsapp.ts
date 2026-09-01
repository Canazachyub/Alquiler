import { getVoucherFile } from '@/components/voucher';
import { formatCurrency, getMonthName } from '@/utils/formatters';
import type { Pago, Inquilino, Habitacion, HabitacionConDetalles } from '@/types';

const CODIGO_PAIS_PERU = '51';

/**
 * Normaliza un telefono peruano al formato que espera wa.me (sin +, sin espacios).
 * Acepta '951 234 567', '951234567' o '51951234567'.
 * Devuelve null si no se puede interpretar, para no abrir un chat con un numero inventado.
 */
export function normalizarTelefonoPeru(telefono?: string | number | null): string | null {
  const digitos = String(telefono ?? '').replace(/\D/g, '');
  if (!digitos) return null;

  // Ya viene con codigo de pais
  if (digitos.length === 11 && digitos.startsWith(CODIGO_PAIS_PERU)) return digitos;

  // Celular peruano: 9 digitos empezando en 9
  if (digitos.length === 9 && digitos.startsWith('9')) return CODIGO_PAIS_PERU + digitos;

  return null;
}

interface CompartirVoucherParams {
  pago: Pago;
  inquilino?: Inquilino | null;
  habitacion?: Habitacion | HabitacionConDetalles | null;
  negocio?: { nombre: string; direccion: string; telefono?: string; ruc?: string };
}

export type ResultadoCompartir =
  | { via: 'compartido' }
  | { via: 'descarga-y-chat' }
  | { via: 'solo-descarga'; motivo: 'sin-telefono' }
  | { via: 'cancelado' };

function construirMensaje({ pago, inquilino, habitacion }: CompartirVoucherParams): string {
  const nombre = inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '';
  const codigo = habitacion?.codigo || pago.habitacionId;

  return [
    nombre ? `Hola ${nombre},` : 'Hola,',
    '',
    `Comprobante de pago N° ${pago.id}`,
    `Habitación: ${codigo}`,
    `Concepto: ${pago.concepto}`,
    `Periodo: ${getMonthName(pago.mes)} ${pago.anio}`,
    `Monto: ${formatCurrency(pago.monto)}`,
    '',
    'Gracias por su pago.',
  ].join('\n');
}

/**
 * Genera el voucher y lo hace llegar por WhatsApp.
 *
 * WhatsApp no permite adjuntar un archivo desde un enlace web: wa.me solo precarga texto.
 * Por eso hay dos caminos:
 *  - Web Share API nivel 2 (Android): comparte el PDF de verdad al chat.
 *  - Resto: descarga el PDF y abre el chat con el mensaje escrito para adjuntarlo a mano.
 */
export async function compartirVoucherWhatsApp(
  params: CompartirVoucherParams
): Promise<ResultadoCompartir> {
  const { file, fileName } = getVoucherFile(params);
  const mensaje = construirMensaje(params);
  const telefono = normalizarTelefonoPeru(params.inquilino?.telefono);

  // Camino 1: compartir el archivo de verdad (celular)
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: mensaje, title: fileName });
      return { via: 'compartido' };
    } catch (error) {
      // El usuario cerro el menu de compartir: no es un error que valga reportar
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { via: 'cancelado' };
      }
      // Cualquier otro fallo cae al camino 2
    }
  }

  // Camino 2: descargar y abrir el chat
  descargarArchivo(file, fileName);

  if (!telefono) {
    return { via: 'solo-descarga', motivo: 'sin-telefono' };
  }

  window.open(
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
    '_blank',
    'noopener,noreferrer'
  );
  return { via: 'descarga-y-chat' };
}

function descargarArchivo(file: File, fileName: string): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
