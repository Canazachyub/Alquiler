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
  default: 'bg-white',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
};

const iconVariants = {
  default: 'bg-primary-100 text-primary-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
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
    <div className={cn('card p-5', variants[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-sm mt-1 flex items-center gap-1',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', iconVariants[variant])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
