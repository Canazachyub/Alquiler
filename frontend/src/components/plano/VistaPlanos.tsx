import { useEffect, useMemo, useState } from 'react';
import { PencilRuler, MousePointerClick } from 'lucide-react';
import { Modal } from '@/components/ui';
import { PlanoPiso, LeyendaPlano } from './PlanoPiso';
import { PlanoEditor } from './PlanoEditor';
import { EdificioSimulado, type PisoEdificio } from './EdificioSimulado';
import { FichaHabitacion } from './FichaHabitacion';
import { HistorialPagos } from './HistorialPagos';
import { PanelInquilino } from './PanelInquilino';
import { useUpdatePiso, useCobros } from '@/hooks';
import { useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import { planoAutomatico, leerPlanoLocal, guardarPlanoLocal, letraDePiso } from '@/utils/plano';
import type { HabitacionConDetalles, Piso } from '@/types';

interface VistaPlanosProps {
  habitaciones: HabitacionConDetalles[];
  pisos: Piso[];
  resaltadas: Set<string>;
  onHabitacionClick: (h: HabitacionConDetalles, pestana?: 'habitacion' | 'inquilino' | 'pago') => void;
}

interface EdificioAgrupado {
  id: string;
  nombre: string;
  pisos: (PisoEdificio & { piso?: Piso })[];
}

/** Vista "Edificio": fachada animada → plano del piso elegido → ficha del cuarto. */
export function VistaPlanos({ habitaciones, pisos, resaltadas, onHabitacionClick }: VistaPlanosProps) {
  const { notify } = useNotifications();
  const updatePiso = useUpdatePiso();
  const cobros = useCobros();
  const [editando, setEditando] = useState(false);
  const [, setVersionLocal] = useState(0);

  const edificios = useMemo<EdificioAgrupado[]>(() => {
    const porEdificio = new Map<string, EdificioAgrupado>();
    habitaciones.forEach((h) => {
      const piso = pisos.find((p) => p.id === h.pisoId);
      const edId = h.edificioId || piso?.edificioId || 'sin-edificio';
      const ed = porEdificio.get(edId) ?? { id: edId, nombre: h.edificioNombre || 'Edificio', pisos: [] };
      let pe = ed.pisos.find((p) => p.pisoId === h.pisoId);
      if (!pe) {
        const numero = piso?.numero ?? h.pisoNumero ?? 0;
        pe = { pisoId: h.pisoId, piso, numero, letra: null, titulo: '', habitaciones: [] };
        ed.pisos.push(pe);
      }
      pe.habitaciones.push(h);
      porEdificio.set(edId, ed);
    });
    porEdificio.forEach((ed) => {
      ed.pisos.sort((a, b) => a.numero - b.numero);
      ed.pisos.forEach((p) => {
        p.letra = letraDePiso(p.habitaciones.map((h) => h.codigo));
        p.titulo = p.letra ? `Piso ${p.letra}` : p.piso?.descripcion?.trim() || `Piso ${p.numero}`;
      });
    });
    // Primero el edificio con más pisos (el principal)
    return [...porEdificio.values()].sort(
      (a, b) => b.pisos.length - a.pisos.length || a.nombre.localeCompare(b.nombre)
    );
  }, [habitaciones, pisos]);

  const [edificioId, setEdificioId] = useState<string | null>(null);
  const [pisoId, setPisoId] = useState<string | null>(null);
  const [habId, setHabId] = useState<string | null>(null);

  const edificio = edificios.find((e) => e.id === edificioId) ?? edificios[0];
  const pisoSel = edificio?.pisos.find((p) => p.pisoId === pisoId) ?? edificio?.pisos[0];
  const habSel = pisoSel?.habitaciones.find((h) => h.id === habId);

  // Al cambiar de edificio o piso, cerrar la ficha
  useEffect(() => setHabId(null), [edificio?.id, pisoSel?.pisoId]);

  if (!edificio || !pisoSel) return null;

  const planoDe = (p: PisoEdificio & { piso?: Piso }) =>
    p.piso?.plano || leerPlanoLocal(p.pisoId) || planoAutomatico(p.habitaciones.map((h) => h.codigo));
  const esAutomatico = !pisoSel.piso?.plano && !leerPlanoLocal(pisoSel.pisoId);

  const cuenta = { ocupadas: 0, deuda: 0, porVencer: 0, vacantes: 0 };
  pisoSel.habitaciones.forEach((h) => {
    const e = cobros.estado(h);
    if (h.estado === 'occupied') cuenta.ocupadas++;
    if (e === 'vencido') cuenta.deuda++;
    if (e === 'por-vencer') cuenta.porVencer++;
    if (e === 'vacante') cuenta.vacantes++;
  });

  const guardar = async (plano: string) => {
    guardarPlanoLocal(pisoSel.pisoId, plano);
    try {
      const actualizado = await updatePiso.mutateAsync({ id: pisoSel.pisoId, data: { plano } });
      if (actualizado && (actualizado as Piso).plano === undefined) {
        notify.warning('Plano guardado solo en este navegador. Actualiza el backend (columna "Plano") para compartirlo.');
      } else {
        notify.success('Plano guardado');
      }
    } catch {
      notify.warning('Plano guardado solo en este navegador: no se pudo sincronizar con la hoja.');
    }
    setVersionLocal((v) => v + 1);
    setEditando(false);
  };

  return (
    <div className="space-y-4">
      {edificios.length > 1 && (
        <div className="segmented max-w-full overflow-x-auto no-scrollbar">
          {edificios.map((e) => (
            <button
              key={e.id}
              data-active={e.id === edificio.id}
              onClick={() => {
                setEdificioId(e.id);
                setPisoId(null);
              }}
              className="segmented-item"
            >
              {e.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] gap-4 items-start">
        {/* Edificio simulado */}
        <div className="card p-4 md:p-5 lg:sticky lg:top-20">
          <p className="eyebrow mb-1">Elige un piso</p>
          <EdificioSimulado
            key={edificio.id}
            nombre={edificio.nombre}
            pisos={edificio.pisos}
            seleccionado={pisoSel.pisoId}
            onSeleccionar={setPisoId}
          />
          <div className="mt-4 pt-3 border-t border-slate-100">
            <LeyendaPlano />
          </div>
        </div>

        {/* Plano + ficha del cuarto */}
        <section className="card p-4 md:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-11 h-11 rounded-full bg-primary-600 text-white flex items-center justify-center font-display font-bold text-lg flex-shrink-0">
                {pisoSel.letra ?? pisoSel.numero}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{pisoSel.titulo}</h2>
                <p className="text-xs text-slate-500">
                  {edificio.nombre} · nivel {pisoSel.numero} · {pisoSel.habitaciones.length} cuartos
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setEditando(true)} className="btn btn-secondary btn-sm">
              <PencilRuler className="w-3.5 h-3.5" />
              {esAutomatico ? 'Dibujar plano' : 'Editar plano'}
            </button>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Ocupados', valor: cuenta.ocupadas, cls: 'text-slate-900' },
              { label: 'Vencidos', valor: cuenta.deuda, cls: cuenta.deuda ? 'text-red-600' : 'text-slate-900' },
              { label: 'Por vencer', valor: cuenta.porVencer, cls: cuenta.porVencer ? 'text-amber-700' : 'text-slate-900' },
              { label: 'Vacantes', valor: cuenta.vacantes, cls: 'text-slate-900' },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className={cn('font-display text-xl font-bold tabular-nums leading-tight', m.cls)}>{m.valor}</p>
                <p className="text-[11px] text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>

          <div key={pisoSel.pisoId} className="plano-aparecer">
            <PlanoPiso
              plano={planoDe(pisoSel)}
              habitaciones={pisoSel.habitaciones}
              resaltadas={resaltadas}
              seleccionada={habSel?.id}
              onHabitacionClick={(h) => setHabId(h.id)}
            />
          </div>
          {esAutomatico && (
            <p className="text-[11px] text-slate-400 mt-2">
              Distribución sugerida. Usa “Dibujar plano” para ajustarla a la real.
            </p>
          )}

          <div className="mt-4">
            {habSel ? (
              <>
                <FichaHabitacion
                  key={habSel.id}
                  habitacion={habSel}
                  onCerrar={() => setHabId(null)}
                  onEditar={() => onHabitacionClick(habSel)}
                  onRegistrarPago={() => onHabitacionClick(habSel, 'pago')}
                />
                {habSel.estado === 'occupied' && (
                  <>
                    <PanelInquilino
                      key={`inq-${habSel.id}`}
                      habitacion={habSel}
                      onEditarInquilino={() => onHabitacionClick(habSel, 'inquilino')}
                    />
                    <HistorialPagos key={`hist-${habSel.id}`} habitacion={habSel} />
                  </>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 flex items-center gap-3 text-sm text-slate-500">
                <MousePointerClick className="w-4 h-4 flex-shrink-0" />
                Toca un cuarto del plano para ver su información.
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={editando}
        onClose={() => setEditando(false)}
        title={`Plano · ${pisoSel.titulo} · ${edificio.nombre}`}
        size="xl"
      >
        {editando && (
          <PlanoEditor
            planoInicial={planoDe(pisoSel)}
            habitaciones={pisoSel.habitaciones}
            onGuardar={guardar}
            onCancelar={() => setEditando(false)}
            guardando={updatePiso.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
