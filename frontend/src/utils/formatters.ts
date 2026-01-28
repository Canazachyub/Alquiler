import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MESES } from './constants';

/**
 * Formatea un número como moneda (Soles peruanos)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

/**
 * Formatea una fecha ISO a formato legible
 */
export function formatDate(dateString: string | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatStr, { locale: es });
  } catch {
    return '-';
  }
}

/**
 * Formatea una fecha a formato largo
 */
export function formatDateLong(dateString: string): string {
  return formatDate(dateString, "d 'de' MMMM 'de' yyyy");
}

/**
 * Obtiene el nombre del mes
 */
export function getMonthName(month: number): string {
  const mes = MESES.find(m => m.value === month);
  return mes?.label || '';
}

/**
 * Formatea mes y año
 */
export function formatMonthYear(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea un número de teléfono
 */
export function formatPhone(phone: string | number | undefined | null): string {
  if (!phone && phone !== 0) return '-';
  // Convertir a string si es número (Google Sheets puede devolver números)
  const phoneStr = String(phone);
  // Formato: 987 654 321
  const cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phoneStr;
}

/**
 * Formatea DNI
 */
export function formatDNI(dni: string | number | undefined | null): string {
  if (!dni && dni !== 0) return '-';
  const dniStr = String(dni);
  const cleaned = dniStr.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  }
  return dniStr;
}

/**
 * Trunca texto largo
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitaliza primera letra
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Genera iniciales de un nombre
 */
export function getInitials(name: string, apellido?: string): string {
  const first = name?.charAt(0)?.toUpperCase() || '';
  const last = apellido?.charAt(0)?.toUpperCase() || '';
  return first + last || '??';
}
