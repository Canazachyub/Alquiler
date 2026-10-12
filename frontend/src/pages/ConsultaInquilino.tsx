import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, CalendarClock, Receipt } from 'lucide-react';
import { consultaApi, habitacionesApi, pagosApi, inquilinosApi, type ConsultaPublica } from '@/api';
import { modalidadDeInquilino } from '@/utils/modalidad';
import { calcularCobro, textoCuenta } from '@/utils/cobro';
import { periodoCubierto } from '@/utils/modalidad';
import { letraDePiso } from '@/utils/plano';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatters';
import type { HabitacionConDetalles, Pago } from '@/types';

/**
 * Página que abre el inquilino al escanear el QR de su voucher o reglamento.
 * Sobria y solo con lo suyo: estado de pago, próximo pago y sus últimos pagos.
 */

async function cargar(habitacionId: string): Promise<ConsultaPublica> {
  try {
    return await consultaApi.porHabitacion(habitacionId);
  } catch {
    // Respaldo para un backend sin la ruta /consulta: arma lo mismo con lo mínimo
    const ahora = new Date();
    const habs = await habitacionesApi.getConEstadoPago(ahora.getMonth() + 1, ahora.getFullYear());
    const h = habs.find((x) => x.id === habitacionId);
    if (!h) throw new Error('no-encontrada');
    const pagos = (await pagosApi.getByHabitacion(habitacionId)).filter((p) => p.concepto === 'alquiler' && p.estado !== 'anulado');
    const inq = (await inquilinosApi.getAll()).find((i) => i.habitacionId === habitacionId && i.estado === 'activo');
    return {
      habitacionId: h.id,
      codigo: h.codigo,
      estado: h.estado,
      edificio: h.edificioNombre ?? '',
      montoAlquiler: Number(h.montoAlquiler || 0),
      inquilino: h.nombreInquilino
        ? {
            nombre: h.nombreInquilino.split(' ')[0],
            fechaIngreso: h.fechaIngreso ?? '',
            modalidadPago: inq ? modalidadDeInquilino(inq) : 'adelantado',
          }
        : null,
      pagos: pagos.map((p) => ({ mes: Number(p.mes), anio: Number(p.anio), fecha: p.fecha, monto: Number(p.monto), concepto: p.concepto, estado: p.estado })),
    };
  }
}

const fechaLarga = (d: Date) => d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const fechaCorta = (d: Date) => d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col items-center px-4 py-6">
      <header className="w-full max-w-md flex items-center gap-2 mb-5">
        <span className="flex -space-x-1" aria-hidden>
          <span className="w-3.5 h-3.5 rounded-full bg-teal-500" />
          <span className="w-3.5 h-3.5 rounded-full bg-coral-500" />
          <span className="w-3.5 h-3.5 rounded-full bg-olive-500" />
        </span>
        <span className="font-display font-bold text-slate-900 tracking-tight">Sistema de Alquiler Puno</span>
      </header>
      <main className="w-full max-w-md space-y-4">{children}</main>
      <footer className="w-full max-w-md mt-6 text-center text-[11px] text-slate-400">
        Consulta del {fechaCorta(new Date())} · Ante cualquier duda, comuníquese con la administración.
      </footer>
    </div>
  );
}

