import { AppLayout } from '@/components/layouts/AppLayout';
import { KaggleDatasetSearch } from '@/components/KaggleDatasetSearch';

export default function KaggleDatasetsPage() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Kaggle Datasets</h1>
          <p className="text-muted-foreground">
            Discover and explore datasets from Kaggle's extensive collection
          </p>
        </div>

        <KaggleDatasetSearch />
      </div>
    </AppLayout>
  );
}
