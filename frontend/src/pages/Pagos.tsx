import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Printer,
  FileDown,
  Zap,
  Send,
  UploadCloud,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wallet,
  ListChecks,
  Receipt,
  FileText,
} from 'lucide-react';
import { CobrarModal } from '@/components/forms';
import { Modal, LoadingPage, EmptyState, IconChip } from '@/components/ui';
import { Fab } from '@/components/ui/Fab';
import { VoucherPago, printVoucher, generateVoucherPDF, getVoucherFile, ResumenImprimible } from '@/components/voucher';
import { printThermalVoucher, isThermalPrinterAvailable, connectThermalPrinter, checkThermalPrinter } from '@/utils/thermalPrint';
import { compartirVoucherWhatsApp } from '@/utils/whatsapp';
import {
  usePagosByMes,
  useHabitacionesConEstadoPago,
  useInquilinos,
  useEdificiosByCiudad,
  useCobros,
  PAGOS_KEY,
} from '@/hooks';
import { driveApi } from '@/api';
import { useConfigStore, useNotifications } from '@/store';
import { cn } from '@/utils/cn';
import { archivoADataUrl } from '@/utils/imagen';
import { formatCurrency, formatDate, getMonthName } from '@/utils/formatters';
import { textoCuenta, type EstadoPlano } from '@/utils/cobro';
import { compararCodigos, letraDePiso } from '@/utils/plano';
import { CONCEPTOS_PAGO, METODOS_PAGO } from '@/utils/constants';
import type { HabitacionConDetalles, Pago } from '@/types';

type Vista = 'cobranza' | 'registrados';

