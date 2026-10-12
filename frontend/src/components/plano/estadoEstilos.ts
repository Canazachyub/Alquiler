import type { Tone } from '@/components/ui/IconChip';
import type { EstadoPlano } from '@/utils/cobro';

/**
 * Código de colores único del estado de un cuarto (plano, edificio, tarjetas, ficha).
 * Verde = al día, ámbar = vence pronto, rojo = vencido. El color siempre va con texto.
 */
export const ESTADO_ESTILO: Record<
  EstadoPlano,
  { label: string; dot: string; celda: string; badge: string; tone: Tone; ventana: string; borde: string }
> = {
  vencido: {
    label: 'Vencido',
    dot: 'bg-red-500',
    celda: 'bg-red-50 border-red-400/60 hover:border-red-500',
    badge: 'badge-danger',
    tone: 'coral',
    ventana: 'bg-red-500 shadow-[0_0_10px_1px_rgba(239,68,68,0.6)]',
    borde: 'border-red-300',
  },
  'por-vencer': {
    label: 'Por vencer',
    dot: 'bg-amber-500',
    celda: 'bg-amber-50 border-amber-400/60 hover:border-amber-500',
    badge: 'badge-warning',
    tone: 'ochre',
    ventana: 'bg-amber-400 shadow-[0_0_10px_1px_rgba(245,158,11,0.6)]',
    borde: 'border-amber-300',
  },
  'al-dia': {
    label: 'Al día',
    dot: 'bg-emerald-500',
    celda: 'bg-leaf-50 border-leaf-500/40 hover:border-leaf-500',
    badge: 'badge-success',
    tone: 'leaf',
    ventana: 'bg-emerald-400 shadow-[0_0_10px_1px_rgba(52,211,153,0.6)]',
    borde: 'border-slate-200',
  },
  vacante: {
    label: 'Vacante',
    dot: 'bg-slate-300',
    celda: 'bg-white border-dashed border-slate-300 hover:border-slate-500',
    badge: 'badge-neutral',
    tone: 'ink',
    ventana: 'bg-slate-700',
    borde: 'border-slate-200',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    dot: 'bg-violet-500',
    celda: 'bg-violet-50 border-violet-500/40 hover:border-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
    tone: 'violet',
    ventana: 'bg-violet-500 shadow-[0_0_8px_rgba(141,122,195,0.6)]',
    borde: 'border-slate-200',
  },
  exonerado: {
    label: 'Exonerado',
    dot: 'bg-olive-500',
    celda: 'bg-olive-50 border-olive-500/50 hover:border-olive-500',
    badge: 'bg-olive-50 text-olive-700 ring-1 ring-inset ring-olive-600/20',
    tone: 'olive',
    ventana: 'bg-olive-500 shadow-[0_0_8px_rgba(180,160,74,0.7)]',
    borde: 'border-slate-200',
  },
};

export const ORDEN_LEYENDA: EstadoPlano[] = ['al-dia', 'por-vencer', 'vencido', 'vacante', 'exonerado', 'mantenimiento'];
