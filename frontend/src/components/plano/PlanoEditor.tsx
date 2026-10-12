import { useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { PlanoPiso } from './PlanoPiso';
import { parsearPlano, planoATexto, planoAutomatico, serializarPlano, compararCodigos, letraDePiso, PLANTILLAS } from '@/utils/plano';
import type { HabitacionConDetalles } from '@/types';

interface PlanoEditorProps {
  planoInicial: string;
  habitaciones: HabitacionConDetalles[];
  onGuardar: (plano: string) => void;
  onCancelar: () => void;
  guardando?: boolean;
}

export function PlanoEditor({ planoInicial, habitaciones, onGuardar, onCancelar, guardando }: PlanoEditorProps) {
  const [texto, setTexto] = useState(() => planoATexto(planoInicial));
  const plano = serializarPlano(texto);
  const { errores, areas } = useMemo(() => parsearPlano(plano), [plano]);

  const letra = letraDePiso(habitaciones.map((h) => h.codigo));
  const ubicadas = new Set(areas.map((a) => a.token.toLowerCase()));
  const sinUbicar = habitaciones
    .filter((h) => !ubicadas.has(h.codigo.trim().toLowerCase()))
    .map((h) => h.codigo)
    .sort(compararCodigos);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="plano-texto" className="label !mb-0">Distribución</label>
            <button
              type="button"
              className="link-arrow text-xs"
              onClick={() => setTexto(planoATexto(planoAutomatico(habitaciones.map((h) => h.codigo))))}
            >
              <Wand2 className="w-3.5 h-3.5" /> Generar automático
            </button>
          </div>
          {letra && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PLANTILLAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTexto(planoATexto(p.generar(letra)))}
                  className="btn btn-secondary btn-sm"
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          )}
          <textarea
            id="plano-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            rows={7}
            className="input !h-auto py-3 font-mono text-[13px] leading-6 resize-y"
            placeholder={'escalera  A1       A2\nbano      pasillo  pasillo\nA5        A4       A3'}
          />
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1.5">
            <p>
              <strong className="text-slate-800">Una línea por fila</strong>, celdas separadas por espacios.
              Repite un nombre en celdas vecinas para ensancharlo.
            </p>
            <p>
              Espacios: <code className="font-mono">pasillo</code> <code className="font-mono">bano</code>{' '}
              <code className="font-mono">escalera</code> <code className="font-mono">entrada</code>{' '}
              <code className="font-mono">cocina</code> <code className="font-mono">lavanderia</code>{' '}
              <code className="font-mono">patio</code> · <code className="font-mono">.</code> = vacío
            </p>
          </div>
          {sinUbicar.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Habitaciones sin ubicar</p>
              <div className="flex flex-wrap gap-1.5">
                {sinUbicar.map((c) => (
                  <span key={c} className="badge badge-warning">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="label">Vista previa</p>
          {plano ? (
            <PlanoPiso plano={plano} habitaciones={habitaciones} compacto />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-300 h-40 flex items-center justify-center text-sm text-slate-400">
              Escribe la distribución
            </div>
          )}
          {errores.length > 0 && (
            <ul className="mt-3 space-y-1">
              {errores.map((e) => (
                <li key={e} className="form-error !mt-0">{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancelar} className="btn btn-secondary">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onGuardar(plano)}
          className="btn btn-primary"
          disabled={guardando || errores.length > 0}
        >
          {guardando ? 'Guardando…' : 'Guardar plano'}
        </button>
      </div>
    </div>
  );
}