const SECCIONES: { estado: EstadoPlano; titulo: string; icon: typeof Clock; color: string; chip: string }[] = [
  { estado: 'vencido', titulo: 'Vencidos', icon: AlertTriangle, color: 'text-red-700', chip: 'bg-red-50 border-red-200' },
  { estado: 'por-vencer', titulo: 'Por vencer', icon: Clock, color: 'text-amber-700', chip: 'bg-amber-50 border-amber-200' },
  { estado: 'al-dia', titulo: 'Al día', icon: CheckCircle2, color: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200' },
];

const labelConcepto = (c: string) => CONCEPTOS_PAGO.find((x) => x.value === c)?.label ?? c;
const labelMetodo = (m: string) => METODOS_PAGO.find((x) => x.value === m)?.label ?? m;

export function Pagos() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vista, setVista] = useState<Vista>('cobranza');
  const [searchTerm, setSearchTerm] = useState('');
  const [conceptoFilter, setConceptoFilter] = useState<string>('');
  const [alDiaAbierto, setAlDiaAbierto] = useState(false);
  const [resumenOpen, setResumenOpen] = useState(false);

  // Cobro: selector de cuarto → panel de pago
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [habCobro, setHabCobro] = useState<HabitacionConDetalles | null>(null);

  // Voucher
  const [voucherPago, setVoucherPago] = useState<Pago | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [thermalAvailable, setThermalAvailable] = useState(false);
  const [thermalPrinting, setThermalPrinting] = useState(false);
  const [thermalConnected, setThermalConnected] = useState(false);
  const [thermalConnecting, setThermalConnecting] = useState(false);
  const [sharingWhatsapp, setSharingWhatsapp] = useState(false);
  const [archivandoVoucher, setArchivandoVoucher] = useState(false);

  const { mesActual, anioActual, edificioSeleccionado, ciudadSeleccionada, setMesAnio } = useConfigStore();
  const { notify } = useNotifications();
  const cobros = useCobros();

  const { data: pagosMes, isLoading } = usePagosByMes(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: habitacionesTodas } = useHabitacionesConEstadoPago(mesActual, anioActual, edificioSeleccionado || undefined);
  const { data: edificiosCiudad } = useEdificiosByCiudad(ciudadSeleccionada || '');
  const { data: inquilinos } = useInquilinos();

  // Filtro global de ciudad (los endpoints solo filtran por edificio)
  const habitaciones = useMemo(
    () =>
      ciudadSeleccionada && !edificioSeleccionado && edificiosCiudad
        ? (habitacionesTodas ?? []).filter((h) => edificiosCiudad.some((e) => e.id === h.edificioId))
        : habitacionesTodas ?? [],
    [habitacionesTodas, ciudadSeleccionada, edificioSeleccionado, edificiosCiudad]
  );
  const idsAlcance = useMemo(() => new Set(habitaciones.map((h) => h.id)), [habitaciones]);
  const pagos = useMemo(
    () => (pagosMes ?? []).filter((p) => p.estado !== 'anulado' && (!habitacionesTodas || idsAlcance.has(p.habitacionId))),
    [pagosMes, habitacionesTodas, idsAlcance]
  );

  const habPorId = useMemo(() => new Map(habitaciones.map((h) => [h.id, h])), [habitaciones]);
  const ocupadas = habitaciones.filter((h) => h.estado === 'occupied');

  // Abrir el cobro directo si viene ?hab=<id>
  useEffect(() => {
    const habParam = searchParams.get('hab');
    if (habParam && habitacionesTodas?.length) {
      const h = habitacionesTodas.find((x) => x.id === habParam);
      if (h) {
        setHabCobro(h);
        setCobrarOpen(true);
      }
      navigate('/pagos', { replace: true });
    }
  }, [searchParams, habitacionesTodas, navigate]);

  // ---------------- Indicadores ----------------
  const cobradoMes = pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
  const alquilerCubierto = new Set(pagos.filter((p) => p.concepto === 'alquiler').map((p) => p.habitacionId));
  const esperadoMes = ocupadas.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0);
  const faltanMes = ocupadas.filter((h) => !alquilerCubierto.has(h.id));
  const faltaMonto = faltanMes.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0);
  const avance = esperadoMes > 0 ? Math.min(100, ((esperadoMes - faltaMonto) / esperadoMes) * 100) : 0;
  const vencidos = ocupadas.filter((h) => cobros.estado(h) === 'vencido');
  const deudaVencida = vencidos.reduce((s, h) => s + cobros.deuda(h), 0);
  const porVencer = ocupadas.filter((h) => cobros.estado(h) === 'por-vencer');

  // ---------------- Cobranza (hoy) ----------------
  const ubicacion = (h: HabitacionConDetalles) => {
    const letra = letraDePiso([h.codigo]);
    return [h.edificioNombre, letra ? `Piso ${letra}` : h.pisoNumero !== undefined ? `Piso ${h.pisoNumero}` : null]
      .filter(Boolean)
      .join(' · ');
  };
  const coincide = (h: HabitacionConDetalles) => {
    const q = searchTerm.trim().toLowerCase();
    return !q || h.codigo.toLowerCase().includes(q) || (h.nombreInquilino ?? '').toLowerCase().includes(q);
  };
  const porSeccion = (estado: EstadoPlano) =>
    ocupadas
      .filter((h) => cobros.estado(h) === estado && coincide(h))
      .sort((a, b) => {
        const da = cobros.cobro(a)?.dias ?? 0;
        const db = cobros.cobro(b)?.dias ?? 0;
        return da - db || compararCodigos(a.codigo, b.codigo);
      });

  // ---------------- Pagos registrados (mes) ----------------
  const pagosFiltrados = pagos
    .filter((p) => {
      const h = habPorId.get(p.habitacionId);
      const q = searchTerm.trim().toLowerCase();
      const coincideTexto =
        !q ||
        (h?.codigo ?? '').toLowerCase().includes(q) ||
        (h?.nombreInquilino ?? '').toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.observaciones ?? '').toLowerCase().includes(q);
      return coincideTexto && (!conceptoFilter || p.concepto === conceptoFilter);
    })
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

  // ---------------- Navegación de mes ----------------
  const navigateMonth = (delta: number) => {
    let m = mesActual + delta;
    let a = anioActual;
    if (m > 12) {
      m = 1;
      a++;
    } else if (m < 1) {
      m = 12;
      a--;
    }
    setMesAnio(m, a);
  };
  const hoy = new Date();
  const esMesActual = mesActual === hoy.getMonth() + 1 && anioActual === hoy.getFullYear();

  // ---------------- Cobro ----------------
  const abrirCobro = (h?: HabitacionConDetalles) => {
    setHabCobro(h ?? null);
    setCobrarOpen(true);
  };

  // ---------------- Voucher ----------------
  const getInquilinoForPago = (pago: Pago) => {
    if (pago.inquilinoId) {
      const exacto = inquilinos?.find((i) => i.id === pago.inquilinoId);
      if (exacto) return exacto;
    }
    return inquilinos?.find((i) => i.habitacionId === pago.habitacionId && i.estado === 'activo');
  };
  const getHabitacionForPago = (pago: Pago) => habitacionesTodas?.find((h) => h.id === pago.habitacionId);

  const verVoucher = (pago: Pago) => {
    setVoucherPago(pago);
    setIsVoucherModalOpen(true);
  };

  useEffect(() => {
    if (isVoucherModalOpen) {
      isThermalPrinterAvailable().then(setThermalAvailable);
      checkThermalPrinter()
        .then((s) => setThermalConnected(s.printer_connected))
        .catch(() => setThermalConnected(false));
    }
  }, [isVoucherModalOpen]);

  const handleThermalConnect = async () => {
    setThermalConnecting(true);
    try {
      await connectThermalPrinter();
      setThermalConnected(true);
      notify.success('Impresora termica conectada');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Error al conectar');
    } finally {
      setThermalConnecting(false);
    }
  };

  const handleThermalPrint = async () => {
    if (!voucherPago || thermalPrinting) return;
    setThermalPrinting(true);
    try {
      await printThermalVoucher({
        pago: voucherPago,
        inquilino: getInquilinoForPago(voucherPago),
        habitacion: getHabitacionForPago(voucherPago),
      });
      notify.success('Voucher impreso en impresora termica');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Error al imprimir');
    } finally {
      setThermalPrinting(false);
    }
  };

  // En celular comparte el PDF real; en escritorio lo descarga y abre el chat
  const handleGeneratePDF = async () => {
    if (!voucherPago || sharingWhatsapp) return;
    setSharingWhatsapp(true);
    try {
      const resultado = await compartirVoucherWhatsApp({
        pago: voucherPago,
        inquilino: getInquilinoForPago(voucherPago),
        habitacion: getHabitacionForPago(voucherPago),
      });
      if (resultado.via === 'compartido') notify.success('Voucher compartido');
      else if (resultado.via === 'descarga-y-chat') notify.success('Voucher descargado. Adjuntalo en el chat de WhatsApp');
      else if (resultado.via === 'solo-descarga') notify.error('El inquilino no tiene un telefono valido. Solo se descargo el voucher');
    } catch {
      notify.error('No se pudo generar el voucher');
    } finally {
      setSharingWhatsapp(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!voucherPago) return;
    generateVoucherPDF({
      pago: voucherPago,
      inquilino: getInquilinoForPago(voucherPago),
      habitacion: getHabitacionForPago(voucherPago),
    });
  };

  // Archiva el voucher en Drive, bajo Vouchers/<AAAA-MM> del edificio. Manual a propósito.
  const handleArchivarVoucher = async () => {
    if (!voucherPago || archivandoVoucher) return;
    setArchivandoVoucher(true);
    try {
      const inquilino = getInquilinoForPago(voucherPago);
      const { file } = getVoucherFile({ pago: voucherPago, inquilino, habitacion: getHabitacionForPago(voucherPago) });
      const archivoBase64 = await archivoADataUrl(file);
      const resultado = await driveApi.subir({ tipo: 'voucher', pagoId: voucherPago.id, inquilinoId: inquilino?.id, archivoBase64 });
      setVoucherPago({ ...voucherPago, voucherPdfUrl: resultado.url });
      queryClient.invalidateQueries({ queryKey: PAGOS_KEY });
      notify.success('Voucher archivado en Drive');
    } catch {
      notify.error('No se pudo archivar el voucher en Drive');
    } finally {
      setArchivandoVoucher(false);
    }
  };

  if (isLoading) return <LoadingPage />;

  const filaCobranza = (h: HabitacionConDetalles) => {
    const c = cobros.cobro(h);
    const estado = cobros.estado(h);
    const deuda = cobros.deuda(h);
    return (
      <li key={h.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-slate-50 transition-colors">
        <span
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-white flex-shrink-0',
            estado === 'vencido' ? 'bg-red-500' : estado === 'por-vencer' ? 'bg-amber-500' : 'bg-emerald-600'
          )}
        >
          {h.codigo}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{h.nombreInquilino || 'Sin inquilino registrado'}</p>
          <p className="text-xs text-slate-500 truncate">{ubicacion(h)}</p>
        </div>
        <div className="text-right min-w-[150px]">
          {estado === 'vencido' && c ? (
            <>
              <p className="font-display font-bold text-red-600 tabular-nums">{formatCurrency(deuda)}</p>
              <p className="text-[11px] text-red-600">
                {c.atrasados.length > 1
                  ? `${c.atrasados.length} meses atrasados`
                  : `${getMonthName(c.atrasados[0].mes)} · ${textoCuenta(c.dias)}`}
              </p>
            </>
          ) : c?.proximo ? (
            <>
              <p className={cn('font-display font-bold tabular-nums', estado === 'por-vencer' ? 'text-amber-700' : 'text-emerald-700')}>
                {c.proximo.vence.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatCurrency(Number(h.montoAlquiler || 0))} · {textoCuenta(c.dias)}
              </p>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => abrirCobro(h)}
          className={cn('btn btn-sm', estado === 'al-dia' ? 'btn-secondary' : 'btn-primary')}
        >
          <CreditCard className="w-3.5 h-3.5" /> {estado === 'al-dia' ? 'Adelantar' : 'Cobrar'}
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <IconChip icon={CreditCard} tone="leaf" size="sm" />
            <span className="eyebrow">Operación</span>
          </div>
          <h1 className="page-title">Pagos</h1>
          <p className="page-subtitle">Cobranza y pagos registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setResumenOpen(true)} className="btn btn-secondary whitespace-nowrap">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir resumen</span>
          </button>
          <button onClick={() => abrirCobro()} className="btn btn-primary whitespace-nowrap hidden md:inline-flex">
            <Plus className="w-4 h-4" />
            Registrar pago
          </button>
        </div>
      </div>

      {/* Mes + indicadores */}
      <div className="card p-4 md:p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Mes anterior">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-bold text-slate-900 min-w-[130px] text-center capitalize">
              {getMonthName(mesActual)} {anioActual}
            </span>
            <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Mes siguiente">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!esMesActual && (
            <button onClick={() => setMesAnio(hoy.getMonth() + 1, hoy.getFullYear())} className="link-arrow text-xs">
              Volver al mes actual
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5">
            <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Cobrado en {getMonthName(mesActual).toLowerCase()}
            </p>
            <p className="font-display text-2xl font-bold text-emerald-700 tabular-nums mt-1">{formatCurrency(cobradoMes)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${avance}%` }} />
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-1">
              {Math.round(avance)}% de {formatCurrency(esperadoMes)} esperado
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
            <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <ListChecks className="w-3.5 h-3.5" /> Falta cobrar del mes
            </p>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">{formatCurrency(faltaMonto)}</p>
            <p className="text-[11px] text-slate-500 mt-1">{faltanMes.length} cuartos sin pago de {getMonthName(mesActual).toLowerCase()}</p>
          </div>
          <button
            type="button"
            onClick={() => setVista('cobranza')}
            className="text-left rounded-xl bg-red-50 border border-red-200 p-3.5 hover:border-red-400 transition-colors"
          >
            <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Deuda vencida (hoy)
            </p>
            <p className="font-display text-2xl font-bold text-red-600 tabular-nums mt-1">{formatCurrency(deudaVencida)}</p>
            <p className="text-[11px] text-red-700/80 mt-1">{vencidos.length} cuartos con pagos atrasados</p>
          </button>
          <button
            type="button"
            onClick={() => setVista('cobranza')}
            className="text-left rounded-xl bg-amber-50 border border-amber-200 p-3.5 hover:border-amber-400 transition-colors"
          >
            <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Por vencer (5 días)
            </p>
            <p className="font-display text-2xl font-bold text-amber-700 tabular-nums mt-1">{porVencer.length}</p>
            <p className="text-[11px] text-amber-800/80 mt-1">
              {formatCurrency(porVencer.reduce((s, h) => s + Number(h.montoAlquiler || 0), 0))} por cobrar pronto
            </p>
          </button>
        </div>
      </div>

      {/* Vista + búsqueda */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="segmented" role="tablist" aria-label="Vista de pagos">
          <button role="tab" aria-selected={vista === 'cobranza'} data-active={vista === 'cobranza'} onClick={() => setVista('cobranza')} className="segmented-item">
            <ListChecks className="w-3.5 h-3.5" /> Cobranza
            {vencidos.length > 0 && <span className="px-1.5 rounded-full bg-red-600 text-white text-[10px]">{vencidos.length}</span>}
          </button>
          <button role="tab" aria-selected={vista === 'registrados'} data-active={vista === 'registrados'} onClick={() => setVista('registrados')} className="segmented-item">
            <Receipt className="w-3.5 h-3.5" /> Pagos de {getMonthName(mesActual).toLowerCase()}
            <span className="px-1.5 rounded-full bg-white/70 text-slate-600 text-[10px]">{pagos.length}</span>
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={vista === 'cobranza' ? 'Buscar cuarto o inquilino…' : 'Buscar cuarto, inquilino, N° de pago u observación…'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        {vista === 'registrados' && (
          <select value={conceptoFilter} onChange={(e) => setConceptoFilter(e.target.value)} className="select w-40" aria-label="Concepto">
            <option value="">Todos los conceptos</option>
            {CONCEPTOS_PAGO.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Cobranza */}
      {vista === 'cobranza' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Estado al día de hoy según el ciclo de cada inquilino (paga el día de su ingreso).
          </p>
          {SECCIONES.map((sec) => {
            const lista = porSeccion(sec.estado);
            const plegable = sec.estado === 'al-dia';
            const abierto = !plegable || alDiaAbierto || searchTerm.trim() !== '';
            if (!lista.length) return null;
            return (
              <section key={sec.estado} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => plegable && setAlDiaAbierto((v) => !v)}
                  className={cn('w-full flex items-center gap-2 px-4 py-3 border-b text-left', sec.chip, !plegable && 'cursor-default')}
                  aria-expanded={abierto}
                >
                  <sec.icon className={cn('w-4 h-4', sec.color)} />
                  <h2 className={cn('font-bold', sec.color)}>{sec.titulo}</h2>
                  <span className={cn('text-sm font-semibold', sec.color)}>· {lista.length}</span>
                  {sec.estado === 'vencido' && (
                    <span className="ml-auto font-display font-bold text-red-600 tabular-nums">
                      {formatCurrency(lista.reduce((s, h) => s + cobros.deuda(h), 0))}
                    </span>
                  )}
                  {plegable && (
                    <ChevronDown className={cn('w-4 h-4 ml-auto text-emerald-700 transition-transform', !abierto && '-rotate-90')} />
                  )}
                </button>
                {abierto && <ul className="divide-y divide-slate-100">{lista.map(filaCobranza)}</ul>}
              </section>
            );
          })}
          {ocupadas.length === 0 && (
            <EmptyState icon={ListChecks} title="No hay cuartos ocupados" description="Cuando registres inquilinos, aquí verás a quién cobrar." />
          )}
        </div>
      )}

      {/* Pagos registrados del mes */}
      {vista === 'registrados' &&
        (pagosFiltrados.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={pagos.length ? 'Ningún pago coincide con la búsqueda' : `Aún no hay pagos de ${getMonthName(mesActual).toLowerCase()}`}
            action={
              <button onClick={() => abrirCobro()} className="btn btn-primary">
                <Plus className="w-4 h-4" /> Registrar pago
              </button>
            }
          />
        ) : (
          <div className="card overflow-hidden overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>N° pago</th>
                  <th>Fecha</th>
                  <th>Cuarto</th>
                  <th className="hidden md:table-cell">Inquilino</th>
                  <th>Concepto</th>
                  <th className="hidden sm:table-cell">Cubre</th>
                  <th className="text-right">Monto</th>
                  <th className="hidden md:table-cell">Método</th>
                  <th className="hidden lg:table-cell">Observaciones</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((p) => {
                  const h = habPorId.get(p.habitacionId);
                  const inq = getInquilinoForPago(p);
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-slate-600">{p.id}</td>
                      <td className="tabular-nums">{formatDate(p.fecha)}</td>
                      <td className="font-semibold text-slate-900">{h?.codigo ?? p.habitacionId}</td>
                      <td className="hidden md:table-cell truncate max-w-[180px]">{inq ? `${inq.nombre} ${inq.apellido}` : '—'}</td>
                      <td>{labelConcepto(p.concepto)}</td>
                      <td className="hidden sm:table-cell capitalize text-slate-600">
                        {getMonthName(Number(p.mes))} {p.anio}
                      </td>
                      <td className="text-right font-semibold tabular-nums">{formatCurrency(Number(p.monto))}</td>
                      <td className="hidden md:table-cell">{labelMetodo(p.metodoPago)}</td>
                      <td className="hidden lg:table-cell text-slate-500 truncate max-w-[200px]" title={p.observaciones}>
                        {p.observaciones || '—'}
                      </td>
                      <td>
                        <button onClick={() => verVoucher(p)} className="p-2 hover:bg-slate-100 rounded-full" title="Ver voucher" aria-label={`Voucher ${p.id}`}>
                          <Printer className="w-4 h-4 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={6} className="font-semibold text-slate-600">
                    {pagosFiltrados.length} pagos
                  </td>
                  <td className="text-right font-display font-bold text-slate-900 tabular-nums">
                    {formatCurrency(pagosFiltrados.reduce((s, p) => s + Number(p.monto || 0), 0))}
                  </td>
                  <td colSpan={3} className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

      {/* FAB móvil */}
      <Fab onClick={() => abrirCobro()} label="Registrar pago" />

      {/* Cobro: elegir cuarto → registrar */}
      <CobrarModal
        isOpen={cobrarOpen}
        onClose={() => setCobrarOpen(false)}
        habitaciones={ocupadas}
        habitacionInicial={habCobro}
        onVerVoucher={verVoucher}
      />

      {/* Resumen imprimible (respaldo físico) */}
      <Modal isOpen={resumenOpen} onClose={() => setResumenOpen(false)} title="Resumen de pagos para imprimir" size="2xl">
        {resumenOpen && (
          <ResumenImprimible
            habitaciones={habitacionesTodas ?? []}
            mesFin={mesActual}
            anioFin={anioActual}
            edificioInicial={edificioSeleccionado}
          />
        )}
      </Modal>

      {/* Voucher */}
      <Modal isOpen={isVoucherModalOpen} onClose={() => setIsVoucherModalOpen(false)} title="Voucher de pago" size="sm">
        <div className="space-y-4">
          {voucherPago && (
            <div id="voucher-pago">
              <VoucherPago
                pago={voucherPago}
                inquilino={getInquilinoForPago(voucherPago)}
                habitacion={getHabitacionForPago(voucherPago)}
              />
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-slate-200">
            {thermalAvailable && !thermalConnected && (
              <button onClick={handleThermalConnect} disabled={thermalConnecting} className="btn btn-secondary btn-sm">
                <Zap className="w-4 h-4" />
                {thermalConnecting ? 'Conectando…' : 'Conectar impresora'}
              </button>
            )}
            {thermalAvailable && thermalConnected && (
              <button onClick={handleThermalPrint} disabled={thermalPrinting} className="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white">
                <Zap className="w-4 h-4" />
                {thermalPrinting ? 'Imprimiendo…' : 'Imp. térmica'}
              </button>
            )}
            <button onClick={() => printVoucher('voucher-pago')} className="btn btn-secondary btn-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button onClick={handleDownloadPDF} className="btn btn-secondary btn-sm" title="Solo descargar el PDF">
              <FileDown className="w-4 h-4" /> Descargar
            </button>
            {voucherPago?.voucherPdfUrl ? (
              <a href={voucherPago.voucherPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm text-emerald-700">
                <ExternalLink className="w-4 h-4" /> En Drive
              </a>
            ) : (
              <button onClick={handleArchivarVoucher} disabled={archivandoVoucher} className="btn btn-secondary btn-sm">
                <UploadCloud className="w-4 h-4" />
                {archivandoVoucher ? 'Guardando…' : 'Guardar en Drive'}
              </button>
            )}
            <button onClick={handleGeneratePDF} disabled={sharingWhatsapp} className="btn btn-primary btn-sm">
              <Send className="w-4 h-4" />
              {sharingWhatsapp ? 'Generando…' : 'Enviar por WhatsApp'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
