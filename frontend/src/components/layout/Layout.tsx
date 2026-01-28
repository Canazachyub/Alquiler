import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Notifications } from '../ui/Notifications';
import { useConfigStore } from '@/store';
import { cn } from '@/utils/cn';

export function Layout() {
  const { sidebarCollapsed } = useConfigStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <Notifications />
    </div>
  );
}
