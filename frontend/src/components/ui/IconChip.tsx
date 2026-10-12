import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

// Colores por concepto (DESIGN.md §2)
export type Tone =
  | 'teal'
  | 'leaf'
  | 'sky'
  | 'coral'
  | 'ochre'
  | 'olive'
  | 'violet'
  | 'pine'
  | 'rose'
  | 'primary'
  | 'ink';

const solid: Record<Tone, string> = {
  teal: 'bg-teal-500 text-white',
  leaf: 'bg-leaf-500 text-white',
  sky: 'bg-sky-500 text-white',
  coral: 'bg-coral-500 text-white',
  ochre: 'bg-ochre-500 text-white',
  olive: 'bg-olive-500 text-white',
  violet: 'bg-violet-500 text-white',
  pine: 'bg-pine-500 text-white',
  rose: 'bg-rose-500 text-white',
  primary: 'bg-primary-600 text-white',
  ink: 'bg-slate-900 text-white',
};

const soft: Record<Tone, string> = {
  teal: 'bg-teal-50 text-teal-700',
  leaf: 'bg-leaf-50 text-leaf-700',
  sky: 'bg-sky-50 text-sky-700',
  coral: 'bg-coral-50 text-coral-700',
  ochre: 'bg-ochre-50 text-ochre-700',
  olive: 'bg-olive-50 text-olive-700',
  violet: 'bg-violet-50 text-violet-700',
  pine: 'bg-pine-50 text-pine-700',
  rose: 'bg-rose-50 text-rose-700',
  primary: 'bg-primary-50 text-primary-700',
  ink: 'bg-slate-100 text-slate-700',
};

const sizes = {
  sm: 'w-7 h-7 [&>svg]:w-3.5 [&>svg]:h-3.5',
  md: 'w-9 h-9 [&>svg]:w-[18px] [&>svg]:h-[18px]',
  lg: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
  xl: 'w-16 h-16 [&>svg]:w-7 [&>svg]:h-7',
};

interface IconChipProps {
  icon: LucideIcon;
  tone?: Tone;
  variant?: 'solid' | 'soft';
  size?: keyof typeof sizes;
  className?: string;
}

/** Ficha de ícono circular, como los nodos "Add shape" de Ortto. */
export function IconChip({ icon: Icon, tone = 'primary', variant = 'solid', size = 'md', className }: IconChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full flex-shrink-0',
        variant === 'solid' ? solid[tone] : soft[tone],
        sizes[size],
        className
      )}
      aria-hidden
    >
      <Icon strokeWidth={2.25} />
    </span>
  );
}
