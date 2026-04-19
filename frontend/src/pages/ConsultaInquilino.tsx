import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Home, Calendar, CreditCard, User, Plus } from 'lucide-react';
import { habitacionesApi } from '@/api';
import { pagosApi } from '@/api';
import { inquilinosApi } from '@/api';
import { formatCurrency, getMonthName } from '@/utils/formatters';

interface EstadoPago {
  inquilino: {
    nombre: string;
    apellido: string;
    telefono: string;
    fechaIngreso: string;
  } | null;
  habitacion: {
    id: string;
    codigo: string;
    montoAlquiler: number;
    montoInternet: number;
  } | null;
  pagos: {
    alquilerPagado: boolean;
    internetPagado: boolean;
    fechaPagoAlquiler?: string;
    fechaPagoInternet?: string;
  };
  mesActual: number;
  anioActual: number;
}

export function ConsultaInquilino() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPago | null>(null);

  const inquilinoId = searchParams.get('id');
  const habitacionId = searchParams.get('hab');

  useEffect(() => {
    const fetchEstado = async () => {
      if (!inquilinoId && !habitacionId) {
        setError('Codigo de consulta invalido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const now = new Date();
        const mes = now.getMonth() + 1;
        const anio = now.getFullYear();

        // Obtener estado de habitaciones con pago
        const habitacionesEstado = await habitacionesApi.getConEstadoPago(mes, anio);

        // Buscar la habitacion/inquilino
        let habitacionEncontrada = null;

        if (habitacionId) {
          habitacionEncontrada = habitacionesEstado.find((h: any) => h.id === habitacionId);
        } else if (inquilinoId) {
          // Buscar por inquilino
          const inquilinos = await inquilinosApi.getAll();
          const inquilino = inquilinos.find((i: any) => i.id === inquilinoId);
          if (inquilino) {
            habitacionEncontrada = habitacionesEstado.find((h: any) => h.id === inquilino.habitacionId);
          }
        }

        if (!habitacionEncontrada) {
          setError('No se encontro informacion para este codigo');
          setLoading(false);
          return;
        }

        // Obtener pagos del mes actual para esta habitacion
        const pagos = await pagosApi.getByMes(mes, anio);
        const pagosHabitacion = pagos.filter((p: any) => p.habitacionId === habitacionEncontrada.id);

        const alquilerPago = pagosHabitacion.find((p: any) => p.concepto === 'alquiler' && p.estado === 'pagado');
        const internetPago = pagosHabitacion.find((p: any) => p.concepto === 'internet' && p.estado === 'pagado');

        setEstado({
          inquilino: habitacionEncontrada.nombreInquilino ? {
            nombre: habitacionEncontrada.nombreInquilino.split(' ')[0] || '',
            apellido: habitacionEncontrada.nombreInquilino.split(' ').slice(1).join(' ') || '',
            telefono: habitacionEncontrada.telefonoInquilino || '',
            fechaIngreso: habitacionEncontrada.fechaIngreso || '',
          } : null,
          habitacion: {
            id: habitacionEncontrada.id,
            codigo: habitacionEncontrada.codigo,
            montoAlquiler: habitacionEncontrada.montoAlquiler,
            montoInternet: habitacionEncontrada.montoInternet,
          },
          pagos: {
            alquilerPagado: !!alquilerPago,
            internetPagado: !!internetPago,
            fechaPagoAlquiler: alquilerPago?.fecha,
            fechaPagoInternet: internetPago?.fecha,
          },
          mesActual: mes,
          anioActual: anio,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching estado:', err);
        setError('Error al consultar el estado. Intente nuevamente.');
        setLoading(false);
      }
    };

    fetchEstado();
  }, [inquilinoId, habitacionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Consultando estado de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error de Consulta</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!estado) {
    return null;
  }

  const todoAlDia = estado.pagos.alquilerPagado && estado.pagos.internetPagado;
  const algunPendiente = !estado.pagos.alquilerPagado || !estado.pagos.internetPagado;

  return (
    <div className={`min-h-screen ${todoAlDia ? 'bg-gradient-to-br from-emerald-50 to-emerald-100' : 'bg-gradient-to-br from-amber-50 to-amber-100'} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${todoAlDia ? 'bg-emerald-100' : 'bg-amber-100'} flex items-center justify-center`}>
            {todoAlDia ? (
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-amber-600" />
            )}
          </div>
          <h1 className={`text-2xl font-bold ${todoAlDia ? 'text-emerald-700' : 'text-amber-700'}`}>
            {todoAlDia ? 'Al Día' : 'Pagos Pendientes'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Estado de pago · {getMonthName(estado.mesActual)} {estado.anioActual}
          </p>
        </div>

        {/* Info Inquilino */}
        {estado.inquilino && (
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-900">
                {estado.inquilino.nombre} {estado.inquilino.apellido}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Home className="w-4 h-4 text-slate-400" />
              <span>Habitación {estado.habitacion?.codigo}</span>
            </div>
          </div>
        )}

        {/* Estado de Pagos */}
        <div className="space-y-3 mb-6">
          {/* Alquiler */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${estado.pagos.alquilerPagado ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <CreditCard className={`w-5 h-5 ${estado.pagos.alquilerPagado ? 'text-emerald-600' : 'text-red-600'}`} />
              <div>
                <p className="font-medium text-slate-900">Alquiler</p>
                <p className="text-sm text-slate-500 tabular-nums">{formatCurrency(estado.habitacion?.montoAlquiler || 0)}</p>
              </div>
            </div>
            {estado.pagos.alquilerPagado ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Pagado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="text-red-600 font-semibold">Pendiente</span>
              </div>
            )}
          </div>

          {/* Internet */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${estado.pagos.internetPagado ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${estado.pagos.internetPagado ? 'text-emerald-600' : 'text-red-600'}`} />
              <div>
                <p className="font-medium text-slate-900">Internet</p>
                <p className="text-sm text-slate-500 tabular-nums">{formatCurrency(estado.habitacion?.montoInternet || 0)}</p>
              </div>
            </div>
            {estado.pagos.internetPagado ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Pagado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="text-red-600 font-semibold">Pendiente</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Pendiente */}
        {algunPendiente && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-amber-700 font-medium">Total Pendiente:</p>
            <p className="text-2xl font-bold text-amber-800 tabular-nums">
              {formatCurrency(
                (!estado.pagos.alquilerPagado ? (estado.habitacion?.montoAlquiler || 0) : 0) +
                (!estado.pagos.internetPagado ? (estado.habitacion?.montoInternet || 0) : 0)
              )}
            </p>
          </div>
        )}

        {/* Botón Agregar Pago */}
        {algunPendiente && estado.habitacion?.id && (
          <Link
            to={`/pagos?hab=${estado.habitacion.id}`}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-4"
          >
            <Plus className="w-5 h-5" />
            Agregar Pago
          </Link>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
          <p>Sistema de Alquiler · Puno/Juli</p>
          <p>Consulta realizada el {new Date().toLocaleDateString('es-PE')}</p>
        </div>
      </div>
    </div>
  );
}

export default ConsultaInquilino;
