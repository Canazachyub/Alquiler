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
  X,
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
  { path: '/configuracion', icon: Settings, label: 'Config.' },
];

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useConfigStore();

  const closeMobile = () => setSidebarMobileOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-50 flex flex-col',
          'hidden md:flex',
          sidebarCollapsed ? 'md:w-[72px]' : 'md:w-64',
          sidebarMobileOpen && '!flex w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {(!sidebarCollapsed || sidebarMobileOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight">Alquileres</span>
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                closeMobile();
              } else {
                toggleSidebar();
              }
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarMobileOpen && window.innerWidth < 768 ? (
              <X className="w-5 h-5" />
            ) : sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium',
                  'hover:bg-white/10',
                  isActive
                    ? 'bg-primary-600/90 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white',
                  sidebarCollapsed && !sidebarMobileOpen && 'justify-center px-2'
                )
              }
              title={sidebarCollapsed && !sidebarMobileOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!sidebarCollapsed || sidebarMobileOpen) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {(!sidebarCollapsed || sidebarMobileOpen) && (
          <div className="p-4 border-t border-white/10">
            <p className="text-[11px] text-gray-500 text-center tracking-wider uppercase">
              v2.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
