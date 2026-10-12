import { useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { compararCodigos, letraDePiso } from '@/utils/plano';
import { useCobros } from '@/hooks/useCobros';
import type { HabitacionConDetalles, Piso } from '@/types';

interface TarjetasPorPisoProps {
  habitaciones: HabitacionConDetalles[];
  pisos: Piso[];
  onClick: (h: HabitacionConDetalles) => void;
}

interface Grupo {
  pisoId: string;
  numero: number;
  letra: string | null;
  habitaciones: HabitacionConDetalles[];
}

const LS_KEY = 'alquiler-pisos-plegados';

function leerPlegados(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

/** Tarjetas agrupadas por edificio y piso, en el mismo orden que el edificio simulado. */
export function TarjetasPorPiso({ habitaciones, pisos, onClick }: TarjetasPorPisoProps) {
  const [plegados, setPlegados] = useState<Set<string>>(leerPlegados);
  const cobros = useCobros();

  const alternar = (pisoId: string) => {
    setPlegados((prev) => {
      const next = new Set(prev);
      if (next.has(pisoId)) next.delete(pisoId);
      else next.add(pisoId);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify([...next]));
      } catch {
        /* sin almacenamiento */
      }
      return next;
    });
  };

  // edificio → pisos → habitaciones
  const edificios = new Map<string, { nombre: string; pisos: Map<string, Grupo> }>();
  habitaciones.forEach((h) => {
    const piso = pisos.find((p) => p.id === h.pisoId);
    const edId = h.edificioId || piso?.edificioId || 'sin-edificio';
    const ed = edificios.get(edId) ?? { nombre: h.edificioNombre || 'Edificio', pisos: new Map() };
    const g = ed.pisos.get(h.pisoId) ?? {
      pisoId: h.pisoId,
      numero: piso?.numero ?? h.pisoNumero ?? 0,
      letra: null,
      habitaciones: [],
    };
    g.habitaciones.push(h);
    ed.pisos.set(h.pisoId, g);
    edificios.set(edId, ed);
  });

  const lista = [...edificios.entries()]
    .map(([id, ed]) => ({
      id,
      nombre: ed.nombre,
      pisos: [...ed.pisos.values()]
        .map((g) => ({
          ...g,
          letra: letraDePiso(g.habitaciones.map((h) => h.codigo)),
          habitaciones: [...g.habitaciones].sort((a, b) => compararCodigos(a.codigo, b.codigo)),
        }))
        .sort((a, b) => a.numero - b.numero),
    }))
    .sort((a, b) => b.pisos.length - a.pisos.length || a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-8">
      {lista.map((ed) => (
        <section key={ed.id} className="space-y-3">
          {lista.length > 1 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-pine-600" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{ed.nombre}</h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {ed.pisos.map((g) => {
            const abierto = !plegados.has(g.pisoId);
            const ocupadas = g.habitaciones.filter((h) => h.estado === 'occupied');
            const conDeuda = ocupadas.filter((h) => cobros.estado(h) === 'vencido');
            const porVencer = ocupadas.filter((h) => cobros.estado(h) === 'por-vencer');
            const vacantes = g.habitaciones.filter((h) => h.estado === 'vacant').length;
            const porCobrar = ocupadas.reduce((s, h) => s + cobros.deuda(h), 0);
            return (
              <div key={g.pisoId} className="rounded-2xl bg-white/60 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => alternar(g.pisoId)}
                  aria-expanded={abierto}
                  className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left rounded-2xl hover:bg-white transition-colors"
                >
                  <span className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-display font-bold flex-shrink-0">
                    {g.letra ?? g.numero}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 leading-tight">
                      {g.letra ? `Piso ${g.letra}` : `Piso ${g.numero}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      Nivel {g.numero} · {g.habitaciones.length} cuartos
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <span className="badge badge-neutral">{ocupadas.length} ocupados</span>
                    {conDeuda.length > 0 && <span className="badge badge-danger">{conDeuda.length} vencidos</span>}
                    {porVencer.length > 0 && <span className="badge badge-warning">{porVencer.length} por vencer</span>}
                    {vacantes > 0 && <span className="badge badge-neutral">{vacantes} vacantes</span>}
                    {porCobrar > 0 && (
                      <span className="text-xs font-semibold text-red-600 tabular-nums">{formatCurrency(porCobrar)}</span>
                    )}
                    <ChevronDown
                      className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', !abierto && '-rotate-90')}
                    />
                  </div>
                </button>

                {abierto && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-3 pb-3 md:px-4 md:pb-4 plano-aparecer">
                    {g.habitaciones.map((hab) => (
                      <RoomCard key={hab.id} habitacion={hab} onClick={() => onClick(hab)} ocultarUbicacion />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
