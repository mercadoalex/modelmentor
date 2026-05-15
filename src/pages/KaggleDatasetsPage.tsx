import { AppLayout } from '@/components/layouts/AppLayout';
import { FeatureGate } from '@/components/common/FeatureGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Search, Download, ExternalLink } from 'lucide-react';

/**
 * KaggleDatasetsPage
 * - Pro-tier feature for searching and importing Kaggle datasets.
 * - Gated behind subscription — free users see upgrade prompt.
 */
export default function KaggleDatasetsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kaggle Datasets</h1>
            <p className="text-muted-foreground">
              Search and import real-world datasets from Kaggle directly into your projects.
            </p>
          </div>
          <Badge className="ml-auto">Pro</Badge>
        </div>

        <FeatureGate featureName="kaggle_integration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Kaggle
              </CardTitle>
              <CardDescription>
                Find datasets for classification, regression, text analysis, and image recognition.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center space-y-2">
                    <Download className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">Import CSV Datasets</p>
                    <p className="text-sm text-muted-foreground">
                      Search for tabular datasets and import them directly into your project.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center space-y-2">
                    <ExternalLink className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">Browse Popular Datasets</p>
                    <p className="text-sm text-muted-foreground">
                      Explore trending datasets used by the ML community worldwide.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Full Kaggle search integration coming soon. For now, use the built-in dataset templates.
              </p>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>
    </AppLayout>
  );
}