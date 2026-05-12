import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout component
 * - Wraps all pages with a header and main content area
 * - Header component internally handles NotificationBell for authenticated users
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header (includes NotificationBell internally for authenticated users) */}
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}