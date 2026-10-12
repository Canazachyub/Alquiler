/**
 * Plano de piso como cuadrícula de texto (estilo CSS grid-template-areas).
 *
 *   escalera  A1       A2
 *   bano      pasillo  pasillo
 *   A5        A4       A3
 *
 * - Cada fila es una línea; las celdas se separan con espacios.
 * - Repetir un nombre en celdas contiguas lo ensancha (debe formar un rectángulo).
 * - Un código de habitación (A1, 101…) se enlaza con la habitación del piso.
 * - Palabras reservadas: pasillo, bano/baño, escalera/gradas, entrada/calle, cocina, lavanderia, patio.
 * - "." deja la celda vacía.
 *
 * En la hoja se guarda en una sola línea con filas separadas por "|".
 */

export type TipoEspacio =
  | 'habitacion'
  | 'pasillo'
  | 'bano'
  | 'escalera'
  | 'entrada'
  | 'cocina'
  | 'lavanderia'
  | 'patio'
  | 'vacio';

const RESERVADAS: Record<string, TipoEspacio> = {
  pasillo: 'pasillo',
  bano: 'bano',
  'baño': 'bano',
  escalera: 'escalera',
  escaleras: 'escalera',
  gradas: 'escalera',
  entrada: 'entrada',
  puerta: 'entrada',
  calle: 'entrada',
  cocina: 'cocina',
  lavanderia: 'lavanderia',
  'lavandería': 'lavanderia',
  patio: 'patio',
  '.': 'vacio',
};

export interface AreaPlano {
  /** Texto tal cual lo escribió el usuario */
  token: string;
  tipo: TipoEspacio;
  /** Nombre seguro para grid-area (los códigos pueden empezar con dígito) */
  areaName: string;
  fila: number;
  col: number;
  filas: number;
  cols: number;
}

export interface PlanoParseado {
  celdas: string[][];
  areas: AreaPlano[];
  errores: string[];
  /** Valor CSS para gridTemplateAreas */
  templateAreas: string;
  columnas: number;
}

export function tipoDeToken(token: string): TipoEspacio {
  return RESERVADAS[token.toLowerCase()] ?? 'habitacion';
}

/** Texto del editor (multilínea) → valor guardado en la hoja */
export function serializarPlano(texto: string): string {
  return texto
    .split('\n')
    .map((l) => l.trim().split(/\s+/).filter(Boolean).join(' '))
    .filter(Boolean)
    .join('|');
}

/** Valor guardado → texto del editor, con columnas alineadas */
export function planoATexto(plano: string): string {
  const filas = plano.split('|').map((f) => f.trim().split(/\s+/).filter(Boolean));
  const anchos: number[] = [];
  filas.forEach((f) => f.forEach((c, i) => (anchos[i] = Math.max(anchos[i] ?? 0, c.length))));
  return filas.map((f) => f.map((c, i) => c.padEnd(anchos[i])).join('  ').trimEnd()).join('\n');
}

export function parsearPlano(plano: string): PlanoParseado {
  const celdas = plano
    .split(/\||\n/)
    .map((f) => f.trim().split(/\s+/).filter(Boolean))
    .filter((f) => f.length > 0)
    // La calle no es parte del edificio: se ignoran filas que solo dicen "calle"
    .filter((f) => !f.every((t) => t.toLowerCase() === 'calle'));
  const errores: string[] = [];
  const columnas = Math.max(0, ...celdas.map((f) => f.length));

  if (celdas.some((f) => f.length !== columnas)) {
    errores.push(`Todas las filas deben tener ${columnas} celdas.`);
    celdas.forEach((f) => {
      while (f.length < columnas) f.push('.');
    });
  }

  // Agrupar celdas por token (sin distinguir mayúsculas)
  const posiciones = new Map<string, { token: string; celdas: [number, number][] }>();
  celdas.forEach((fila, r) =>
    fila.forEach((token, c) => {
      if (token === '.') return;
      const key = token.toLowerCase();
      const entry = posiciones.get(key) ?? { token, celdas: [] };
      entry.celdas.push([r, c]);
      posiciones.set(key, entry);
    })
  );

  const areas: AreaPlano[] = [];
  const nombres = new Map<string, string>();
  let i = 0;
  posiciones.forEach(({ token, celdas: pos }, key) => {
    const filasIdx = pos.map(([r]) => r);
    const colsIdx = pos.map(([, c]) => c);
    const r0 = Math.min(...filasIdx);
    const r1 = Math.max(...filasIdx);
    const c0 = Math.min(...colsIdx);
    const c1 = Math.max(...colsIdx);
    const esRectangulo =
      pos.length === (r1 - r0 + 1) * (c1 - c0 + 1) &&
      pos.every(([r, c]) => r >= r0 && r <= r1 && c >= c0 && c <= c1);
    if (!esRectangulo) {
      errores.push(`"${token}" debe formar un rectángulo (repítelo solo en celdas contiguas).`);
      return;
    }
    const areaName = `p${i++}`;
    nombres.set(key, areaName);
    areas.push({
      token,
      tipo: tipoDeToken(token),
      areaName,
      fila: r0,
      col: c0,
      filas: r1 - r0 + 1,
      cols: c1 - c0 + 1,
    });
  });

  const templateAreas = celdas
    .map((fila) => `"${fila.map((t) => (t === '.' ? '.' : nombres.get(t.toLowerCase()) ?? '.')).join(' ')}"`)
    .join(' ');

  return { celdas, areas, errores, templateAreas, columnas };
}

