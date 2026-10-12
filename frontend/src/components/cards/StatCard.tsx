import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { IconChip, type Tone } from '@/components/ui/IconChip';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Color de concepto de la ficha (DESIGN.md §2). Si falta, se deriva de variant. */
  tone?: Tone;
  /** Barra de progreso 0–100 (gauge de Ortto) */
  progress?: number;
  prominent?: boolean;
  onClick?: () => void;
}

const variantTone: Record<NonNullable<StatCardProps['variant']>, Tone> = {
  default: 'primary',
  success: 'leaf',
  warning: 'ochre',
  danger: 'coral',
};

const barVariants = {
  default: 'bg-primary-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  variant = 'default',
  tone,
  progress,
  prominent = false,
  onClick,
}: StatCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'card text-left w-full',
        onClick && 'card-interactive',
        prominent ? 'p-5 md:p-6' : 'p-4 md:p-5'
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon && (
          <IconChip
            icon={icon}
            tone={tone ?? variantTone[variant]}
            variant={prominent ? 'solid' : 'soft'}
            size={prominent ? 'md' : 'sm'}
          />
        )}
        <p className="text-[13px] font-semibold text-slate-600 truncate">{title}</p>
      </div>
      <p
        className={cn(
          'font-display font-bold tabular-nums tracking-[-0.03em] text-slate-900 truncate',
          prominent ? 'text-[32px] md:text-[40px] mt-4 leading-none' : 'text-2xl md:text-[28px] mt-3 leading-none'
        )}
      >
        {value}
      </p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" role="presentation">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barVariants[variant])}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
      {subtitle && <p className="text-xs text-slate-500 mt-2.5">{subtitle}</p>}
      {trend && (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold mt-2',
            trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          )}
        >
          {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend.value)}%
        </span>
      )}
    </Comp>
  );
}
