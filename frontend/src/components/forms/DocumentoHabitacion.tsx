import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileDown, Printer, ExternalLink } from 'lucide-react';
import { useInquilinos, usePagos } from '@/hooks';
import { getContratoBlob, generateContratoPDF } from '@/components/voucher';
import { generarTrackingPdf, nombreArchivoTracking } from '@/utils/trackingPdf';
import type { HabitacionConDetalles } from '@/types';

interface DocumentoHabitacionProps {
  habitacion: HabitacionConDetalles;
  tipo: 'contrato' | 'tracking';
}

/** Vista previa, descarga e impresión del contrato o de la hoja de tracking del inquilino. */
export function DocumentoHabitacion({ habitacion: h, tipo }: DocumentoHabitacionProps) {
  const { data: inquilinos, isLoading } = useInquilinos();
  const { data: pagos } = usePagos();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const inq = inquilinos?.find((i) => i.habitacionId === h.id && i.estado === 'activo');

  useEffect(() => {
    if (!inq || (tipo === 'tracking' && !pagos)) return;
    let cancelado = false;
    let u: string | null = null;
    setError(false);
    (async () => {
      try {
        const blob =
          tipo === 'contrato'
            ? await getContratoBlob({ inquilino: inq, habitacion: h })
            : generarTrackingPdf({ inquilino: inq, habitacion: h, edificio: h.edificioNombre, pagos: pagos ?? [], anio }).output('blob');
        if (cancelado) return;
        u = URL.createObjectURL(blob);
        setUrl(u);
      } catch {
        if (!cancelado) setError(true);
      }
    })();
    return () => {
      cancelado = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [inq, h, tipo, pagos, anio]);

  if (isLoading) return <p className="text-sm text-slate-400 py-6">Cargando…</p>;
  if (!inq) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        Registra primero al inquilino en la pestaña <strong>Inquilino</strong>.
      </p>
    );
  }

  const descargar = () => {
    if (tipo === 'contrato') {
      generateContratoPDF({ inquilino: inq, habitacion: h });
    } else if (pagos) {
      generarTrackingPdf({ inquilino: inq, habitacion: h, edificio: h.edificioNombre, pagos, anio }).save(
        nombreArchivoTracking(h.codigo, `${inq.nombre} ${inq.apellido}`, anio)
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {tipo === 'contrato' ? 'Reglamento interno / contrato' : 'Hoja de tracking (2 caras)'}
          </p>
          <p className="text-xs text-slate-500">
            {inq.nombre} {inq.apellido} · {h.codigo}
            {tipo === 'tracking' && ' · imprimir a doble cara, A4 horizontal'}
          </p>
        </div>

        {tipo === 'tracking' && (
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1">
            <button type="button" onClick={() => setAnio((a) => a - 1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Año anterior">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-bold tabular-nums">{anio}</span>
            <button type="button" onClick={() => setAnio((a) => a + 1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Año siguiente">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {tipo === 'contrato' && inq.contratoPdfUrl && (
          <a href={inq.contratoPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <ExternalLink className="w-3.5 h-3.5" /> Archivado en Drive
          </a>
        )}
        <button type="button" onClick={descargar} className="btn btn-secondary btn-sm">
          <FileDown className="w-3.5 h-3.5" /> Descargar
        </button>
        <button
          type="button"
          onClick={() => url && window.open(url, '_blank', 'noopener')}
          disabled={!url}
          className="btn btn-primary btn-sm"
        >
          <Printer className="w-3.5 h-3.5" /> Abrir para imprimir
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">No se pudo generar el documento.</p>
      ) : url ? (
        <iframe src={url} title={tipo === 'contrato' ? 'Contrato' : 'Tracking'} className="w-full h-[60vh] rounded-xl border border-slate-200 bg-slate-100" />
      ) : (
        <div className="h-[60vh] rounded-xl bg-slate-100 animate-pulse" />
      )}
    </div>
  );
}
