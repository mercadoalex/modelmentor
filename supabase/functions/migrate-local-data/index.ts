import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MigrateProjectRequest {
  title: string
  description: string
  model_type: string
  status: string
  dataset?: {
    file_content: string // base64
    file_name: string
    labels: string[]
    sample_count: number
  }
}

interface MigrateRequest {
  projects: MigrateProjectRequest[]
}

interface MigrateResponse {
  migrated: number
  failed: Array<{ title: string; reason: string }>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // --- Authenticate user ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 'unauthorized', message: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: 'unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Validate request body ---
    const body: MigrateRequest = await req.json()

    if (!body.projects || !Array.isArray(body.projects) || body.projects.length === 0) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Request must include a non-empty projects array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Process each project independently ---
    const response: MigrateResponse = { migrated: 0, failed: [] }

    for (const project of body.projects) {
      try {
        // Validate required project fields
        if (!project.title || !project.model_type || !project.status) {
          response.failed.push({ title: project.title || 'Unknown', reason: 'Missing required fields: title, model_type, status' })
          continue
        }

        // Create project record
        const { data: projectRecord, error: projectError } = await supabase
          .from('projects')
          .insert({
            title: project.title,
            description: project.description || '',
            model_type: project.model_type,
            status: project.status,
            user_id: user.id,
          })
          .select()
          .single()

        if (projectError || !projectRecord) {
          response.failed.push({ title: project.title, reason: `Failed to create project: ${projectError?.message || 'Unknown error'}` })
          continue
        }

        // Upload dataset if present
        if (project.dataset) {
          const { file_content, file_name, labels, sample_count } = project.dataset

          if (!file_content || !file_name) {
            // Project was created successfully, but dataset is invalid - still count as migrated
            response.migrated++
            continue
          }

          // Decode base64 content
          let fileBytes: Uint8Array
          try {
            const binaryString = atob(file_content)
            fileBytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              fileBytes[i] = binaryString.charCodeAt(i)
            }
          } catch (_e) {
            response.failed.push({ title: project.title, reason: 'Invalid base64 dataset content' })
            // Clean up the project record since dataset was expected but invalid
            await supabase.from('projects').delete().eq('id', projectRecord.id)
            continue
          }

          // Determine file format from extension
          const extension = file_name.split('.').pop()?.toLowerCase() || ''
          const validFormats = ['csv', 'json', 'zip']
          const fileFormat = validFormats.includes(extension) ? extension : 'csv'

          // Upload to storage
          const storagePath = `${user.id}/${projectRecord.id}/${file_name}`
          const { error: uploadError } = await supabase.storage
            .from('user-datasets')
            .upload(storagePath, fileBytes, {
              contentType: fileFormat === 'csv' ? 'text/csv' : fileFormat === 'json' ? 'application/json' : 'application/zip',
              upsert: true,
            })

          if (uploadError) {
            response.failed.push({ title: project.title, reason: `Failed to upload dataset: ${uploadError.message}` })
            // Clean up the project record
            await supabase.from('projects').delete().eq('id', projectRecord.id)
            continue
          }

          // Create dataset record
          const { error: datasetError } = await supabase
            .from('datasets')
            .insert({
              project_id: projectRecord.id,
              user_id: user.id,
              file_name: file_name,
              file_url: storagePath,
              file_size_bytes: fileBytes.length,
              file_format: fileFormat,
              labels: labels || [],
              sample_count: sample_count || 0,
              row_count: sample_count || null,
            })

          if (datasetError) {
            response.failed.push({ title: project.title, reason: `Failed to create dataset record: ${datasetError.message}` })
            // Clean up storage and project
            await supabase.storage.from('user-datasets').remove([storagePath])
            await supabase.from('projects').delete().eq('id', projectRecord.id)
            continue
          }
        }

        response.migrated++
      } catch (itemError) {
        const reason = itemError instanceof Error ? itemError.message : 'Unknown error during migration'
        response.failed.push({ title: project.title || 'Unknown', reason })
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ code: 'internal_error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
