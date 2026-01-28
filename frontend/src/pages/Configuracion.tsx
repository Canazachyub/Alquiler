import { useState } from 'react';
import { Building2, DollarSign, Bell, Database, Save } from 'lucide-react';
import { useNotifications } from '@/store';

interface ConfiguracionData {
  negocio: {
    nombre: string;
    direccion: string;
    telefono: string;
    ruc: string;
    email: string;
  };
  pagos: {
    diaPago: number;
    diasGracia: number;
    montoMora: number;
    porcentajeMora: number;
  };
  notificaciones: {
    recordatorioPago: boolean;
    diasAnticipacion: number;
    notificarMora: boolean;
  };
}

const defaultConfig: ConfiguracionData = {
  negocio: {
    nombre: 'Sistema de Alquiler',
    direccion: 'Puno - Peru',
    telefono: '',
    ruc: '',
    email: '',
  },
  pagos: {
    diaPago: 1,
    diasGracia: 5,
    montoMora: 10,
    porcentajeMora: 5,
  },
  notificaciones: {
    recordatorioPago: true,
    diasAnticipacion: 3,
    notificarMora: true,
  },
};

export function Configuracion() {
  const [config, setConfig] = useState<ConfiguracionData>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'negocio' | 'pagos' | 'notificaciones'>('negocio');
  const [isSaving, setIsSaving] = useState(false);
  const { notify } = useNotifications();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Aqui se guardaria en el backend
      // Por ahora solo simulamos
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.setItem('app_config', JSON.stringify(config));
      notify.success('Configuracion guardada correctamente');
    } catch (error) {
      notify.error('Error al guardar la configuracion');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = <K extends keyof ConfiguracionData>(
    section: K,
    field: keyof ConfiguracionData[K],
    value: string | number | boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const tabs = [
    { id: 'negocio' as const, label: 'Negocio', icon: Building2 },
    { id: 'pagos' as const, label: 'Pagos', icon: DollarSign },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
          <p className="text-gray-500">Personaliza el sistema segun tus necesidades</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab Negocio */}
          {activeTab === 'negocio' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Informacion del Negocio</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Nombre del Negocio</label>
                  <input
                    type="text"
                    value={config.negocio.nombre}
                    onChange={(e) => updateConfig('negocio', 'nombre', e.target.value)}
                    className="input"
                    placeholder="Ej: Alquileres Puno"
                  />
                </div>

                <div>
                  <label className="label">RUC</label>
                  <input
                    type="text"
                    value={config.negocio.ruc}
                    onChange={(e) => updateConfig('negocio', 'ruc', e.target.value)}
                    className="input"
                    placeholder="Ej: 20123456789"
                  />
                </div>

                <div>
                  <label className="label">Direccion</label>
                  <input
                    type="text"
                    value={config.negocio.direccion}
                    onChange={(e) => updateConfig('negocio', 'direccion', e.target.value)}
                    className="input"
                    placeholder="Ej: Jr. Lima 123, Puno"
                  />
                </div>

                <div>
                  <label className="label">Telefono</label>
                  <input
                    type="text"
                    value={config.negocio.telefono}
                    onChange={(e) => updateConfig('negocio', 'telefono', e.target.value)}
                    className="input"
                    placeholder="Ej: 951 123 456"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={config.negocio.email}
                    onChange={(e) => updateConfig('negocio', 'email', e.target.value)}
                    className="input"
                    placeholder="Ej: contacto@alquileres.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Pagos */}
          {activeTab === 'pagos' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Configuracion de Pagos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Dia de Pago (del mes)</label>
                  <input
                    type="number"
                    value={config.pagos.diaPago}
                    onChange={(e) => updateConfig('pagos', 'diaPago', Number(e.target.value))}
                    className="input"
                    min={1}
                    max={28}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dia del mes en que vence el pago
                  </p>
                </div>

                <div>
                  <label className="label">Dias de Gracia</label>
                  <input
                    type="number"
                    value={config.pagos.diasGracia}
                    onChange={(e) => updateConfig('pagos', 'diasGracia', Number(e.target.value))}
                    className="input"
                    min={0}
                    max={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dias adicionales antes de aplicar mora
                  </p>
                </div>

                <div>
                  <label className="label">Monto de Mora (S/.)</label>
                  <input
                    type="number"
                    value={config.pagos.montoMora}
                    onChange={(e) => updateConfig('pagos', 'montoMora', Number(e.target.value))}
                    className="input"
                    min={0}
                    step={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">Monto fijo de mora</p>
                </div>

                <div>
                  <label className="label">Porcentaje de Mora (%)</label>
                  <input
                    type="number"
                    value={config.pagos.porcentajeMora}
                    onChange={(e) => updateConfig('pagos', 'porcentajeMora', Number(e.target.value))}
                    className="input"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Porcentaje adicional sobre el monto
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Notificaciones</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Recordatorio de Pago</p>
                    <p className="text-sm text-gray-500">
                      Enviar recordatorio antes de la fecha de vencimiento
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notificaciones.recordatorioPago}
                      onChange={(e) =>
                        updateConfig('notificaciones', 'recordatorioPago', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {config.notificaciones.recordatorioPago && (
                  <div className="ml-4">
                    <label className="label">Dias de Anticipacion</label>
                    <input
                      type="number"
                      value={config.notificaciones.diasAnticipacion}
                      onChange={(e) =>
                        updateConfig('notificaciones', 'diasAnticipacion', Number(e.target.value))
                      }
                      className="input w-32"
                      min={1}
                      max={10}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notificar Mora</p>
                    <p className="text-sm text-gray-500">
                      Enviar notificacion cuando se aplique mora
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notificaciones.notificarMora}
                      onChange={(e) =>
                        updateConfig('notificaciones', 'notificarMora', e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info adicional */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Informacion del Sistema</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="font-medium">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Backend</p>
            <p className="font-medium">Google Apps Script</p>
          </div>
          <div>
            <p className="text-gray-500">Base de Datos</p>
            <p className="font-medium">Google Sheets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
