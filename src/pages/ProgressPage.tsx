import { AppLayout } from '@/components/layouts/AppLayout';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';

export default function ProgressPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <ProgressDashboard />
      </div>
    </AppLayout>
  );
}