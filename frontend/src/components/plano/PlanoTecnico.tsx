import { parsearPlano, tipoDeToken, type TipoEspacio } from '@/utils/plano';
import { cn } from '@/utils/cn';
import type { HabitacionConDetalles } from '@/types';

/**
 * Plano de piso con estilo de dibujo técnico (tipo AutoCAD): fondo azul de plano,
 * cuadrícula, muros en línea blanca, cotas y cajetín. Solo lectura.
 */

const ROTULO: Partial<Record<TipoEspacio, string>> = {
  pasillo: 'PASILLO',
  bano: 'SS.HH.',
  escalera: 'ESCALERA',
  entrada: 'INGRESO',
  cocina: 'COCINA',
  lavanderia: 'LAVANDERÍA',
  patio: 'PATIO',
};

interface PlanoTecnicoProps {
  plano: string;
  habitaciones: HabitacionConDetalles[];
  titulo: string;
  subtitulo?: string;
  /** Tamaño de cada celda de la cuadrícula del plano, en px del dibujo */
  modulo?: number;
  compacto?: boolean;
  className?: string;
  /** Cuarto resaltado */
  seleccionada?: string;
  onHabitacionClick?: (h: HabitacionConDetalles) => void;
}

export function PlanoTecnico({ plano, habitaciones, titulo, subtitulo, modulo = 90, compacto, className, seleccionada, onHabitacionClick }: PlanoTecnicoProps) {
  const { areas, celdas, columnas } = parsearPlano(plano);
  const filas = celdas.length;
  const porCodigo = new Map(habitaciones.map((h) => [h.codigo.trim().toLowerCase(), h]));
  // Filas solo de pasillo/servicios se dibujan más bajas
  const altoFila = celdas.map((f) => (f.some((t) => t !== '.' && porCodigo.has(t.toLowerCase())) ? modulo : modulo * 0.55));
  const yFila = altoFila.reduce<number[]>((acc, h, i) => [...acc, (acc[i] ?? 0) + h], [0]);
  const M = 36; // margen para cotas
  const anchoPlano = columnas * modulo;
  const altoPlano = yFila[filas];
  const cajetin = compacto ? 0 : 34;
  const W = anchoPlano + M * 2;
  const H = altoPlano + M * 2 + cajetin;

  const esPasillo = (r: number, c: number) => {
    const t = celdas[r]?.[c];
    return !!t && t !== '.' && tipoDeToken(t) === 'pasillo';
  };
  type Lado = 'arriba' | 'abajo' | 'izq' | 'der';
  const puertaDe = (a: (typeof areas)[number]): { lado: Lado; desde: number; hasta: number } | null => {
    const r0 = a.fila;
    const r1 = a.fila + a.filas - 1;
    const c0 = a.col;
    const c1 = a.col + a.cols - 1;
    const rango = (n: number, m: number) => Array.from({ length: m - n + 1 }, (_, i) => n + i);
    const lados: { lado: Lado; celdas: number[] }[] = [
      { lado: 'abajo', celdas: rango(c0, c1).filter((c) => esPasillo(r1 + 1, c)) },
      { lado: 'arriba', celdas: rango(c0, c1).filter((c) => esPasillo(r0 - 1, c)) },
      { lado: 'izq', celdas: rango(r0, r1).filter((r) => esPasillo(r, c0 - 1)) },
      { lado: 'der', celdas: rango(r0, r1).filter((r) => esPasillo(r, c1 + 1)) },
    ];
    const mejor = lados.sort((x, y) => y.celdas.length - x.celdas.length)[0];
    if (!mejor.celdas.length) return null;
    return { lado: mejor.lado, desde: Math.min(...mejor.celdas), hasta: Math.max(...mejor.celdas) };
  };
  const fondo = '#0B2545';

  const linea = '#E6F1FF';
  const tenue = 'rgba(230,241,255,0.45)';

  return (
    <div className={cn('rounded-xl overflow-hidden bg-[#0B2545] shadow-elevated', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[70vh] block" role="img" aria-label={`Plano técnico ${titulo}`}>
        <defs>
          <pattern id="cuadricula-fina" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="rgba(120,170,230,0.12)" strokeWidth="0.5" />
          </pattern>
          <pattern id="cuadricula" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#cuadricula-fina)" />
            <path d="M50 0H0V50" fill="none" stroke="rgba(120,170,230,0.22)" strokeWidth="0.8" />
          </pattern>
          <pattern id="rayado" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={tenue} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#cuadricula)" />

        {/* Espacios */}
        {areas.map((a) => {
          const x = M + a.col * modulo;
          const y = M + yFila[a.fila];
          const w = a.cols * modulo;
          const h = yFila[a.fila + a.filas] - yFila[a.fila];
          const hab = a.tipo === 'habitacion' ? porCodigo.get(a.token.toLowerCase()) : undefined;
          const esServicio = a.tipo !== 'habitacion';
          const activo = !!hab && hab.id === seleccionada;
          return (
            <g
              key={a.areaName}
              onClick={hab && onHabitacionClick ? () => onHabitacionClick(hab) : undefined}
              style={hab && onHabitacionClick ? { cursor: 'pointer' } : undefined}
              role={hab && onHabitacionClick ? 'button' : undefined}
              aria-label={hab ? `Cuarto ${hab.codigo}` : undefined}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={
                  activo
                    ? 'rgba(124,196,255,0.22)'
                    : a.tipo === 'escalera'
                    ? 'url(#rayado)'
                    : esServicio
                    ? 'rgba(230,241,255,0.04)'
                    : 'rgba(230,241,255,0.001)'
                }
                stroke={activo ? '#7CC4FF' : linea}
                strokeWidth={esServicio ? 1 : activo ? 3.2 : 2.4}
              />
              <text
                x={x + w / 2}
                y={y + h / 2 - (hab && !compacto ? 4 : -4)}
                textAnchor="middle"
                fill={linea}
                fontFamily="ui-monospace, 'Consolas', monospace"
                fontWeight={hab ? 700 : 500}
                fontSize={hab ? (compacto ? 18 : 22) : 10}
                letterSpacing={hab ? 1 : 2}
              >
                {hab ? a.token.toUpperCase() : ROTULO[a.tipo] ?? (a.tipo === 'habitacion' ? a.token.toUpperCase() : '')}
              </text>
              {hab && !compacto && (
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 14}
                  textAnchor="middle"
                  fill={tenue}
                  fontFamily="ui-monospace, 'Consolas', monospace"
                  fontSize="9"
                >
                  {`S/ ${hab.montoAlquiler}`}
                  {hab.estado === 'occupied' ? ' · OCUPADO' : hab.estado === 'exonerated' ? ' · EXONERADO' : ' · LIBRE'}
                </text>
              )}
            </g>
          );
        })}

        {/* Muro perimetral (doble línea) */}
        <rect x={M - 4} y={M - 4} width={anchoPlano + 8} height={altoPlano + 8} fill="none" stroke={linea} strokeWidth="1.2" />
        <rect x={M} y={M} width={anchoPlano} height={altoPlano} fill="none" stroke={linea} strokeWidth="2.4" />

        {/* Puertas hacia el pasillo: hueco en el muro, hoja y arco de abatimiento hacia el cuarto */}
        {areas.map((a) => {
          if (a.tipo !== 'habitacion' || !porCodigo.has(a.token.toLowerCase())) return null;
          const pu = puertaDe(a);
          if (!pu) return null;
          const x = M + a.col * modulo;
          const y = M + yFila[a.fila];
          const w = a.cols * modulo;
          const h = yFila[a.fila + a.filas] - yFila[a.fila];
          const d = Math.min(24, modulo * 0.28);
          let hueco: [number, number, number, number];
          let hoja: [number, number, number, number];
          let arco: string;
          if (pu.lado === 'abajo' || pu.lado === 'arriba') {
            // Centro del tramo que da al pasillo
            const cx = M + ((pu.desde + pu.hasta + 1) / 2) * modulo;
            const yy = pu.lado === 'abajo' ? y + h : y;
            const s = pu.lado === 'abajo' ? -1 : 1;
            hueco = [cx - d / 2, yy, cx + d / 2, yy];
            hoja = [cx + d / 2, yy, cx + d / 2, yy + s * d];
            arco = `M ${cx - d / 2} ${yy} A ${d} ${d} 0 0 ${pu.lado === 'abajo' ? 1 : 0} ${cx + d / 2} ${yy + s * d}`;
          } else {
            const cy = M + (yFila[pu.desde] + yFila[pu.hasta + 1]) / 2;
            const xx = pu.lado === 'izq' ? x : x + w;
            const s = pu.lado === 'izq' ? 1 : -1;
            hueco = [xx, cy - d / 2, xx, cy + d / 2];
            hoja = [xx, cy + d / 2, xx + s * d, cy + d / 2];
            arco = `M ${xx} ${cy - d / 2} A ${d} ${d} 0 0 ${pu.lado === 'izq' ? 1 : 0} ${xx + s * d} ${cy + d / 2}`;
          }
          return (
            <g key={`puerta-${a.areaName}`} pointerEvents="none">
              <line x1={hueco[0]} y1={hueco[1]} x2={hueco[2]} y2={hueco[3]} stroke={fondo} strokeWidth="5" />
              <line x1={hoja[0]} y1={hoja[1]} x2={hoja[2]} y2={hoja[3]} stroke={linea} strokeWidth="1.4" />
              <path d={arco} fill="none" stroke={tenue} strokeWidth="1" strokeDasharray="3 2" />
            </g>
          );
        })}

        {/* Cotas: ejes numerados arriba y letras a la izquierda */}
        {Array.from({ length: columnas + 1 }, (_, i) => (
          <g key={`cx${i}`}>
            <line x1={M + i * modulo} y1={M - 22} x2={M + i * modulo} y2={M - 8} stroke={tenue} strokeWidth="0.8" />
            {i < columnas && (
              <>
                <line x1={M + i * modulo} y1={M - 15} x2={M + (i + 1) * modulo} y2={M - 15} stroke={tenue} strokeWidth="0.8" />
                <text x={M + (i + 0.5) * modulo} y={M - 19} textAnchor="middle" fill={tenue} fontFamily="ui-monospace, monospace" fontSize="8">
                  {(modulo / 30).toFixed(2)} m
                </text>
              </>
            )}
          </g>
        ))}
        {Array.from({ length: filas }, (_, j) => (
          <g key={`cy${j}`}>
            <circle cx={M - 18} cy={M + yFila[j] + altoFila[j] / 2} r="7" fill="none" stroke={tenue} strokeWidth="0.8" />
            <text x={M - 18} y={M + yFila[j] + altoFila[j] / 2 + 3} textAnchor="middle" fill={tenue} fontFamily="ui-monospace, monospace" fontSize="8">
              {String.fromCharCode(65 + j)}
            </text>
          </g>
        ))}

        {/* Cajetín */}
        {!compacto && (
          <g transform={`translate(${W - M - 230}, ${H - cajetin - 4})`}>
            <rect width="230" height={cajetin} fill="#0B2545" stroke={linea} strokeWidth="1" />
            <line x1="150" y1="0" x2="150" y2={cajetin} stroke={linea} strokeWidth="0.8" />
            <text x="8" y="14" fill={linea} fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">
              {titulo.toUpperCase()}
            </text>
            <text x="8" y="27" fill={tenue} fontFamily="ui-monospace, monospace" fontSize="8">
              {subtitulo ?? ''}
            </text>
            <text x="158" y="14" fill={tenue} fontFamily="ui-monospace, monospace" fontSize="8">ESC. 1:100</text>
            <text x="158" y="27" fill={tenue} fontFamily="ui-monospace, monospace" fontSize="8">LÁM. A-01</text>
          </g>
        )}
      </svg>
    </div>
  );
}
