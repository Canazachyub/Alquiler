import { Plus, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FabProps {
  onClick: () => void;
  icon?: LucideIcon;
  label: string;
  className?: string;
}

export function Fab({ onClick, icon: Icon = Plus, label, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'md:hidden fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-full flex items-center justify-center',
        'bg-primary-600 text-white shadow-elevated',
        'hover:bg-primary-700 active:bg-primary-800',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2',
        className
      )}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
