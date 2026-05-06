import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  datasetUrl: string;
  datasetName: string;
  platform: string;
  downloadId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { datasetUrl, datasetName, platform, downloadId }: DownloadRequest = await req.json();

    // Update status to downloading
    await supabaseClient
      .from('dataset_downloads')
      .update({ status: 'downloading', progress: 0 })
      .eq('id', downloadId);

    // Simulate download for educational purposes
    // In production, this would:
    // 1. Authenticate with the platform API
    // 2. Download the dataset
    // 3. Upload to Supabase Storage
    // 4. Update progress in real-time
    
    // For now, we'll create a simple demonstration
    const response = await fetch(datasetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }

    // Get content length for progress tracking
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength) : 0;

    // Read the response body
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Determine file extension from URL or content type
    const contentType = response.headers.get('content-type') || '';
    let extension = 'bin';
    if (contentType.includes('json')) extension = 'json';
    else if (contentType.includes('csv')) extension = 'csv';
    else if (contentType.includes('zip')) extension = 'zip';
    else if (datasetUrl.endsWith('.csv')) extension = 'csv';
    else if (datasetUrl.endsWith('.json')) extension = 'json';
    else if (datasetUrl.endsWith('.zip')) extension = 'zip';

    // Upload to Supabase Storage
    const fileName = `${user.id}/${downloadId}.${extension}`;
    const { error: uploadError } = await supabaseClient.storage
      .from('datasets')
      .upload(fileName, uint8Array, {
        contentType: contentType || 'application/octet-stream',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update download record
    await supabaseClient
      .from('dataset_downloads')
      .update({
        status: 'completed',
        progress: 100,
        file_path: fileName,
        file_size: totalSize || uint8Array.length,
        format: extension,
        downloaded_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', downloadId);

    return new Response(
      JSON.stringify({
        success: true,
        downloadId,
        filePath: fileName,
        fileSize: totalSize || uint8Array.length,
        format: extension
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Download error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
