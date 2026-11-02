import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Home, CreditCard, Receipt, Menu, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useConfigStore } from '@/store';

const items: { path: string; icon: LucideIcon; label: string }[] = [
  { path: '/', icon: LayoutDashboard, label: 'Inicio' },
  { path: '/habitaciones', icon: Home, label: 'Cuartos' },
  { path: '/pagos', icon: CreditCard, label: 'Pagos' },
  { path: '/gastos', icon: Receipt, label: 'Gastos' },
];

/** Barra inferior para celular: las secciones de todos los días a un toque, sin abrir el menú */
export function MobileNav() {
  const setSidebarMobileOpen = useConfigStore((s) => s.setSidebarMobileOpen);
  const base =
    'flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[11px] font-semibold touch-manipulation select-none transition-colors';
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      <div className="flex h-16">
        {items.map((it) => (
          <NavLink
            key={it.path}
            to={it.path}
            end={it.path === '/'}
            className={({ isActive }) => cn(base, isActive ? 'text-primary-600' : 'text-slate-500 active:text-slate-800')}
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex items-center justify-center w-12 h-7 rounded-full transition-colors',
                    isActive ? 'bg-primary-50' : ''
                  )}
                >
                  <it.icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {it.label}
              </>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={() => setSidebarMobileOpen(true)} className={cn(base, 'text-slate-500 active:text-slate-800')}>
          <span className="flex items-center justify-center w-12 h-7 rounded-full">
            <Menu className="w-5 h-5" />
          </span>
          Más
        </button>
      </div>
    </nav>
  );
}
