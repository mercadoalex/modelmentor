import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout component
 * - Wraps all pages with a header and main content area
 * - Displays the NotificationBell in the header if user is logged in
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with NotificationBell */}
      <Header>
        {/* Show notification bell if user is logged in */}
        {user && <NotificationBell userId={user.id} />}
      </Header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}