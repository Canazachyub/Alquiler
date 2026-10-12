import { cn } from '@/utils/cn';
import { compararCodigos } from '@/utils/plano';
import { ESTADO_ESTILO } from './estadoEstilos';
import { useCobros } from '@/hooks/useCobros';
import type { HabitacionConDetalles } from '@/types';

export interface PisoEdificio {
  pisoId: string;
  numero: number;
  letra: string | null;
  titulo: string;
  habitaciones: HabitacionConDetalles[];
}

interface EdificioSimuladoProps {
  nombre: string;
  pisos: PisoEdificio[];
  seleccionado: string | null;
  onSeleccionar: (pisoId: string) => void;
}

/** Fachada 2.5D: cada piso es una losa con sus ventanas (una por cuarto). */
export function EdificioSimulado({ nombre, pisos, seleccionado, onSeleccionar }: EdificioSimuladoProps) {
  const cobros = useCobros();
  // El piso más alto se dibuja arriba
  const deArribaAbajo = [...pisos].sort((a, b) => b.numero - a.numero);
  const total = deArribaAbajo.length;

  return (
    <div className="edificio-escena select-none" aria-label={`Edificio ${nombre}`}>
      <div className="relative mx-auto w-full max-w-[300px] pr-7 pt-6">
        {/* Techo: cara superior + tanque de agua */}
        <div className="relative h-3 bg-slate-800 rounded-t-sm edificio-piso" style={{ animationDelay: `${total * 90 + 60}ms` }}>
          <div className="edificio-techo-top" />
          <div className="edificio-lado bg-slate-900" />
          <div className="absolute -top-6 right-6 w-8 h-5 rounded-sm bg-slate-300 border border-slate-500 z-10">
            <div className="absolute -top-1 inset-x-0.5 h-1 rounded-full bg-slate-400" />
          </div>
        </div>

        <div role="listbox" aria-label="Pisos" className="relative">
          {deArribaAbajo.map((p, idx) => {
            const activo = p.pisoId === seleccionado;
            const habs = [...p.habitaciones].sort((a, b) => compararCodigos(a.codigo, b.codigo));
            const deuda = habs.filter((h) => cobros.estado(h) === 'vencido').length;
            return (
              <button
                key={p.pisoId}
                type="button"
                role="option"
                aria-selected={activo}
                onClick={() => onSeleccionar(p.pisoId)}
                style={{ animationDelay: `${(total - idx) * 90}ms` }}
                className={cn(
                  'edificio-piso group relative block w-full text-left h-[60px] md:h-[68px] border-x-2 border-b border-slate-800',
                  'transition-[transform,filter,opacity] duration-300 ease-out',
                  'focus-visible:outline-none focus-visible:z-20',
                  activo
                    ? 'z-10 -translate-x-3 bg-[#F4EFE8]'
                    : cn('bg-[#E6DFD5] hover:-translate-x-1.5 hover:bg-[#EDE7DF]', seleccionado && 'opacity-80 saturate-[0.7] hover:opacity-100 hover:saturate-100')
                )}
              >
                {/* Cara lateral (profundidad) */}
                <div
                  className={cn(
                    'edificio-lado transition-colors duration-300',
                    activo ? 'bg-primary-600' : 'bg-[#BDB3A6] group-hover:bg-[#B0A597]'
                  )}
                />
                {/* Marco de selección */}
                <div
                  className={cn(
                    'absolute inset-0 pointer-events-none ring-inset transition-all duration-300',
                    activo ? 'ring-[3px] ring-primary-600' : 'ring-0 group-focus-visible:ring-2 group-focus-visible:ring-primary-500'
                  )}
                />
                <div className="relative h-full flex items-center gap-2.5 pl-2 pr-2.5">
                  {/* Placa con la letra del piso */}
                  <div
                    className={cn(
                      'relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-base transition-colors duration-300',
                      activo ? 'bg-primary-600 text-white' : 'bg-slate-900 text-white'
                    )}
                  >
                    {p.letra ?? p.numero}
                    {deuda > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#F4EFE8] tabular-nums"
                        aria-label={`${deuda} vencidos`}
                      >
                        {deuda}
                      </span>
                    )}
                  </div>
                  {/* El piso más bajo tiene la puerta a la calle */}
                  {idx === total - 1 && (
                    <span className="order-last w-6 h-9 md:h-10 self-end -mb-px rounded-t-md bg-slate-800 relative flex-shrink-0" aria-label="Puerta a la calle">
                      <span className="absolute right-1 top-1/2 w-1 h-1 rounded-full bg-[#F6D365]" />
                    </span>
                  )}
                  {/* Ventanas: una por cuarto */}
                  <div className="flex-1 flex items-center justify-evenly gap-1">
                    {habs.map((h, i) => {
                      const e = cobros.estado(h);
                      return (
                        <span
                          key={h.id}
                          title={`${h.codigo} · ${h.nombreInquilino ? `${h.nombreInquilino} · ` : ''}${ESTADO_ESTILO[e].label}`}
                          className={cn(
                            'edificio-ventana relative w-[18px] h-[26px] md:w-5 md:h-7 rounded-[3px] border-2 border-slate-800',
                            ESTADO_ESTILO[e].ventana
                          )}
                          style={{ animationDelay: `${(total - idx) * 90 + 300 + i * 60}ms` }}
                        >
                          <span className="absolute inset-x-0 top-1/2 h-px bg-slate-800/60" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Zócalo */}
        <div className="edificio-piso relative h-2.5 bg-[#BDB3A6] border-x-2 border-b-2 border-slate-800" style={{ animationDelay: '0ms' }}>
          <div className="edificio-lado bg-[#A89D8F]" />
        </div>
        {/* Vereda */}
        <div className="h-2 -ml-3 -mr-9 rounded-full bg-slate-300/80" />
        <p className="mt-3 text-center font-display font-bold tracking-tight text-slate-900">{nombre}</p>
      </div>
    </div>
  );
}
