import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
      <Loading size="md" text={text} />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-96">
      <Loading size="lg" text="Cargando..." />
    </div>
  );
}
