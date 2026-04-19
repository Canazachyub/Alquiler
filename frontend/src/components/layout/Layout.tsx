import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Notifications } from '../ui/Notifications';
import { useConfigStore } from '@/store';
import { cn } from '@/utils/cn';

export function Layout() {
  const { sidebarCollapsed } = useConfigStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          'ml-0',
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'
        )}
      >
        <Header />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
      <Notifications />
    </div>
  );
}
