# Email Delivery Integration for Scheduled Reports

## Overview
ModelMentor uses Resend (https://resend.com) for automated email delivery of scheduled reports. This document explains how the integration works and how to configure it.

## Setup Instructions

### 1. Create a Resend Account
1. Go to https://resend.com and sign up for an account
2. Verify your email address
3. Complete the onboarding process

### 2. Get Your API Key
1. Navigate to https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name (e.g., "ModelMentor Production")
4. Copy the API key (it will only be shown once)

### 3. Configure the Secret
The `RESEND_API_KEY` secret has been registered in the system. You need to provide your API key value through the Supabase dashboard or deployment configuration.

### 4. Verify Domain (Optional but Recommended)
For production use, verify your sending domain:
1. Go to https://resend.com/domains
2. Add your domain (e.g., modelmentor.app)
3. Add the required DNS records
4. Wait for verification

Once verified, update the Edge Function to use your domain:
```typescript
from: 'ModelMentor Reports <reports@yourdomain.com>'
```

## How It Works

### Scheduled Report Flow
1. Teachers create scheduled reports through the Reports page
2. Reports are stored in the `scheduled_reports` table with delivery configuration
3. The `send-scheduled-report` Edge Function runs daily (via cron or manual trigger)
4. The function:
   - Queries active scheduled reports
   - Filters reports due for delivery (based on day of week/month)
   - Generates report data from the database
   - Creates CSV attachment
   - Sends email via Resend API with automatic retry logic
   - Logs delivery status in `delivery_logs` table
   - Updates `scheduled_reports` with delivery status

### Automatic Retry Logic
The system implements intelligent retry logic for failed email deliveries:

**Retry Strategy:**
- **Maximum Retries**: 3 attempts
- **Exponential Backoff**: Delays increase between retries
  - 1st retry: 60 seconds (1 minute)
  - 2nd retry: 300 seconds (5 minutes)
  - 3rd retry: 900 seconds (15 minutes)

**Error Classification:**
- **Temporary Errors** (retryable):
  - 429 Rate Limit Exceeded
  - 503 Service Unavailable
  - 504 Gateway Timeout
  - 5xx Server Errors
  - Network failures
  
- **Permanent Errors** (non-retryable):
  - 400 Bad Request (invalid email format)
  - 401 Unauthorized (invalid API key)
  - 403 Forbidden (domain not verified)

**Behavior:**
- Temporary errors trigger automatic retries with exponential backoff
- Permanent errors fail immediately without retries
- Teachers receive error notification only after all retry attempts are exhausted
- Successful retries do not generate error notifications
- Each retry attempt is logged with timestamp and error details

### Email Template
The email includes:
- Professional HTML formatting
- Report summary with key statistics
- Date range and student counts
- CSV attachment with full report data
- Automated footer with unsubscribe information

### Delivery Tracking
- **delivery_status**: Current status (pending/success/error)
- **last_sent_at**: Timestamp of last successful delivery
- **delivery_count**: Total number of successful deliveries
- **last_error**: Error message if delivery failed (only after all retries exhausted)
- **delivery_logs**: Detailed log of all delivery attempts
  - **retry_attempts**: Number of retries before success (0 = first attempt succeeded)
  - **error_message**: Error details or retry information
  - **status**: success or error (final status after all retries)

## Testing

### Manual Trigger
You can manually trigger the Edge Function for testing:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-scheduled-report \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Test Email
Create a test scheduled report with:
- Frequency: Weekly
- Delivery day: Current day of week
- Recipients: Your test email address
- Format: CSV

Then trigger the function manually to test delivery.

## Monitoring

### Check Delivery Status
1. Go to Reports page → Scheduled Reports tab
2. View delivery status badges (Delivered/Error)
3. Check "Last sent" timestamp
4. Review error messages if delivery failed

### Resend Dashboard
Monitor email delivery in the Resend dashboard:
- https://resend.com/emails
- View sent emails, delivery status, and bounce rates
- Check for any API errors or rate limiting

## Troubleshooting

### Common Issues

**Error: "RESEND_API_KEY not configured"**
- Solution: Ensure the secret is properly configured in Supabase

**Error: "Resend API error: 401"**
- Solution: Check that your API key is valid and not expired

**Error: "Resend API error: 403"**
- Solution: Verify your domain or use a verified sending address

**Emails not being sent**
- Check that scheduled reports are active (is_active = true)
- Verify delivery_day matches current day
- Check Edge Function logs for errors
- Ensure cron job is configured to run daily
- Review delivery_logs table for retry attempts and error messages

**Emails failing after retries**
- Check delivery_logs for specific error messages
- Verify API key is valid and not expired
- Ensure domain is verified if using custom domain
- Check Resend dashboard for rate limiting or account issues
- Review error classification (temporary vs permanent)

**Retry logic not working**
- Verify Edge Function has sufficient timeout (at least 20 minutes for 3 retries)
- Check console logs for retry attempt messages
- Ensure exponential backoff delays are being applied
- Review delivery_logs retry_attempts field

**Attachments too large**
- Reduce date range to include fewer students
- Filter by specific students or concepts
- Consider splitting into multiple reports

## Rate Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month

For production use with many scheduled reports, consider upgrading to a paid plan.

## Security

- API keys are stored as Supabase secrets (not in code)
- Edge Function uses service role key for database access
- RLS policies ensure teachers can only access their own reports
- Email recipients are validated before sending
- Delivery logs track all email activity for audit purposes

## Future Enhancements

Potential improvements:
- PDF report generation with charts
- Customizable email templates
- Retry logic for failed deliveries
- Email delivery analytics dashboard
- Support for multiple email providers
- Batch sending for large recipient lists
