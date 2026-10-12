import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

// En celular la ventana ocupa todo el ancho y sube desde abajo (hoja inferior)
const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);

  // Escape + body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Mount animation + focus trap setup
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }

    // Save currently focused element to restore later
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Trigger enter animation on next frame
    const raf = requestAnimationFrame(() => setEntered(true));

    // Focus first focusable element after animation begins
    const focusTimer = window.setTimeout(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(focusTimer);
      // Restore focus on unmount/close
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  // Tab cycling (focus trap)
  useEffect(() => {
    if (!isOpen) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusables = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ease-out"
        style={{ opacity: entered ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative bg-white shadow-popover w-full border border-slate-200 transition-all duration-200 ease-out flex flex-col',
          'rounded-t-2xl sm:rounded-2xl sm:mx-4 max-h-[94dvh] sm:max-h-[90vh]',
          sizes[size]
        )}
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : window.innerWidth < 640 ? 'translateY(24px)' : 'scale(0.96)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50 sm:rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
