import type { CSSProperties } from 'react';
import {
  Bath,
  DoorOpen,
  Footprints,
  CookingPot,
  WashingMachine,
  Trees,
  ArrowUpDown,
  Wrench,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { parsearPlano, type TipoEspacio } from '@/utils/plano';
import { textoCuenta } from '@/utils/cobro';
import { useCobros } from '@/hooks/useCobros';
import { ESTADO_ESTILO, ORDEN_LEYENDA } from './estadoEstilos';
import type { HabitacionConDetalles } from '@/types';

const ESPACIOS: Record<Exclude<TipoEspacio, 'habitacion' | 'vacio'>, { label: string; icon: LucideIcon; className: string }> = {
  pasillo: { label: 'Pasillo', icon: Footprints, className: 'bg-slate-100 text-slate-400 plano-rayado' },
  bano: { label: 'Baño', icon: Bath, className: 'bg-sky-50 text-sky-600' },
  escalera: { label: 'Escalera', icon: ArrowUpDown, className: 'bg-slate-200/70 text-slate-500 plano-rayado' },
  entrada: { label: 'Entrada', icon: DoorOpen, className: 'bg-violet-50 text-violet-600' },
  cocina: { label: 'Cocina', icon: CookingPot, className: 'bg-ochre-50 text-ochre-700' },
  lavanderia: { label: 'Lavandería', icon: WashingMachine, className: 'bg-sky-50 text-sky-600' },
  patio: { label: 'Patio', icon: Trees, className: 'bg-pine-50 text-pine-600' },
};

export type { EstadoPlano } from '@/utils/cobro';

interface PlanoPisoProps {
  plano: string;
  habitaciones: HabitacionConDetalles[];
  /** Ids de habitaciones que pasan el filtro/búsqueda; las demás se atenúan */
  resaltadas?: Set<string>;
  /** Cuarto con la ficha abierta */
  seleccionada?: string;
  onHabitacionClick?: (h: HabitacionConDetalles) => void;
  compacto?: boolean;
}

export function PlanoPiso({ plano, habitaciones, resaltadas, seleccionada, onHabitacionClick, compacto }: PlanoPisoProps) {
  const cobros = useCobros();
  const { areas, templateAreas, columnas, celdas } = parsearPlano(plano);
  const porCodigo = new Map(habitaciones.map((h) => [h.codigo.trim().toLowerCase(), h]));

  // Filas sin habitaciones (pasillos) se dibujan más bajas
  const filaTieneHabitacion = celdas.map((fila) =>
    fila.some((t) => t !== '.' && porCodigo.has(t.toLowerCase()))
  );
  const style: CSSProperties = {
    gridTemplateAreas: templateAreas,
    gridTemplateColumns: `repeat(${columnas}, minmax(${compacto ? 64 : 92}px, 1fr))`,
    gridTemplateRows: filaTieneHabitacion
      .map((tiene) => (tiene ? `minmax(${compacto ? 72 : 104}px, auto)` : compacto ? '36px' : '48px'))
      .join(' '),
  };

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div
        className="grid gap-1.5 p-1.5 rounded-xl bg-slate-900/[0.06] border-2 border-slate-900/80 min-w-fit"
        style={style}
      >
        {areas.map((area) => {
          const h = area.tipo === 'habitacion' ? porCodigo.get(area.token.toLowerCase()) : undefined;

          if (area.tipo === 'habitacion' && !h) {
            return (
              <div
                key={area.areaName}
                style={{ gridArea: area.areaName }}
                className="rounded-lg border border-dashed border-amber-400 bg-amber-50 text-amber-700 flex flex-col items-center justify-center gap-1 p-2 text-center"
                title="Este código no coincide con ninguna habitación del piso"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">{area.token}</span>
              </div>
            );
          }

          if (h) {
            const estado = cobros.estado(h);
            const st = ESTADO_ESTILO[estado];
            const deuda = cobros.deuda(h);
            const cobro = cobros.cobro(h);
            const atenuada = resaltadas && !resaltadas.has(h.id);
            return (
              <button
                key={area.areaName}
                type="button"
                onClick={() => onHabitacionClick?.(h)}
                style={{ gridArea: area.areaName }}
                aria-label={`Habitación ${h.codigo}: ${st.label}${h.nombreInquilino ? `, ${h.nombreInquilino}` : ''}`}
                className={cn(
                  'group relative rounded-lg border-2 p-2.5 md:p-3 text-left flex flex-col transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1',
                  st.celda,
                  seleccionada === h.id && 'ring-[3px] ring-primary-600 ring-offset-1 scale-[1.02] z-10',
                  atenuada && 'opacity-30 saturate-0'
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={cn(
                      'font-display font-bold tracking-tight text-slate-900 leading-none',
                      compacto ? 'text-lg' : 'text-2xl'
                    )}
                  >
                    {h.codigo}
                  </span>
                  {estado === 'mantenimiento' ? (
                    <Wrench className="w-3.5 h-3.5 text-violet-600" />
                  ) : (
                    <span className={cn('w-2 h-2 rounded-full mt-1', st.dot)} aria-hidden />
                  )}
                </div>
                {!compacto && (
                  <div className="mt-auto pt-2 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {h.nombreInquilino?.split(' ')[0] || st.label}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] tabular-nums truncate font-semibold',
                        estado === 'vencido' ? 'text-red-600' : estado === 'por-vencer' ? 'text-amber-700' : estado === 'al-dia' ? 'text-emerald-700' : 'text-slate-500'
                      )}
                    >
                      {estado === 'vencido'
                        ? `Debe ${formatCurrency(deuda)}`
                        : (estado === 'por-vencer' || estado === 'al-dia') && cobro
                        ? `${st.label} · ${textoCuenta(cobro.dias)}`
                        : estado === 'vacante'
                        ? formatCurrency(h.montoAlquiler)
                        : st.label}
                    </p>
                  </div>
                )}
              </button>
            );
          }

          const esp = ESPACIOS[area.tipo as keyof typeof ESPACIOS];
          if (!esp) return null;
          const Icon = esp.icon;
          return (
            <div
              key={area.areaName}
              style={{ gridArea: area.areaName }}
              className={cn(
                'rounded-lg flex items-center justify-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider',
                esp.className
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {!compacto && <span className="truncate">{esp.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeyendaPlano() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
      {ORDEN_LEYENDA.map((e) => (
        <span key={e} className="inline-flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', ESTADO_ESTILO[e].dot)} aria-hidden />
          {ESTADO_ESTILO[e].label}
        </span>
      ))}
    </div>
  );
}
