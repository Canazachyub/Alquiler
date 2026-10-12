import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Contact2 as IdCard,
  FileText,
  UserRound,
  ExternalLink,
  Pencil,
  Download,
  ShieldCheck,
  KeyRound,
  DoorClosed,
  Phone,
  Mail,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { useInquilinos } from '@/hooks';
import { getContratoBlob, generateContratoPDF } from '@/components/voucher';
import { cn } from '@/utils/cn';
import { formatDate, formatDNI, formatPhone } from '@/utils/formatters';
import type { HabitacionConDetalles, Inquilino } from '@/types';

type Pestana = 'datos' | 'dni' | 'contrato';

/** Id de un archivo de Drive a partir de su URL (…/file/d/<id>/… o ?id=<id>) */
function idDrive(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/d\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/);
  return m ? m[1] : null;
}

/** Visor embebido de Drive. Los archivos son privados: se ven si el navegador tiene la sesión del dueño. */
function VisorDrive({ url, titulo, alto = 'h-64' }: { url?: string; titulo: string; alto?: string }) {
  const id = idDrive(url);
  if (!id) {
    return (
      <div className={cn('rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-center px-4', alto)}>
        <IdCard className="w-6 h-6 text-slate-300" />
        <p className="text-xs text-slate-500">{titulo}: sin archivo</p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <iframe
        src={`https://drive.google.com/file/d/${id}/preview`}
        title={titulo}
        className={cn('w-full rounded-lg border border-slate-200 bg-slate-50', alto)}
        allow="autoplay"
        loading="lazy"
      />
      <a href={url} target="_blank" rel="noopener noreferrer" className="link-arrow text-xs">
        Abrir {titulo.toLowerCase()} en Drive
      </a>
    </div>
  );
}

function Dato({ icon: Icon, label, valor }: { icon: typeof Phone; label: string; valor?: string | null }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm text-slate-800 truncate">{valor || <span className="text-slate-300">—</span>}</p>
      </div>
    </div>
  );
}

function Entrega({ ok, label, icon: Icon }: { ok?: boolean; label: string; icon: typeof KeyRound }) {
  return (
    <span className={cn('badge', ok ? 'badge-success' : 'badge-neutral')}>
      <Icon className="w-3 h-3" />
      {label} {ok ? '✓' : '—'}
    </span>
  );
}

