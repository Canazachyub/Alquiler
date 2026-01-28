import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Settings,
  MapPin,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useConfigStore } from '@/store';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ciudades', icon: MapPin, label: 'Ciudades' },
  { path: '/edificios', icon: Building2, label: 'Edificios' },
  { path: '/pisos', icon: Layers, label: 'Pisos' },
  { path: '/habitaciones', icon: Home, label: 'Habitaciones' },
  { path: '/inquilinos', icon: Users, label: 'Inquilinos' },
  { path: '/pagos', icon: CreditCard, label: 'Pagos' },
  { path: '/gastos', icon: Receipt, label: 'Gastos' },
  { path: '/reportes', icon: FileText, label: 'Reportes' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useConfigStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-primary-400" />
            <span className="font-bold text-lg">Alquileres</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-slate-800',
                isActive ? 'bg-primary-600 text-white' : 'text-slate-300',
                sidebarCollapsed && 'justify-center'
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-slate-500 text-center">
            Sistema de Alquileres v2.0
          </div>
        </div>
      )}
    </aside>
  );
}
