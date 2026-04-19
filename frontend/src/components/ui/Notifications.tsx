import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useNotifications } from '@/store';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-success-50 border-success-100 text-success-700',
  error: 'bg-danger-50 border-danger-100 text-danger-700',
  warning: 'bg-warning-50 border-warning-100 text-warning-700',
  info: 'bg-primary-50 border-primary-100 text-primary-700',
};

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export function Notifications() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const EXIT_MS = 180;

function NotificationItem({ type, message, duration = 5000, onClose }: NotificationItemProps) {
  const Icon = icons[type];

  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(1);
  const [progressDuration, setProgressDuration] = useState(duration);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(duration);
  const closedRef = useRef<boolean>(false);

  const isAssertive = type === 'error' || type === 'warning';

  const handleClose = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
    setTimeout(onClose, EXIT_MS);
  };

  // Kick off the progress shrink after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(0));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Timer with hover pause
  useEffect(() => {
    if (duration <= 0) return;
    remainingRef.current = duration;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(handleClose, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleMouseEnter = () => {
    if (duration <= 0 || closedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    // Freeze the progress bar at current computed position
    const ratio = Math.max(0, Math.min(1, remainingRef.current / duration));
    setProgressDuration(0);
    setProgress(ratio);
  };

  const handleMouseLeave = () => {
    if (duration <= 0 || closedRef.current) return;
    if (remainingRef.current <= 0) {
      handleClose();
      return;
    }
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(handleClose, remainingRef.current);
    // Resume the shrink animation for the remaining time
    setProgressDuration(remainingRef.current);
    requestAnimationFrame(() => setProgress(0));
  };

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border shadow-lg overflow-hidden',
        'transition-all ease-in',
        styles[type],
        isExiting ? 'opacity-0 translate-x-4 duration-[180ms]' : 'opacity-100 translate-x-0 duration-200 animate-in slide-in-from-right'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-current opacity-40 origin-left"
            style={{
              transform: `scaleX(${progress})`,
              transition: `transform ${progressDuration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
}