export function PanelInquilino({
  habitacion,
  onEditarInquilino,
}: {
  habitacion: HabitacionConDetalles;
  /** Abre la pestaña Inquilino de la ventana de la habitación */
  onEditarInquilino?: () => void;
}) {
  const navigate = useNavigate();
  const { data: inquilinos, isLoading } = useInquilinos();
  const [pestana, setPestana] = useState<Pestana>('datos');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);

  const inq: Inquilino | undefined = inquilinos?.find(
    (i) => i.habitacionId === habitacion.id && i.estado === 'activo'
  );

  // Liberar el PDF generado al cambiar de inquilino o desmontar
  useEffect(() => {
    setPdfUrl(null);
  }, [inq?.id]);
  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const generarVista = async () => {
    if (!inq) return;
    setGenerando(true);
    try {
      const blob = await getContratoBlob({ inquilino: inq, habitacion });
      setPdfUrl(URL.createObjectURL(blob));
    } finally {
      setGenerando(false);
    }
  };

  if (isLoading) return null;
  if (!inq) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <AlertCircle className="w-4 h-4" />
        No hay un inquilino activo registrado en este cuarto.
        <button onClick={() => navigate('/inquilinos')} className="ml-auto link-arrow text-xs">
          Ir a Inquilinos
        </button>
      </div>
    );
  }

  const pestanas: { id: Pestana; label: string; icon: typeof IdCard }[] = [
    { id: 'datos', label: 'Inquilino', icon: UserRound },
    { id: 'dni', label: 'DNI', icon: IdCard },
    { id: 'contrato', label: 'Contrato', icon: FileText },
  ];

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden plano-aparecer">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <div className="segmented" role="tablist" aria-label="Información del inquilino">
          {pestanas.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestana === p.id}
              data-active={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className="segmented-item"
            >
              <p.icon className="w-3.5 h-3.5" /> {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => (onEditarInquilino ? onEditarInquilino() : navigate(`/inquilinos?editar=${inq.id}`))}
            className="btn btn-ghost btn-sm"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar inquilino
          </button>
          <button onClick={() => navigate(`/pagos?hab=${habitacion.id}`)} className="btn btn-ghost btn-sm">
            <CreditCard className="w-3.5 h-3.5" /> Pagos
          </button>
        </div>
      </div>

      <div className="p-4">
        {pestana === 'datos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Dato icon={IdCard} label="DNI" valor={formatDNI(inq.dni)} />
              <Dato icon={Phone} label="Teléfono" valor={formatPhone(inq.telefono)} />
              <Dato icon={Mail} label="Correo" valor={inq.email} />
              <Dato icon={UserRound} label="Ingreso" valor={formatDate(inq.fechaIngreso)} />
              <Dato
                icon={AlertCircle}
                label="Contacto de emergencia"
                valor={[inq.contactoEmergencia, inq.telefonoEmergencia && formatPhone(inq.telefonoEmergencia)].filter(Boolean).join(' · ')}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Entrega ok={inq.garantia} label="Garantía" icon={ShieldCheck} />
              <Entrega ok={inq.llaveHabitacion} label="Llave cuarto" icon={KeyRound} />
              <Entrega ok={inq.llavePuertaCalle} label="Llave calle" icon={DoorClosed} />
              <span className={cn('badge', inq.dniFotoFrenteUrl && inq.dniFotoReversoUrl ? 'badge-success' : 'badge-warning')}>
                <IdCard className="w-3 h-3" /> DNI {inq.dniFotoFrenteUrl && inq.dniFotoReversoUrl ? 'completo' : 'incompleto'}
              </span>
              <span className={cn('badge', inq.contratoPdfUrl ? 'badge-success' : 'badge-warning')}>
                <FileText className="w-3 h-3" /> Contrato {inq.contratoPdfUrl ? 'archivado' : 'sin archivar'}
              </span>
            </div>
            {inq.observaciones && (
              <p className="text-sm text-slate-600 rounded-lg bg-slate-50 px-3 py-2">{inq.observaciones}</p>
            )}
          </div>
        )}

        {pestana === 'dni' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Frente</p>
              <VisorDrive url={inq.dniFotoFrenteUrl} titulo="DNI frente" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Reverso</p>
              <VisorDrive url={inq.dniFotoReversoUrl} titulo="DNI reverso" />
            </div>
            {!(inq.dniFotoFrenteUrl && inq.dniFotoReversoUrl) && (
              <button
                onClick={() => (onEditarInquilino ? onEditarInquilino() : navigate(`/inquilinos?editar=${inq.id}`))}
                className="md:col-span-2 link-arrow text-xs justify-self-start"
              >
                Tomar o subir las fotos del DNI
              </button>
            )}
          </div>
        )}

        {pestana === 'contrato' && (
          <div className="space-y-3">
            {inq.contratoPdfUrl ? (
              <VisorDrive url={inq.contratoPdfUrl} titulo="Contrato" alto="h-[480px]" />
            ) : pdfUrl ? (
              <iframe src={pdfUrl} title="Vista previa del contrato" className="w-full h-[480px] rounded-lg border border-slate-200" />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center space-y-3">
                <FileText className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">El contrato aún no está archivado en Drive.</p>
                <button onClick={generarVista} disabled={generando} className="btn btn-secondary btn-sm">
                  {generando ? 'Generando…' : 'Ver vista previa'}
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateContratoPDF({ inquilino: inq, habitacion })}
                className="btn btn-ghost btn-sm"
              >
                <Download className="w-3.5 h-3.5" /> Descargar PDF
              </button>
              {!inq.contratoPdfUrl && (
                <button onClick={() => navigate('/inquilinos')} className="btn btn-ghost btn-sm">
                  <ExternalLink className="w-3.5 h-3.5" /> Archivar en Drive (Inquilinos)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
