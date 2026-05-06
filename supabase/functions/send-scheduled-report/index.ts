import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate CSV report
function generateCSVReport(reportData: any): string {
  const rows: string[][] = [];

  // Header
  rows.push([reportData.title]);
  rows.push([`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`]);
  rows.push([`Date Range: ${new Date(reportData.dateRange.start).toLocaleDateString()} - ${new Date(reportData.dateRange.end).toLocaleDateString()}`]);
  rows.push([]);

  // Summary statistics
  rows.push(['Summary Statistics']);
  rows.push(['Total Students', reportData.totalStudents.toString()]);
  rows.push(['Average Score', `${reportData.averageScore}%`]);
  rows.push(['At-Risk Students', reportData.atRiskCount.toString()]);
  rows.push([]);

  // Concept averages
  rows.push(['Concept Mastery Averages']);
  rows.push(['Concept', 'Average Score', 'Struggling Students']);
  reportData.conceptAverages.forEach((ca: any) => {
    rows.push([
      ca.concept.replace(/_/g, ' '),
      `${ca.average}%`,
      ca.struggling.toString()
    ]);
  });
  rows.push([]);

  // Student details
  rows.push(['Student Details']);
  rows.push(['Name', 'Email', 'Total Projects', 'Completed Projects', 'Average Score', 'At-Risk']);
  reportData.students.forEach((student: any) => {
    rows.push([
      student.student.username || 'N/A',
      student.student.email || 'N/A',
      student.totalProjects.toString(),
      student.completedProjects.toString(),
      `${student.averageScore}%`,
      student.alerts.length > 0 ? 'Yes' : 'No'
    ]);
  });

  // Convert to CSV string
  return rows.map(row => 
    row.map(cell => {
      const escaped = cell.replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
        ? `"${escaped}"`
        : escaped;
    }).join(',')
  ).join('\n');
}

