import { useState } from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { InquilinoForm } from './InquilinoForm';
import type { CapturaDniValue } from './CapturaDni';
import { ConfirmDialog } from '@/components/ui';
import { useInquilinos, useCreateInquilino, useUpdateInquilino, useDarBajaInquilino } from '@/hooks';
import { driveApi } from '@/api';
import { useNotifications } from '@/store';
import { formatDate, hoyISO } from '@/utils/formatters';
import type { HabitacionConDetalles, InquilinoInput, TipoDocumentoDrive } from '@/types';

interface InquilinoDeHabitacionProps {
  habitacion: HabitacionConDetalles;
  onListo: () => void;
}

/**
 * Inquilino del cuarto, editable desde la ventana de la habitación.
 * El formulario queda fijo a este cuarto: así habitación e inquilino no se desalinean.
 */
export function InquilinoDeHabitacion({ habitacion, onListo }: InquilinoDeHabitacionProps) {
  const { notify } = useNotifications();
  const { data: inquilinos, isLoading } = useInquilinos();
  const createInq = useCreateInquilino();
  const updateInq = useUpdateInquilino();
  const darBaja = useDarBajaInquilino();
  const [subiendo, setSubiendo] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const inq = inquilinos?.find((i) => i.habitacionId === habitacion.id && i.estado === 'activo');

  // Las fotos del DNI se suben después de guardar: si Drive falla, el alta no se pierde
  const subirDni = async (inquilinoId: string, fotos: CapturaDniValue) => {
    const tareas: { tipo: TipoDocumentoDrive; archivoBase64: string }[] = [];
    if (fotos.frente) tareas.push({ tipo: 'dni-frente', archivoBase64: fotos.frente });
    if (fotos.reverso) tareas.push({ tipo: 'dni-reverso', archivoBase64: fotos.reverso });
    if (!tareas.length) return;
    setSubiendo(true);
    try {
      for (const t of tareas) await driveApi.subir({ ...t, inquilinoId });
      notify.success('Fotos del DNI guardadas en Drive');
    } catch {
      notify.error('El inquilino se guardó, pero no se pudieron subir las fotos del DNI.');
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async (data: InquilinoInput, fotos: CapturaDniValue) => {
    // Siempre ligado a este cuarto
    const datos = { ...data, habitacionId: habitacion.id };
    try {
      if (inq) {
        await updateInq.mutateAsync({ id: inq.id, data: datos });
        notify.success(`Inquilino de ${habitacion.codigo} actualizado`);
        await subirDni(inq.id, fotos);
      } else {
        const nuevo = await createInq.mutateAsync(datos);
        notify.success(`Inquilino registrado en ${habitacion.codigo}`);
        if (nuevo?.id) await subirDni(nuevo.id, fotos);
      }
      onListo();
    } catch {
      notify.error('No se pudo guardar el inquilino');
    }
  };

  const confirmar = async () => {
    if (!inq) return;
    try {
      await darBaja.mutateAsync({ id: inq.id, fechaSalida: hoyISO() });
      notify.success(`${inq.nombre} dado de baja; ${habitacion.codigo} queda vacante`);
      setConfirmarBaja(false);
      onListo();
    } catch {
      notify.error('No se pudo dar de baja');
    }
  };

  if (isLoading) return <p className="text-sm text-slate-400 py-6">Cargando inquilino…</p>;

  // Cuarto sin inquilino: invitar a registrar
  if (!inq && !registrando) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-sm text-slate-500">
          {habitacion.codigo} no tiene un inquilino activo
          {habitacion.estado === 'occupied' && ' (figura como ocupado, conviene registrarlo)'}.
        </p>
        <button type="button" onClick={() => setRegistrando(true)} className="btn btn-primary">
          <UserPlus className="w-4 h-4" /> Registrar inquilino en {habitacion.codigo}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inq && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-600">
            <strong className="text-slate-900">{inq.nombre} {inq.apellido}</strong> vive en {habitacion.codigo} desde{' '}
            {formatDate(inq.fechaIngreso)}
          </span>
          <button
            type="button"
            onClick={() => setConfirmarBaja(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <UserMinus className="w-3.5 h-3.5" /> Dar de baja
          </button>
        </div>
      )}

      <InquilinoForm
        habitaciones={[habitacion]}
        initialData={inq ? { ...inq } : { habitacionId: habitacion.id }}
        dniUrls={{ frente: inq?.dniFotoFrenteUrl, reverso: inq?.dniFotoReversoUrl }}
        contexto={{ edificio: habitacion.edificioNombre ?? null }}
        onSubmit={guardar}
        onCancel={inq ? onListo : () => setRegistrando(false)}
        isLoading={createInq.isPending || updateInq.isPending || subiendo}
      />

      <ConfirmDialog
        isOpen={confirmarBaja}
        onClose={() => setConfirmarBaja(false)}
        onConfirm={confirmar}
        title="Dar de baja al inquilino"
        message={`${inq?.nombre ?? ''} ${inq?.apellido ?? ''} dejará ${habitacion.codigo} con fecha de salida hoy. El cuarto quedará vacante y su historial de pagos se conserva.`}
        confirmText="Dar de baja"
        isLoading={darBaja.isPending}
      />
    </div>
  );
}
