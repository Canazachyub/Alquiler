import { useEffect, useMemo, useState } from 'react';
import { Printer, FileDown } from 'lucide-react';
import { usePagos, useEdificios, useCiudades } from '@/hooks';
import { generarResumenPagosPdf, nombreArchivoResumen } from '@/utils/resumenPdf';
import { generarPlanillaCobrosPdf, nombreArchivoPlanilla } from '@/utils/planillaPdf';
import { getMonthName } from '@/utils/formatters';
import type { HabitacionConDetalles } from '@/types';

interface ResumenImprimibleProps {
  habitaciones: HabitacionConDetalles[];
  mesFin: number;
  anioFin: number;
  /** Edificio elegido en el header, si hay */
  edificioInicial?: string | null;
}

/** Vista previa y descarga del resumen de pagos en una hoja. */
export function ResumenImprimible({ habitaciones, mesFin, anioFin, edificioInicial }: ResumenImprimibleProps) {
  const { data: pagos } = usePagos();
  const { data: edificios } = useEdificios();
  const { data: ciudades } = useCiudades();

  // Edificios con cuartos; por defecto el del header o el que tenga más cuartos
  const opciones = useMemo(() => {
    const cuenta = new Map<string, { id: string; nombre: string; n: number }>();
    habitaciones.forEach((h) => {
      if (!h.edificioId) return;
      const e = cuenta.get(h.edificioId) ?? { id: h.edificioId, nombre: h.edificioNombre || 'Edificio', n: 0 };
      e.n++;
      cuenta.set(h.edificioId, e);
    });
    return [...cuenta.values()].sort((a, b) => b.n - a.n);
  }, [habitaciones]);

  const [edificioId, setEdificioId] = useState<string>(edificioInicial || '');
  const [tipo, setTipo] = useState<'planilla' | 'resumen'>('planilla');
  const [meses, setMeses] = useState(4);
  const [url, setUrl] = useState<string | null>(null);
  const elegido = opciones.find((o) => o.id === edificioId) ?? opciones[0];

  const generar = () => {
    if (!elegido || !pagos) return null;
    const ed = edificios?.find((e) => e.id === elegido.id);
    const ciudad = ciudades?.find((c) => c.id === ed?.ciudadId)?.nombre;
    const base = {
      edificio: elegido.nombre,
      ciudad: ciudad ? ciudad.charAt(0) + ciudad.slice(1).toLowerCase() : undefined,
      habitaciones: habitaciones.filter((h) => h.edificioId === elegido.id),
      pagos,
      meses,
    };
    return tipo === 'planilla'
      ? generarPlanillaCobrosPdf({ ...base, mesInicio: mesFin, anioInicio: anioFin })
      : generarResumenPagosPdf({ ...base, mesFin, anioFin });
  };

  // Vista previa: se regenera al cambiar edificio, meses o datos
  useEffect(() => {
    const doc = generar();
    if (!doc) return;
    const u = URL.createObjectURL(doc.output('blob'));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegido?.id, tipo, meses, pagos, habitaciones, mesFin, anioFin, edificios, ciudades]);

  const descargar = () => {
    const doc = generar();
    if (doc && elegido)
      doc.save(
        tipo === 'planilla'
          ? nombreArchivoPlanilla(elegido.nombre, mesFin, anioFin)
          : nombreArchivoResumen(elegido.nombre, mesFin, anioFin)
      );
  };
  const imprimir = () => {
    if (url) window.open(url, '_blank', 'noopener');
  };

  if (!pagos) return <p className="text-sm text-slate-400 py-6">Cargando pagos…</p>;
  if (!opciones.length) return <p className="text-sm text-slate-500 py-6">No hay cuartos para resumir.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="label">Tipo de hoja</p>
          <div className="segmented" role="radiogroup" aria-label="Tipo de hoja">
            <button type="button" role="radio" aria-checked={tipo === 'planilla'} data-active={tipo === 'planilla'} onClick={() => setTipo('planilla')} className="segmented-item">
              Planilla para marcar
            </button>
            <button type="button" role="radio" aria-checked={tipo === 'resumen'} data-active={tipo === 'resumen'} onClick={() => setTipo('resumen')} className="segmented-item">
              Resumen de lo pagado
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="res-edificio" className="label">Edificio</label>
          <select
            id="res-edificio"
            value={elegido?.id}
            onChange={(e) => setEdificioId(e.target.value)}
            className="select w-56"
          >
            {opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} ({o.n} cuartos)
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="label">Meses</p>
          <div className="segmented" role="radiogroup" aria-label="Meses a incluir">
            {[3, 4, 6].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={meses === n}
                data-active={meses === n}
                onClick={() => setMeses(n)}
                className="segmented-item"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 pb-2">
          {tipo === 'planilla' ? 'Desde' : 'Hasta'} {getMonthName(mesFin).toLowerCase()} {anioFin} · una hoja A4 horizontal
        </p>
        <div className="flex gap-2 ml-auto">
          <button type="button" onClick={descargar} className="btn btn-secondary">
            <FileDown className="w-4 h-4" /> Descargar
          </button>
          <button type="button" onClick={imprimir} className="btn btn-primary" disabled={!url}>
            <Printer className="w-4 h-4" /> Abrir para imprimir
          </button>
        </div>
      </div>

      {url && (
        <iframe
          src={url}
          title="Vista previa del resumen"
          className="w-full h-[62vh] rounded-xl border border-slate-200 bg-slate-100"
        />
      )}
    </div>
  );
}
