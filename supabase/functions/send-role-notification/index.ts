import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'role_change' | 'request_approved' | 'request_rejected';
  userEmail: string;
  userName: string;
  oldRole?: string;
  newRole: string;
  reason: string;
  changedByName?: string;
  adminNotes?: string;
}

function generateEmailHTML(data: NotificationRequest): { subject: string; html: string } {
  const baseURL = Deno.env.get('PUBLIC_SITE_URL') || 'https://your-app.com';
  
  if (data.type === 'role_change') {
    return {
      subject: `Your ModelMentor Role Has Been Updated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Role Change Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">ModelMentor</h1>
                      <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">No-Code ML Training Platform</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Your Role Has Been Updated</h2>
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                        Hello ${data.userName},
                      </p>
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                        Your role in ModelMentor has been changed by ${data.changedByName || 'an administrator'}.
                      </p>
                      
                      <!-- Role Change Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 12px;">
                                  <span style="font-size: 14px; color: #6b7280;">Previous Role:</span>
                                  <span style="font-size: 16px; font-weight: 600; color: #111827; margin-left: 8px; text-transform: capitalize;">${data.oldRole || 'N/A'}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 12px;">
                                  <span style="font-size: 14px; color: #6b7280;">New Role:</span>
                                  <span style="font-size: 16px; font-weight: 600; color: #059669; margin-left: 8px; text-transform: capitalize;">${data.newRole}</span>
                                </td>
                              </tr>
                              ${data.reason ? `
                              <tr>
                                <td>
                                  <span style="font-size: 14px; color: #6b7280;">Reason:</span>
                                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151; line-height: 20px;">${data.reason}</p>
                                </td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                        This change is effective immediately. Your new permissions and access levels are now active.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0;">
                            <a href="${baseURL}/login" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                              Sign In to ModelMentor
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        If you have questions about this change, please contact your administrator.
                      </p>
                      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                        <a href="${baseURL}/settings?tab=notifications" style="color: #2563eb; text-decoration: none;">Manage email preferences</a> · 
                        © ${new Date().getFullYear()} ModelMentor. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  }
  
  if (data.type === 'request_approved') {
    return {
      subject: `Your Role Request Has Been Approved`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Role Request Approved</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">ModelMentor</h1>
                      <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">No-Code ML Training Platform</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Success Icon -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                              <span style="font-size: 32px;">✓</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827; text-align: center;">Request Approved!</h2>
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                        Hello ${data.userName},
                      </p>
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                        Great news! Your request for <strong style="color: #059669; text-transform: capitalize;">${data.newRole}</strong> role has been approved.
                      </p>
                      
                      ${data.reason ? `
                      <!-- Original Request Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Your Request:</p>
                            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 20px;">${data.reason}</p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                        You now have access to all ${data.newRole} features and capabilities. Sign in to start exploring your new permissions.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0;">
                            <a href="${baseURL}/login" style="display: inline-block; padding: 12px 32px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                              Get Started
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        Thank you for being part of ModelMentor!
                      </p>
                      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                        <a href="${baseURL}/settings?tab=notifications" style="color: #2563eb; text-decoration: none;">Manage email preferences</a> · 
                        © ${new Date().getFullYear()} ModelMentor. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  }
  
  // request_rejected
  return {
    subject: `Update on Your Role Request`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Role Request Update</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">ModelMentor</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">No-Code ML Training Platform</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Update on Your Role Request</h2>
                    
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                      Hello ${data.userName},
                    </p>
                    
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                      Thank you for your interest in the <strong style="text-transform: capitalize;">${data.newRole}</strong> role. After careful review, we're unable to approve your request at this time.
                    </p>
                    
                    ${data.reason ? `
                    <!-- Original Request Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Your Request:</p>
                          <p style="margin: 0; font-size: 14px; color: #374151; line-height: 20px;">${data.reason}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    ${data.adminNotes ? `
                    <!-- Admin Notes Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">Administrator's Note:</p>
                          <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 20px;">${data.adminNotes}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                    
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                      You're welcome to submit a new request in the future. If you have questions about this decision, please contact an administrator.
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0;">
                          <a href="${baseURL}/login" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                            Continue to ModelMentor
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                      Thank you for your understanding.
                    </p>
                    <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                      <a href="${baseURL}/settings?tab=notifications" style="color: #2563eb; text-decoration: none;">Manage email preferences</a> · 
                      © ${new Date().getFullYear()} ModelMentor. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const notificationData: NotificationRequest = await req.json();

    // Validate required fields
    if (!notificationData.type || !notificationData.userEmail || !notificationData.newRole) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, userEmail, newRole' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', notificationData.userEmail)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    // Check email preferences if user exists
    if (userData) {
      const { data: preferences, error: prefsError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (prefsError) {
        console.error('Error fetching email preferences:', prefsError);
      }

      // Check if user has opted out of this notification type
      if (preferences) {
        if (notificationData.type === 'role_change' && !preferences.role_change_notifications) {
          console.log(`User ${notificationData.userEmail} has opted out of role change notifications`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              skipped: true,
              message: 'Email skipped - user opted out' 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if ((notificationData.type === 'request_approved' || notificationData.type === 'request_rejected') 
            && !preferences.role_request_notifications) {
          console.log(`User ${notificationData.userEmail} has opted out of role request notifications`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              skipped: true,
              message: 'Email skipped - user opted out' 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Generate email content
    const { subject, html } = generateEmailHTML(notificationData);

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'ModelMentor <notifications@modelmentor.app>',
        to: [notificationData.userEmail],
        subject: subject,
        html: html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email sent successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send notification',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
