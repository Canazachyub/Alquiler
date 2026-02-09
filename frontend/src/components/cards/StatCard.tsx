import { LucideIcon } from 'lucide-react';
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
}

const variants = {
  default: 'bg-white border-gray-100',
  success: 'bg-white border-success-200/60',
  warning: 'bg-white border-warning-200/60',
  danger: 'bg-white border-danger-200/60',
};

const iconVariants = {
  default: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
};

const valueVariants = {
  default: 'text-gray-900',
  success: 'text-success-700',
  warning: 'text-warning-700',
  danger: 'text-danger-700',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className={cn('card p-4 md:p-5', variants[variant])}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className={cn('text-xl md:text-2xl font-bold mt-2 truncate', valueVariants[variant])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1.5 font-medium">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs font-semibold mt-1.5 flex items-center gap-1',
                trend.isPositive ? 'text-success-600' : 'text-danger-600'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2.5 md:p-3 rounded-xl flex-shrink-0', iconVariants[variant])}>
            <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