/** Orden natural de códigos: A2 < A10 */
export function compararCodigos(a: string, b: string): number {
  return a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' });
}

/** Letra del piso a partir de sus códigos (A1, A2… → "A"). Cada letra es un piso alquilado. */
export function letraDePiso(codigos: string[]): string | null {
  const cuenta = new Map<string, number>();
  codigos.forEach((c) => {
    const m = c.trim().match(/^([A-Za-zÑñ]+)\s*\d+$/);
    if (m) cuenta.set(m[1].toUpperCase(), (cuenta.get(m[1].toUpperCase()) ?? 0) + 1);
  });
  let mejor: string | null = null;
  cuenta.forEach((n, l) => {
    if (!mejor || n > (cuenta.get(mejor) ?? 0)) mejor = l;
  });
  return mejor;
}

/** Plantillas de los pisos tipo de Puno (cuartos 1–5 alrededor de un pasillo en L) */
export const PLANTILLAS: { id: string; nombre: string; generar: (letra: string) => string }[] = [
  {
    id: 'con-bano',
    nombre: 'Con baño (pisos A, B, D)',
    generar: (L) => `escalera ${L}1 ${L}2|bano pasillo pasillo|${L}5 ${L}4 ${L}3`,
  },
  {
    id: 'sin-bano',
    nombre: 'Sin baño (piso C)',
    generar: (L) => `entrada ${L}1 ${L}2|pasillo pasillo pasillo|${L}5 ${L}4 ${L}3`,
  },
  {
    id: 'calle',
    nombre: 'Planta baja (piso F)',
    generar: (L) => `${L}2 ${L}2 ${L}2 ${L}1 ${L}1|pasillo pasillo pasillo pasillo pasillo|gradas gradas ${L}3 ${L}3 ${L}3`,
  },
];

/**
 * Distribución por defecto cuando el piso aún no tiene plano: habitaciones a
 * ambos lados de un pasillo, numeradas en sentido horario (como el piso A).
 */
export function planoAutomatico(codigos: string[]): string {
  const orden = [...codigos].sort(compararCodigos);
  if (orden.length === 0) return '';
  // Piso tipo (letra + cuartos 1..5): usar la plantilla estándar con baño
  const letra = letraDePiso(orden);
  if (
    letra &&
    orden.length >= 4 &&
    orden.every((c) => new RegExp(`^${letra}[1-5]$`, 'i').test(c.trim()))
  ) {
    return PLANTILLAS[0].generar(letra);
  }
  const arriba = orden.slice(0, Math.ceil(orden.length / 2));
  const abajo = orden.slice(arriba.length).reverse();
  const cols = Math.max(arriba.length, abajo.length);
  const rellenar = (f: string[]) => [...f, ...Array(cols - f.length).fill('.')];
  const filas = [rellenar(arriba), Array(cols).fill('pasillo')];
  if (abajo.length) filas.push(rellenar(abajo));
  return filas.map((f) => f.join(' ')).join('|');
}

// Respaldo local: si la hoja aún no tiene la columna "Plano" (backend sin
// actualizar), el plano se conserva en este navegador.
const LS_KEY = 'alquiler-planos';

export function leerPlanoLocal(pisoId: string): string | undefined {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}')[pisoId] || undefined;
  } catch {
    return undefined;
  }
}

export function guardarPlanoLocal(pisoId: string, plano: string) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    if (plano) all[pisoId] = plano;
    else delete all[pisoId];
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* almacenamiento no disponible */
  }
}
