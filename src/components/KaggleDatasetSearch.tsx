import { useState } from 'react';
import { Search, ExternalLink, Download, TrendingUp, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { KaggleDataset, KaggleSearchResult } from '@/types/types';

export function KaggleDatasetSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [datasets, setDatasets] = useState<KaggleDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const handleSearch = async (newPage = 1) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setPage(newPage);

    try {
      const { data, error } = await supabase.functions.invoke(
        `kaggle-search?q=${encodeURIComponent(searchQuery)}&page=${newPage}&pageSize=20`,
        {
          method: 'GET',
        }
      );

      if (error) {
        const errorMsg = await error?.context?.text();
        console.error('Kaggle search error:', errorMsg || error?.message);
        toast.error('Failed to search Kaggle datasets. Please check your API credentials.');
        return;
      }

      const result = data as KaggleSearchResult;
      setDatasets(result.datasets);
      setHasMore(result.datasets.length === result.pageSize);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Kaggle Datasets</CardTitle>
          <CardDescription>
            Find and explore datasets from Kaggle's vast collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets (e.g., 'sentiment analysis', 'house prices', 'image classification')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleSearch(1)} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && searched && datasets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No datasets found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search query</p>
          </CardContent>
        </Card>
      )}

      {!loading && datasets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight mb-1 line-clamp-2">
                        {dataset.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        by {dataset.creator}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {dataset.usabilityRating.toFixed(1)} ⭐
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dataset.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dataset.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>{formatNumber(dataset.downloads)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{formatNumber(dataset.votes)} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{dataset.sizeFormatted}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(dataset.lastUpdated)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a
                      href={dataset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Kaggle
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSearch(page - 1)}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              onClick={() => handleSearch(page + 1)}
              disabled={!hasMore || loading}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Info Card */}
      {!searched && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to use Kaggle datasets:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Search for datasets using keywords related to your project</li>
                <li>Click "View on Kaggle" to see dataset details and download options</li>
                <li>Download the dataset from Kaggle (requires free Kaggle account)</li>
                <li>Upload the dataset files to your ModelMentor project</li>
              </ol>
              <p className="text-xs mt-4">
                Note: You need to configure Kaggle API credentials in Supabase secrets to use this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
