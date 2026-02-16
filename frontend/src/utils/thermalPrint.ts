/**
 * Utilidad para imprimir en la impresora termica WOSCALE M12
 * Se comunica con print_server.py corriendo en localhost:5100
 */

import type { Pago, Inquilino, Habitacion } from '@/types';

const PRINT_SERVER_URL = 'http://localhost:5100';

interface PrintVoucherData {
  pago: Pago;
  inquilino?: Inquilino | null;
  habitacion?: Habitacion | null;
  negocio?: {
    nombre: string;
    direccion: string;
  };
  energy?: number;
}

interface PrintServerStatus {
  status: string;
  printer_connected: boolean;
}

/**
 * Verifica si el servidor de impresion esta activo y la impresora conectada
 */
export async function checkThermalPrinter(): Promise<PrintServerStatus> {
  const response = await fetch(`${PRINT_SERVER_URL}/health`, {
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error('Print server not available');
  return response.json();
}

/**
 * Conecta la impresora termica
 */
export async function connectThermalPrinter(address?: string): Promise<void> {
  const response = await fetch(`${PRINT_SERVER_URL}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error conectando impresora');
  }
}

/**
 * Imprime un voucher de pago en la impresora termica
 */
export async function printThermalVoucher(data: PrintVoucherData): Promise<void> {
  const payload = {
    pago: {
      id: data.pago.id,
      fecha: data.pago.fecha,
      mes: data.pago.mes,
      anio: data.pago.anio,
      concepto: data.pago.concepto,
      monto: data.pago.monto,
      metodoPago: data.pago.metodoPago,
      estado: data.pago.estado,
      habitacionId: data.pago.habitacionId,
    },
    inquilino: data.inquilino
      ? { nombre: data.inquilino.nombre, apellido: data.inquilino.apellido }
      : undefined,
    habitacion: data.habitacion
      ? { codigo: data.habitacion.codigo }
      : undefined,
    negocio: data.negocio || {
      nombre: 'SISTEMA DE ALQUILER',
      direccion: 'Puno - Peru',
    },
    energy: data.energy,
  };

  const response = await fetch(`${PRINT_SERVER_URL}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Error al imprimir');
  }
}

/**
 * Verifica si el servidor de impresion esta disponible (check rapido)
 * Retorna true si el servidor esta corriendo (no requiere impresora conectada)
 */
export async function isThermalPrinterAvailable(): Promise<boolean> {
  try {
    const status = await checkThermalPrinter();
    return status.status === 'ok';
  } catch {
    return false;
  }
}
