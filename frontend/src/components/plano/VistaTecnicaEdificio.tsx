import { useEffect, useMemo, useState } from 'react';
import { Box, LayoutGrid, X, User, CalendarClock, Wallet } from 'lucide-react';
import { EdificioSimulado, type PisoEdificio } from './EdificioSimulado';
import { PlanoTecnico } from './PlanoTecnico';
import { useHabitacionesConEstadoPago, usePisos, useCobros } from '@/hooks';
import { ESTADO_ESTILO } from './estadoEstilos';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { textoCuenta } from '@/utils/cobro';
import { useConfigStore } from '@/store';
import { letraDePiso, leerPlanoLocal, planoAutomatico } from '@/utils/plano';
import type { Edificio, Piso } from '@/types';

/** Edificio 3D + planos técnicos de sus pisos, para la página Edificios. */
export function VistaTecnicaEdificio({ edificio }: { edificio: Edificio }) {
  const { mesActual, anioActual } = useConfigStore();
  const { data: habs } = useHabitacionesConEstadoPago(mesActual, anioActual, edificio.id);
  const { data: pisos } = usePisos(edificio.id);
  const [pisoId, setPisoId] = useState<string | null>(null);
  const [vista, setVista] = useState<'piso' | 'todos'>('piso');
  const [habId, setHabId] = useState<string | null>(null);
  const cobros = useCobros();

  const lista = useMemo<(PisoEdificio & { piso?: Piso })[]>(() => {
    const habitaciones = (habs ?? []).filter((h) => h.edificioId === edificio.id);
    return (pisos ?? [])
      .map((p) => {
        const delPiso = habitaciones.filter((h) => h.pisoId === p.id);
        const letra = letraDePiso(delPiso.map((h) => h.codigo));
        return {
          pisoId: p.id,
          piso: p,
          numero: Number(p.numero),
          letra,
          titulo: letra ? `Piso ${letra}` : `Piso ${p.numero}`,
          habitaciones: delPiso,
        };
      })
      .filter((p) => p.habitaciones.length)
      .sort((a, b) => a.numero - b.numero);
  }, [habs, pisos, edificio.id]);

  useEffect(() => setPisoId(null), [edificio.id]);
  useEffect(() => setHabId(null), [pisoId, edificio.id]);

  if (!lista.length) {
    return <div className="card p-6 text-sm text-slate-500">Este edificio aún no tiene cuartos para dibujar.</div>;
  }
  const sel = lista.find((p) => p.pisoId === pisoId) ?? lista[0];
  const planoDe = (p: (typeof lista)[number]) =>
    p.piso?.plano || leerPlanoLocal(p.pisoId) || planoAutomatico(p.habitaciones.map((h) => h.codigo));

  return (
    <section className="card p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Vista técnica</p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{edificio.nombre}</h2>
        </div>
        <div className="segmented" role="tablist" aria-label="Vista de planos">
          <button role="tab" aria-selected={vista === 'piso'} data-active={vista === 'piso'} onClick={() => setVista('piso')} className="segmented-item">
            <Box className="w-3.5 h-3.5" /> Edificio y piso
          </button>
          <button role="tab" aria-selected={vista === 'todos'} data-active={vista === 'todos'} onClick={() => setVista('todos')} className="segmented-item">
            <LayoutGrid className="w-3.5 h-3.5" /> Todos los planos
          </button>
        </div>
      </div>

      {vista === 'piso' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
          <div className="rounded-xl bg-slate-50 p-3">
            <EdificioSimulado key={edificio.id} nombre={edificio.nombre} pisos={lista} seleccionado={sel.pisoId} onSeleccionar={setPisoId} />
          </div>
          <div key={sel.pisoId} className="plano-aparecer relative">
            <PlanoTecnico
              plano={planoDe(sel)}
              habitaciones={sel.habitaciones}
              titulo={`${sel.titulo} · nivel ${sel.numero}`}
              subtitulo={`${edificio.nombre} · ${sel.habitaciones.length} cuartos`}
              seleccionada={habId ?? undefined}
              onHabitacionClick={(h) => setHabId(h.id === habId ? null : h.id)}
            />
            {(() => {
              const h = sel.habitaciones.find((x) => x.id === habId);
              if (!h) {
                return (
                  <p className="absolute top-3 left-3 rounded-md bg-[#0B2545]/80 px-2 py-1 text-[11px] font-mono text-[#E6F1FF]/80">
                    Toca un cuarto para ver su ficha
                  </p>
                );
              }
              const estado = cobros.estado(h);
              const st = ESTADO_ESTILO[estado];
              const c = cobros.cobro(h);
              const deuda = cobros.deuda(h);
              return (
                <div className="plano-aparecer absolute top-3 right-3 w-[260px] max-w-[calc(100%-1.5rem)] rounded-lg border border-[#7CC4FF]/60 bg-[#0B2545]/95 text-[#E6F1FF] shadow-popover backdrop-blur-sm font-mono">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#7CC4FF]/30">
                    <span className="text-lg font-bold tracking-wider">{h.codigo}</span>
                    <span className={cn('badge', st.badge)}>{st.label}</span>
                    <button type="button" onClick={() => setHabId(null)} className="p-1 rounded hover:bg-white/10" aria-label="Cerrar ficha">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <dl className="px-3 py-2.5 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 mt-0.5 opacity-70" />
                      <dd className="font-sans font-semibold">{h.nombreInquilino || (h.estado === 'vacant' ? 'Libre' : 'Sin inquilino')}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 opacity-70" />
                      <dd>Alquiler {formatCurrency(Number(h.montoAlquiler || 0))}</dd>
                    </div>
                    {h.estado === 'occupied' && h.nombreInquilino && c && (
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-3.5 h-3.5 opacity-70" />
                        <dd className={cn(estado === 'vencido' ? 'text-red-300' : estado === 'por-vencer' ? 'text-amber-300' : 'text-emerald-300')}>
                          {estado === 'vencido'
                            ? `Debe ${formatCurrency(deuda)} · ${c.atrasados.length} mes(es)`
                            : c.proximo
                            ? `Próx. ${c.proximo.vence.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} · ${textoCuenta(c.dias)}`
                            : 'Al día'}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...lista].reverse().map((p) => (
            <button key={p.pisoId} type="button" onClick={() => { setPisoId(p.pisoId); setVista('piso'); }} className="text-left group">
              <PlanoTecnico plano={planoDe(p)} habitaciones={p.habitaciones} titulo={p.titulo} compacto className="group-hover:ring-2 group-hover:ring-primary-500 transition" />
              <p className="mt-1.5 text-sm font-semibold text-slate-800">
                {p.titulo} <span className="font-normal text-slate-500">· nivel {p.numero} · {p.habitaciones.length} cuartos</span>
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
