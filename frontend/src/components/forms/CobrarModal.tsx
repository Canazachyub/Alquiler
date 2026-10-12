import { useEffect, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { Modal } from '@/components/ui';
import { RegistrarPagoHabitacion } from './RegistrarPagoHabitacion';
import { useCobros } from '@/hooks';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { textoCuenta } from '@/utils/cobro';
import { compararCodigos, letraDePiso } from '@/utils/plano';
import type { HabitacionConDetalles, Pago } from '@/types';

interface CobrarModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Cuartos entre los que elegir (se muestran solo los ocupados) */
  habitaciones: HabitacionConDetalles[];
  /** Si se pasa, abre directo el cobro de ese cuarto */
  habitacionInicial?: HabitacionConDetalles | null;
  onVerVoucher?: (pago: Pago) => void;
}

const ORDEN: Record<string, number> = { vencido: 0, 'por-vencer': 1, 'al-dia': 2 };

/** Registrar un pago desde cualquier pantalla: elegir cuarto → meses, método y total. */
export function CobrarModal({ isOpen, onClose, habitaciones, habitacionInicial, onVerVoucher }: CobrarModalProps) {
  const cobros = useCobros();
  const [hab, setHab] = useState<HabitacionConDetalles | null>(habitacionInicial ?? null);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHab(habitacionInicial ?? null);
      setBuscar('');
    }
  }, [isOpen, habitacionInicial]);

  const ubicacion = (h: HabitacionConDetalles) => {
    const letra = letraDePiso([h.codigo]);
    return [h.edificioNombre, letra ? `Piso ${letra}` : null].filter(Boolean).join(' · ');
  };

  const candidatos = habitaciones
    .filter((h) => h.estado === 'occupied')
    .filter((h) => {
      const q = buscar.trim().toLowerCase();
      return !q || h.codigo.toLowerCase().includes(q) || (h.nombreInquilino ?? '').toLowerCase().includes(q);
    })
    .sort(
      (a, b) =>
        (ORDEN[cobros.estado(a)] ?? 3) - (ORDEN[cobros.estado(b)] ?? 3) || compararCodigos(a.codigo, b.codigo)
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={hab ? `Registrar pago · ${hab.codigo}` : 'Registrar pago'} size="lg">
      {hab ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setHab(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Elegir otro cuarto
          </button>
          <RegistrarPagoHabitacion
            key={hab.id}
            habitacion={hab}
            onListo={onClose}
            onVerVoucher={
              onVerVoucher
                ? (p) => {
                    onClose();
                    onVerVoucher(p);
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">¿De qué cuarto es el pago? Primero salen los que deben.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar cuarto o inquilino…"
              className="input pl-10"
            />
          </div>
          <ul className="max-h-[55dvh] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
            {candidatos.map((h) => {
              const estado = cobros.estado(h);
              const c = cobros.cobro(h);
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => setHab(h)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                        estado === 'vencido' ? 'bg-red-500' : estado === 'por-vencer' ? 'bg-amber-500' : 'bg-emerald-600'
                      )}
                    >
                      {h.codigo}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 truncate">
                        {h.nombreInquilino || 'Sin inquilino'}
                      </span>
                      <span className="block text-xs text-slate-500 truncate">{ubicacion(h)}</span>
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold tabular-nums text-right',
                        estado === 'vencido' ? 'text-red-600' : estado === 'por-vencer' ? 'text-amber-700' : 'text-emerald-700'
                      )}
                    >
                      {estado === 'vencido' ? `Debe ${formatCurrency(cobros.deuda(h))}` : textoCuenta(c?.dias ?? null)}
                    </span>
                  </button>
                </li>
              );
            })}
            {candidatos.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">Sin resultados</li>}
          </ul>
        </div>
      )}
    </Modal>
  );
}
