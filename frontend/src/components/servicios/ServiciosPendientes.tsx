import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Droplets, AlertTriangle, Receipt, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { estadoServicios, brechaServicios, type EstadoServicio } from '@/utils/estadoServicios';
import type { HabitacionConDetalles } from '@/types';

const DIA = 86_400_000;
const fechaLarga = (d: Date) => d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Colores según cuánto falta: rojo ≤ 3 días o vencido, ámbar ≤ 7, verde después */
function urgencia(msRestantes: number) {
  const dias = msRestantes / DIA;
  if (dias < 0) return { anillo: '#DC2626', texto: 'text-red-700', caja: 'border-red-300 bg-red-50', chip: 'bg-red-600 text-white' };
  if (dias <= 3) return { anillo: '#DC2626', texto: 'text-red-700', caja: 'border-red-200 bg-red-50/60', chip: 'bg-red-100 text-red-800' };
  if (dias <= 7) return { anillo: '#E08B35', texto: 'text-ochre-700', caja: 'border-amber-200 bg-amber-50/50', chip: 'bg-amber-100 text-amber-800' };
  return { anillo: '#10B981', texto: 'text-emerald-700', caja: 'border-slate-200 bg-white', chip: 'bg-emerald-100 text-emerald-800' };
}

/** Anillo de progreso: se va llenando desde la emisión del recibo hasta su vencimiento */
function Anillo({ progreso, color, children }: { progreso: number; color: string; children: React.ReactNode }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E7E3DF" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progreso)))}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">{children}</div>
    </div>
  );
}

function CopiarCodigo({ etiqueta, codigo }: { etiqueta: string; codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* sin portapapeles */
    }
  };
  return (
    <button
      onClick={copiar}
      title="Copiar"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:border-slate-300"
    >
      {etiqueta}: <span className="font-mono font-semibold text-slate-900">{codigo}</span>
      {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
    </button>
  );
}

function TarjetaServicio({ s, ahora }: { s: EstadoServicio; ahora: number }) {
  // Cuenta hasta el final del día de vencimiento
  const fin = s.vence.getTime() + DIA - 1;
  const ms = fin - ahora;
  const u = urgencia(ms);
  const pagado = s.porPagar <= 0;
  const total = Math.max(DIA, fin - s.emision.getTime());
  const progreso = (ahora - s.emision.getTime()) / total;

  const abs = Math.abs(ms);
  const d = Math.floor(abs / DIA);
  const h = Math.floor((abs % DIA) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const Icon = s.clave === 'luz' ? Zap : Droplets;

  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col gap-3', pagado ? 'border-slate-200 bg-white' : u.caja)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            s.clave === 'luz' ? 'bg-ochre-100 text-ochre-700' : 'bg-sky-100 text-sky-700'
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 leading-tight">{s.nombre}</p>
          <p className="text-xs text-slate-500 truncate">
            {s.empresa} · recibo {s.recibo}
          </p>
        </div>
      </div>

      {pagado ? (
        <p className="font-semibold text-emerald-700">Pagado · próximo recibo ~{ddmm(s.proximoRecibo)}</p>
      ) : (
        <div className="flex items-center gap-4">
          <Anillo progreso={ms < 0 ? 1 : progreso} color={u.anillo}>
            <span className={cn('font-display text-3xl font-bold tabular-nums', u.texto)}>{ms < 0 ? `+${d}` : d}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">
              {ms < 0 ? 'días tarde' : d === 1 ? 'día' : 'días'}
            </span>
          </Anillo>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(s.porPagar)}</p>
            <p className="text-sm text-slate-600">
              Vence el <strong>{fechaLarga(s.vence)}</strong>
            </p>
            <p className={cn('mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums', u.chip)}>
              {ms < 0 ? 'Venció hace ' : 'Faltan '}
              {d} d {String(h).padStart(2, '0')} h {String(m).padStart(2, '0')} min
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              {s.meses.length} {s.meses.length === 1 ? 'mes' : 'meses'} ({s.meses.join(' + ')}) · promedio {formatCurrency(s.promedio)}/mes
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/70">
        <CopiarCodigo etiqueta={s.etiquetaCodigo} codigo={s.codigo} />
        <a
          href={s.consultaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Consultar recibo <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/** Tarjeta del Dashboard: recibos de luz y agua por pagar con cuenta regresiva y avisos clave. */
export function ServiciosPendientes({ habitaciones }: { habitaciones: HabitacionConDetalles[] }) {
  const navigate = useNavigate();
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const e = estadoServicios(new Date(ahora));
  const brechas = brechaServicios(habitaciones).filter((b) => b.diferencia < 0);
  // El más urgente primero
  const servicios = [...e.servicios].sort((a, b) => a.vence.getTime() - b.vence.getTime());

  return (
    <section className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <Receipt className="w-4 h-4 text-slate-500" />
          Servicios por pagar · Casa Progreso
        </h2>
        <div className="flex items-center gap-3">
          {e.totalPorPagar > 0 && (
            <span className="text-sm text-slate-600">
              Total <strong className="tabular-nums text-slate-900">{formatCurrency(e.totalPorPagar)}</strong>
            </span>
          )}
          <button onClick={() => navigate('/reportes')} className="link-arrow text-sm">
            Ver análisis
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {servicios.map((s) => (
          <TarjetaServicio key={s.clave} s={s} ahora={ahora} />
        ))}
      </div>

      {(e.multasAgua > 0 || brechas.length > 0) && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {e.multasAgua > 0 && (
            <li className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Pagar el agua tarde ya costó <strong>{formatCurrency(e.multasAgua)}</strong> en {e.cortesAgua} cortes y reaperturas. Pagar cada mes antes del vencimiento lo evita.
              </span>
            </li>
          )}
          {brechas.map((b) => (
            <li key={b.clave} className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                El {b.pct}% de {b.nombre.toLowerCase()} no cubre el recibo: faltan <strong>{formatCurrency(-b.diferencia)}</strong> al mes (sugerido {b.sugerido}%).
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
