import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Seccion<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Clases de la pestaña activa (fondo de color + texto blanco) */
  activo: string;
  /** Color del ícono cuando no está activa */
  icono: string;
  detalle?: string;
}

interface SeccionesTabsProps<T extends string> {
  secciones: Seccion<T>[];
  valor: T;
  onCambiar: (id: T) => void;
  etiqueta: string;
}

/** Pestañas grandes con color por sección: se ve claro en qué sección estás. */
export function SeccionesTabs<T extends string>({ secciones, valor, onCambiar, etiqueta }: SeccionesTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className="grid gap-1.5 mb-5"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${secciones.length > 4 ? 96 : 120}px, 1fr))` }}
    >
      {secciones.map((s) => {
        const activa = s.id === valor;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => onCambiar(s.id)}
            title={s.detalle ? `${s.label} · ${s.detalle}` : s.label}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-h-[60px] px-1.5 py-2 rounded-xl border-2 text-xs sm:text-[13px] font-semibold text-center transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
              activa
                ? cn('text-white border-transparent shadow-elevated', s.activo)
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
            )}
          >
            <span
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                activa ? 'bg-white/20' : 'bg-slate-100'
              )}
            >
              <s.icon className={cn('w-4 h-4', activa ? 'text-white' : s.icono)} />
            </span>
            <span className="leading-tight">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