// Helper function to generate report data
async function generateReportData(supabaseClient: any, report: any) {
  // Get all students or filtered students
  const { data: students, error: studentsError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  if (studentsError) throw studentsError;

  // Get progress for each student
  const studentsProgress = [];
  for (const student of students || []) {
    // Get concept mastery
    const { data: conceptMastery } = await supabaseClient
      .from('concept_mastery')
      .select('*')
      .eq('user_id', student.id);

    // Get recent activity
    const { data: recentActivity } = await supabaseClient
      .from('student_activity')
      .select('*')
      .eq('user_id', student.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get alerts
    const { data: alerts } = await supabaseClient
      .from('at_risk_alerts')
      .select('*')
      .eq('user_id', student.id)
      .eq('is_resolved', false);

    // Get project counts
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('id, status')
      .eq('user_id', student.id);

    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter((p: any) => p.status === 'completed').length || 0;

    // Calculate average score
    const averageScore = conceptMastery && conceptMastery.length > 0
      ? Math.round(conceptMastery.reduce((sum: number, m: any) => sum + m.mastery_score, 0) / conceptMastery.length)
      : 0;

    studentsProgress.push({
      student,
      totalProjects,
      completedProjects,
      averageScore,
      conceptMastery: conceptMastery || [],
      recentActivity: recentActivity || [],
      alerts: alerts || []
    });
  }

  // Filter by date range if specified
  const dateRange = report.filters?.date_range || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  };

  // Calculate statistics
  const totalStudents = studentsProgress.length;
  const averageScore = totalStudents > 0
    ? Math.round(studentsProgress.reduce((sum: number, p: any) => sum + p.averageScore, 0) / totalStudents)
    : 0;
  const atRiskCount = studentsProgress.filter((p: any) => p.alerts.length > 0).length;

  // Calculate concept averages
  const conceptScores: Record<string, number[]> = {};
  studentsProgress.forEach((progress: any) => {
    progress.conceptMastery.forEach((mastery: any) => {
      if (!conceptScores[mastery.concept_name]) {
        conceptScores[mastery.concept_name] = [];
      }
      conceptScores[mastery.concept_name].push(mastery.mastery_score);
    });
  });

  const conceptAverages = Object.entries(conceptScores).map(([concept, scores]) => ({
    concept,
    average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    struggling: scores.filter(s => s < 70).length
  }));

  return {
    title: report.report_name,
    dateRange,
    generatedAt: new Date().toISOString(),
    students: studentsProgress,
    conceptAverages,
    totalStudents,
    averageScore,
    atRiskCount
  };
}

// Helper function to send email via Resend with retry logic
async function sendEmailWithResend(
  recipients: string[],
  subject: string,
  htmlContent: string,
  attachmentContent: string,
  attachmentFilename: string,
  maxRetries: number = 3
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  // Convert CSV content to base64
  const encoder = new TextEncoder();
  const data = encoder.encode(attachmentContent);
  const base64Content = btoa(String.fromCharCode(...data));

  let lastError: Error | null = null;
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ModelMentor Reports <reports@modelmentor.app>',
          to: recipients,
          subject: subject,
          html: htmlContent,
          attachments: [{
            filename: attachmentFilename,
            content: base64Content
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Resend API error: ${response.status} - ${errorText}`);
        
        // Check if error is temporary (retryable)
        const isTemporaryError = 
          response.status === 429 || // Rate limit
          response.status === 503 || // Service unavailable
          response.status === 504 || // Gateway timeout
          response.status >= 500;    // Server errors
        
        // Check if error is permanent (non-retryable)
        const isPermanentError = 
          response.status === 400 || // Bad request (invalid email)
          response.status === 401 || // Unauthorized
          response.status === 403;   // Forbidden
        
        if (isPermanentError) {
          // Don't retry permanent errors
          throw error;
        }
        
        if (isTemporaryError && attempt < maxRetries) {
          // Calculate exponential backoff delay: 60s, 300s (5min), 900s (15min)
          const delaySeconds = Math.pow(5, attempt) * 60; // 60, 300, 900 seconds
          console.log(`Temporary error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delaySeconds}s...`);
          lastError = error;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          continue;
        }
        
        throw error;
      }

      // Success - return result
      const result = await response.json();
      if (attempt > 0) {
        console.log(`Email sent successfully after ${attempt} retry attempts`);
      }
      return { ...result, retryAttempts: attempt };
      
    } catch (error) {
      // Network errors or fetch failures
      if (attempt < maxRetries) {
        const delaySeconds = Math.pow(5, attempt) * 60;
        console.log(`Network error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delaySeconds}s...`);
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      // All retries exhausted
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Email delivery failed after all retry attempts');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get scheduled reports that need to be sent
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    const { data: scheduledReports, error: fetchError } = await supabaseClient
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    const reportsToSend = scheduledReports?.filter((report: any) => {
      if (report.frequency === 'weekly' && report.delivery_day === dayOfWeek) {
        return true;
      }
      if (report.frequency === 'monthly' && report.delivery_day === dayOfMonth) {
        return true;
      }
      return false;
    }) || [];

    console.log(`Found ${reportsToSend.length} reports to send`);

    const results = [];

    // Process each report
    for (const report of reportsToSend) {
      try {
        console.log(`Processing report: ${report.report_name}`);

        // Generate report data
        const reportData = await generateReportData(supabaseClient, report);

        // Generate CSV content
        const csvContent = generateCSVReport(reportData);

        // Create email content
        const emailSubject = `Scheduled Report: ${report.report_name}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${report.report_name}</h2>
            <p>Your scheduled report is ready.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #555;">Report Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Date Range:</strong></td>
                  <td style="padding: 8px 0;">${new Date(reportData.dateRange.start).toLocaleDateString()} - ${new Date(reportData.dateRange.end).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Total Students:</strong></td>
                  <td style="padding: 8px 0;">${reportData.totalStudents}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Average Score:</strong></td>
                  <td style="padding: 8px 0;">${reportData.averageScore}%</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>At-Risk Students:</strong></td>
                  <td style="padding: 8px 0;">${reportData.atRiskCount}</td>
                </tr>
              </table>
            </div>
            
            <p>The complete report is attached to this email as a ${report.format.toUpperCase()} file.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated report from ModelMentor. You are receiving this because you scheduled this report.
            </p>
          </div>
        `;

        // Send email with attachment
        const emailResult = await sendEmailWithResend(
          report.recipients,
          emailSubject,
          emailHtml,
          csvContent,
          `${report.report_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        );

        console.log(`Email sent successfully:`, emailResult);

        // Update last_sent_at and delivery status
        await supabaseClient
          .from('scheduled_reports')
          .update({ 
            last_sent_at: new Date().toISOString(),
            delivery_status: 'success',
            last_error: null,
            delivery_count: report.delivery_count + 1
          })
          .eq('id', report.id);

        // Log successful delivery
        await supabaseClient
          .from('delivery_logs')
          .insert({
            scheduled_report_id: report.id,
            status: 'success',
            email_id: emailResult.id,
            recipients: report.recipients,
            retry_attempts: emailResult.retryAttempts || 0,
            error_message: emailResult.retryAttempts > 0 
              ? `Delivered after ${emailResult.retryAttempts} retry attempts`
              : null
          });

        results.push({
          reportId: report.id,
          reportName: report.report_name,
          status: 'success',
          emailId: emailResult.id,
          retryAttempts: emailResult.retryAttempts
        });

      } catch (error) {
        console.error(`Error sending report ${report.id}:`, error);
        
        // Update delivery status with error
        await supabaseClient
          .from('scheduled_reports')
          .update({ 
            delivery_status: 'error',
            last_error: error.message
          })
          .eq('id', report.id);

        // Log failed delivery
        await supabaseClient
          .from('delivery_logs')
          .insert({
            scheduled_report_id: report.id,
            status: 'error',
            error_message: error.message,
            recipients: report.recipients,
            retry_attempts: 3 // All retries exhausted
          });

        results.push({
          reportId: report.id,
          reportName: report.report_name,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: reportsToSend.length,
        results,
        message: `Processed ${reportsToSend.length} scheduled reports`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-scheduled-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
