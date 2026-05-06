# Email Delivery Retry Logic

## Overview
The ModelMentor email delivery system implements intelligent automatic retry logic to handle temporary failures and ensure reliable report delivery to teachers.

## Retry Strategy

### Maximum Retry Attempts
- **Total Attempts**: 4 (1 initial + 3 retries)
- **Maximum Retries**: 3
- **Final Notification**: Only sent after all retries are exhausted

### Exponential Backoff Delays
The system uses exponential backoff to avoid overwhelming the email service:

| Attempt | Delay Before Retry | Total Time Elapsed |
|---------|-------------------|-------------------|
| 1st (initial) | 0s | 0s |
| 2nd (retry 1) | 60s (1 min) | 1 min |
| 3rd (retry 2) | 300s (5 min) | 6 min |
| 4th (retry 3) | 900s (15 min) | 21 min |

**Formula**: `delay = 5^attempt * 60 seconds`

## Error Classification

### Temporary Errors (Retryable)
These errors trigger automatic retry logic:

- **429 Too Many Requests**: Rate limiting by Resend
- **503 Service Unavailable**: Temporary service outage
- **504 Gateway Timeout**: Request timeout
- **5xx Server Errors**: Internal server errors
- **Network Failures**: Connection errors, DNS failures

### Permanent Errors (Non-Retryable)
These errors fail immediately without retries:

- **400 Bad Request**: Invalid email format or malformed request
- **401 Unauthorized**: Invalid or expired API key
- **403 Forbidden**: Domain not verified or insufficient permissions

## Implementation Details

### Retry Loop
```typescript
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    // Attempt to send email
    const response = await fetch('https://api.resend.com/emails', {...});
    
    if (!response.ok) {
      // Check if error is temporary or permanent
      const isTemporaryError = response.status === 429 || 
                               response.status === 503 || 
                               response.status >= 500;
      
      if (isTemporaryError && attempt < maxRetries) {
        // Calculate exponential backoff delay
        const delaySeconds = Math.pow(5, attempt) * 60;
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue; // Retry
      }
      
      throw error; // Permanent error or retries exhausted
    }
    
    return result; // Success
  } catch (error) {
    // Handle network errors with retry
  }
}
```

### Logging
Each delivery attempt is logged in the `delivery_logs` table:

**Successful Delivery:**
```json
{
  "status": "success",
  "email_id": "resend_email_id",
  "retry_attempts": 2,
  "error_message": "Delivered after 2 retry attempts"
}
```

**Failed Delivery (after all retries):**
```json
{
  "status": "error",
  "retry_attempts": 3,
  "error_message": "Resend API error: 503 - Service Unavailable"
}
```

## Teacher Notifications

### Success After Retries
- No error notification sent
- Delivery marked as successful
- Retry count logged for audit purposes
- Teachers see "Delivered" status badge

### Failure After All Retries
- Error notification sent to teacher
- Includes detailed error message
- Shows all retry attempts were exhausted
- Teachers see "Error" status badge with error details

## Benefits

### Improved Reliability
- Handles transient network issues automatically
- Recovers from temporary service outages
- Reduces false error notifications

### Reduced Manual Intervention
- Most temporary failures resolve automatically
- Teachers only notified of genuine issues
- System self-heals without admin action

### Better User Experience
- Teachers receive reports even during brief outages
- Clear visibility into retry attempts
- Detailed error information when issues persist

## Monitoring

### Check Retry Statistics
Query delivery logs to see retry patterns:

```sql
SELECT 
  retry_attempts,
  COUNT(*) as count,
  AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_rate
FROM delivery_logs
GROUP BY retry_attempts
ORDER BY retry_attempts;
```

### Identify Problematic Reports
Find reports that frequently require retries:

```sql
SELECT 
  sr.report_name,
  COUNT(*) as total_deliveries,
  AVG(dl.retry_attempts) as avg_retries,
  SUM(CASE WHEN dl.status = 'error' THEN 1 ELSE 0 END) as failures
FROM scheduled_reports sr
JOIN delivery_logs dl ON sr.id = dl.scheduled_report_id
GROUP BY sr.id, sr.report_name
HAVING AVG(dl.retry_attempts) > 1
ORDER BY avg_retries DESC;
```

## Edge Cases

### Multiple Reports Scheduled Simultaneously
- Each report processes independently
- Retries don't block other reports
- Total execution time may exceed 21 minutes

### Edge Function Timeout
- Ensure Edge Function timeout is at least 25 minutes
- Allows time for all retries with delays
- Consider processing reports sequentially if many are scheduled

### Rate Limiting
- Exponential backoff helps avoid rate limits
- 15-minute delay on 3rd retry allows rate limit reset
- Consider spreading scheduled reports across different times

## Testing

### Simulate Temporary Failure
Temporarily disable Resend API key to test retry logic:
1. Set invalid API key
2. Trigger scheduled report
3. Observe retry attempts in logs
4. Restore valid API key before 3rd retry
5. Verify successful delivery

### Simulate Permanent Failure
Use invalid email address to test immediate failure:
1. Create test report with invalid recipient
2. Trigger delivery
3. Verify no retry attempts
4. Check error notification sent immediately

## Future Enhancements

Potential improvements:
- Configurable retry delays per report
- Different retry strategies for different error types
- Retry queue for failed deliveries
- Dashboard showing retry statistics
- Alerts for high retry rates
