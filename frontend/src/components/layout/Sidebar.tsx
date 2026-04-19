import { Fragment } from 'react';
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
  ChevronUp,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useConfigStore } from '@/store';

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Operación',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/habitaciones', icon: Home, label: 'Habitaciones' },
      { path: '/inquilinos', icon: Users, label: 'Inquilinos' },
      { path: '/pagos', icon: CreditCard, label: 'Pagos' },
      { path: '/gastos', icon: Receipt, label: 'Gastos' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { path: '/ciudades', icon: MapPin, label: 'Ciudades' },
      { path: '/edificios', icon: Building2, label: 'Edificios' },
      { path: '/pisos', icon: Layers, label: 'Pisos' },
      { path: '/reportes', icon: FileText, label: 'Reportes' },
      { path: '/configuracion', icon: Settings, label: 'Config.' },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useConfigStore();

  const closeMobile = () => setSidebarMobileOpen(false);
  const isCollapsed = sidebarCollapsed && !sidebarMobileOpen;

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
          'fixed left-0 top-0 h-screen bg-slate-950 text-white transition-all duration-300 z-50 flex flex-col',
          'border-r border-white/5',
          'hidden md:flex',
          sidebarCollapsed ? 'md:w-[72px]' : 'md:w-64',
          sidebarMobileOpen && '!flex w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          {(!sidebarCollapsed || sidebarMobileOpen) && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(99,102,241,0.5)]">
                <Home className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-sm tracking-tight">Alquileres</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Puno / Juli</span>
              </div>
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
        <nav className="flex-1 p-3 overflow-y-auto">
          {menuGroups.map((group, groupIdx) => (
            <Fragment key={group.label}>
              {isCollapsed ? (
                groupIdx === 0 ? null : (
                  <div className="h-px bg-slate-800 mx-2 my-3" aria-hidden />
                )
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 mb-2',
                    groupIdx === 0 ? 'mt-1' : 'mt-4'
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium',
                        isActive
                          ? 'bg-white/5 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5',
                        isCollapsed && 'justify-center px-2'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r-full bg-primary-500 transition-opacity',
                            isActive ? 'opacity-100' : 'opacity-0'
                          )}
                          aria-hidden
                        />
                        <item.icon
                          className={cn(
                            'w-5 h-5 flex-shrink-0 transition-colors',
                            isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
                          )}
                          strokeWidth={isActive ? 2.25 : 2}
                        />
                        {(!sidebarCollapsed || sidebarMobileOpen) && <span>{item.label}</span>}
                        {isCollapsed && (
                          <span
                            className="absolute left-full ml-3 px-2 py-1 rounded-md bg-slate-900 text-slate-100 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-popover z-50"
                          >
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300">
                AC
              </div>
            </div>
          ) : (
            <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300 flex-shrink-0">
                AC
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">Administrador</p>
                <p className="text-[11px] text-slate-500 truncate">admin@alquileres.pe</p>
              </div>
              <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
