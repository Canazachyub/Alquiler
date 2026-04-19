import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Receipt, FileText, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import type { Alerta, AlertaCategoria, AlertaSeveridad } from '@/hooks/useAlertas';

interface AlertsPopoverProps {
  alertas: Alerta[];
  onClose: () => void;
}

const severityStyles: Record<AlertaSeveridad, { icon: string; dot: string; text: string }> = {
  danger: { icon: 'bg-red-50 text-red-600', dot: 'bg-red-500', text: 'text-red-700' },
  warning: { icon: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', text: 'text-amber-700' },
  info: { icon: 'bg-primary-50 text-primary-600', dot: 'bg-primary-500', text: 'text-primary-700' },
};

const categoryIcon: Record<AlertaCategoria, typeof AlertCircle> = {
  'pago-pendiente': AlertCircle,
  'pago-proximo': Clock,
  'gasto-fijo': Receipt,
  'contrato-incompleto': FileText,
};

const sectionLabel: Record<AlertaCategoria, string> = {
  'pago-pendiente': 'Pagos pendientes',
  'pago-proximo': 'Vencen pronto',
  'gasto-fijo': 'Gastos fijos',
  'contrato-incompleto': 'Contratos incompletos',
};

const sectionOrder: AlertaCategoria[] = [
  'pago-pendiente',
  'pago-proximo',
  'gasto-fijo',
  'contrato-incompleto',
];

export function AlertsPopover({ alertas, onClose }: AlertsPopoverProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Click fuera cierra el popover
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Agrupar por categoría
  const grupos: Record<AlertaCategoria, Alerta[]> = {
    'pago-pendiente': [],
    'pago-proximo': [],
    'gasto-fijo': [],
    'contrato-incompleto': [],
  };
  alertas.forEach((a) => grupos[a.categoria].push(a));

  const handleClick = (link?: string) => {
    if (link) navigate(link);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-popover border border-slate-200 overflow-hidden z-50"
      role="dialog"
      aria-label="Alertas y recordatorios"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Notificaciones</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {alertas.length === 0
              ? 'Todo al día'
              : `${alertas.length} ${alertas.length === 1 ? 'alerta' : 'alertas'} activas`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista */}
      <div className="max-h-[70vh] overflow-y-auto">
        {alertas.length === 0 ? (
          <div className="py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-100 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Sin alertas pendientes</p>
            <p className="text-xs text-slate-500 mt-1">
              Los pagos y contratos están en orden.
            </p>
          </div>
        ) : (
          sectionOrder.map((cat) => {
            const items = grupos[cat];
            if (items.length === 0) return null;
            return (
              <div key={cat} className="border-b border-slate-100 last:border-b-0">
                <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                  {sectionLabel[cat]} · {items.length}
                </p>
                {items.map((a) => {
                  const Icon = categoryIcon[a.categoria];
                  const styles = severityStyles[a.severidad];
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleClick(a.link)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', styles.icon)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', styles.dot)} />
                          <p className="text-sm font-medium text-slate-900 truncate">{a.titulo}</p>
                        </div>
                        {a.detalle && (
                          <p className="text-xs text-slate-500 mt-0.5 ml-3.5 truncate">{a.detalle}</p>
                        )}
                      </div>
                      {a.monto !== undefined && (
                        <span className="text-xs font-semibold text-slate-700 tabular-nums flex-shrink-0 ml-2">
                          {formatCurrency(a.monto)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
