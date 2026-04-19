import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
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
  prominent?: boolean;
}

const iconVariants = {
  default: 'bg-primary-50 text-primary-600 ring-primary-100',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100',
  danger: 'bg-red-50 text-red-600 ring-red-100',
};

const dotVariants = {
  default: '',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  variant = 'default',
  prominent = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'card border-slate-200/70 transition-shadow hover:shadow-elevated',
        prominent ? 'p-6' : 'p-5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {variant !== 'default' && (
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  dotVariants[variant]
                )}
              />
            )}
            <p className="text-[13px] font-medium text-slate-600 truncate">
              {title}
            </p>
          </div>
          <p
            className={cn(
              'font-semibold tabular-nums tracking-tight text-slate-900 mt-2 truncate',
              prominent ? 'text-[32px] md:text-4xl' : 'text-3xl'
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold mt-2',
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl ring-1 ring-inset flex-shrink-0',
              iconVariants[variant]
            )}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
