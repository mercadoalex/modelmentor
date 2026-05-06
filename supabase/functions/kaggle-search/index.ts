import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KaggleDataset {
  ref: string;
  title: string;
  subtitle: string;
  creatorName: string;
  creatorUrl: string;
  totalBytes: number;
  url: string;
  lastUpdated: string;
  downloadCount: number;
  voteCount: number;
  usabilityRating: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Kaggle credentials from environment
    const kaggleUsername = Deno.env.get('KAGGLE_USERNAME');
    const kaggleKey = Deno.env.get('KAGGLE_KEY');

    if (!kaggleUsername || !kaggleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Kaggle API credentials not configured. Please add KAGGLE_USERNAME and KAGGLE_KEY to your Supabase secrets.' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    // Create Basic Auth header for Kaggle API
    const authHeader = `Basic ${btoa(`${kaggleUsername}:${kaggleKey}`)}`;

    // Search Kaggle datasets
    const kaggleApiUrl = `https://www.kaggle.com/api/v1/datasets/list?search=${encodeURIComponent(searchQuery)}&page=${page}&pageSize=${pageSize}`;

    const response = await fetch(kaggleApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kaggle API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch datasets from Kaggle API',
          details: errorText 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const datasets: KaggleDataset[] = await response.json();

    // Format response
    const formattedDatasets = datasets.map((dataset) => ({
      id: dataset.ref,
      title: dataset.title,
      description: dataset.subtitle || '',
      creator: dataset.creatorName,
      creatorUrl: `https://www.kaggle.com${dataset.creatorUrl}`,
      size: dataset.totalBytes,
      sizeFormatted: formatBytes(dataset.totalBytes),
      url: `https://www.kaggle.com${dataset.url}`,
      lastUpdated: dataset.lastUpdated,
      downloads: dataset.downloadCount,
      votes: dataset.voteCount,
      usabilityRating: dataset.usabilityRating,
    }));

    return new Response(
      JSON.stringify({
        datasets: formattedDatasets,
        page,
        pageSize,
        total: formattedDatasets.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in kaggle-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
