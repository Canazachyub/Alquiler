import { LucideIcon, Inbox } from 'lucide-react';
import { IconChip, type Tone } from './IconChip';

interface EmptyStateProps {
  icon?: LucideIcon;
  tone?: Tone;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = Inbox,
  tone = 'ink',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
      <IconChip icon={icon} tone={tone} variant="soft" size="xl" className="mb-5" />
      <h3 className="font-display text-xl font-bold tracking-tight text-slate-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
