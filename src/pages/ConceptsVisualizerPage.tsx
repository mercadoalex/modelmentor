import { AppLayout } from '@/components/layouts/AppLayout';
import { InteractiveMLVisualizer } from '@/components/visualizer/InteractiveMLVisualizer';

export default function ConceptsVisualizerPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <InteractiveMLVisualizer />
      </div>
    </AppLayout>
  );
}