export function ConsultaInquilino() {
  const [params] = useSearchParams();
  const habitacionId = params.get('hab');
  const [datos, setDatos] = useState<ConsultaPublica | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!habitacionId) {
      setError('El código de consulta no es válido.');
      return;
    }
    cargar(habitacionId)
      .then(setDatos)
      .catch(() => setError('No encontramos información para este código.'));
  }, [habitacionId]);

  if (error) {
    return (
      <Marco>
        <div className="card p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-900">{error}</p>
          <p className="text-sm text-slate-500 mt-1">Verifique el código QR de su comprobante.</p>
        </div>
      </Marco>
    );
  }

  if (!datos) {
    return (
      <Marco>
        <div className="card p-6 space-y-3 animate-pulse">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-16 rounded-xl bg-slate-100" />
          <div className="h-24 rounded-xl bg-slate-100" />
        </div>
      </Marco>
    );
  }

  const letra = letraDePiso([datos.codigo]);
  const inq = datos.inquilino;

  if (!inq) {
    return (
      <Marco>
        <div className="card p-6 text-center">
          <p className="eyebrow mb-1">Habitación {datos.codigo}</p>
          <p className="text-slate-600">Esta habitación no tiene un ocupante registrado.</p>
        </div>
      </Marco>
    );
  }

  // Ciclo de pago con la misma lógica del sistema
  const hab = {
    id: datos.habitacionId,
    codigo: datos.codigo,
    estado: 'occupied',
    montoAlquiler: datos.montoAlquiler,
    fechaIngreso: inq.fechaIngreso,
  } as unknown as HabitacionConDetalles;
  const pagos = datos.pagos.map((p, i) => ({ ...p, id: `p${i}`, habitacionId: datos.habitacionId })) as unknown as Pago[];
  const c = calcularCobro(hab, pagos, new Date(), 2, inq.modalidadPago);
  const deuda = c.atrasados.length * datos.montoAlquiler;
  const estado = c.atrasados.length ? 'debe' : c.nivel === 'ok' ? 'aldia' : 'pronto';
  const cubre = c.proximo ? periodoCubierto(c.proximo.mes, c.proximo.anio, c.diaPago, inq.modalidadPago) : null;
  const ultimos = [...datos.pagos]
    .sort((a, b) => b.anio * 12 + b.mes - (a.anio * 12 + a.mes))
    .slice(0, 4);

  const ESTADO = {
    aldia: { icon: CheckCircle2, titulo: 'Estás al día', caja: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700', chip: 'bg-emerald-600' },
    pronto: { icon: Clock, titulo: c.dias === 0 ? 'Tu pago vence hoy' : `Tu pago vence ${textoCuenta(c.dias)}`, caja: 'bg-amber-50 border-amber-200', color: 'text-amber-800', chip: 'bg-amber-500' },
    debe: {
      icon: AlertTriangle,
      titulo: `Tienes ${c.atrasados.length} ${c.atrasados.length === 1 ? 'mes pendiente' : 'meses pendientes'}`,
      caja: 'bg-red-50 border-red-200',
      color: 'text-red-700',
      chip: 'bg-red-600',
    },
  }[estado];

  return (
    <Marco>
      {/* Saludo */}
      <section className="card p-5">
        <p className="text-sm text-slate-500">Hola,</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 capitalize">{inq.nombre.toLowerCase()}</h1>
        <p className="text-sm text-slate-600 mt-1">
          Habitación <strong>{datos.codigo}</strong>
          {letra && <> · Piso {letra}</>}
        </p>
      </section>

      {/* Estado */}
      <section className={cn('rounded-xl border p-5', ESTADO.caja)}>
        <div className="flex items-center gap-3">
          <span className={cn('w-11 h-11 rounded-full flex items-center justify-center text-white', ESTADO.chip)}>
            <ESTADO.icon className="w-6 h-6" />
          </span>
          <div>
            <p className={cn('font-display text-lg font-bold leading-tight', ESTADO.color)}>{ESTADO.titulo}</p>
            {estado === 'debe' && (
              <p className="text-sm text-red-700">
                {c.atrasados.map((m) => getMonthName(m.mes)).join(', ')} · {formatCurrency(deuda)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Próximo pago */}
      {c.proximo && estado !== 'debe' && (
        <section className="card p-5">
          <p className="eyebrow flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> Próximo pago
          </p>
          <div className="flex items-end justify-between gap-3 mt-2">
            <div>
              <p className="font-display text-xl font-bold text-slate-900">{fechaLarga(c.proximo.vence)}</p>
              <p className="text-sm text-slate-500">{textoCuenta(c.dias)}</p>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(datos.montoAlquiler)}</p>
          </div>
          {cubre && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Cubre del <strong>{fechaCorta(cubre.desde)}</strong> al <strong>{fechaCorta(cubre.hasta)}</strong>
            </p>
          )}
        </section>
      )}

      {/* Últimos pagos */}
      <section className="card overflow-hidden">
        <p className="eyebrow flex items-center gap-1.5 px-5 pt-4 pb-2">
          <Receipt className="w-3.5 h-3.5" /> Últimos pagos
        </p>
        {ultimos.length ? (
          <ul className="divide-y divide-slate-100">
            {ultimos.map((p) => (
              <li key={`${p.anio}-${p.mes}-${p.fecha}`} className="flex items-center gap-3 px-5 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 capitalize">
                    {getMonthName(p.mes)} {p.anio}
                  </p>
                  <p className="text-xs text-slate-500">Pagado el {formatDate(p.fecha)}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(p.monto)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 pb-4 text-sm text-slate-500">Aún no hay pagos registrados.</p>
        )}
      </section>
    </Marco>
  );
}
