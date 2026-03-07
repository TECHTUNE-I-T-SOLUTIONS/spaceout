# Email Scheduling Setup Guide

## Overview
The SpaceOut admin dashboard now supports sending transactional emails to all users with automatic personalization and optional scheduling.

## Features
- **Batch Emails**: Send personalized emails to all users with a single submission
- **Auto-Personalization**: The system automatically adds "Dear [FirstName]," to each email
- **Immediate Sending**: Send emails right away to all users
- **Scheduled Sending**: Schedule emails to be sent at a specific date and time
- **Email Queue**: Scheduled emails are stored in MongoDB and processed via API endpoint
- **Retry Logic**: Failed emails automatically retry up to 3 times

## How It Works

### Immediate Email Sending
1. Admin goes to Admin Dashboard → Users → "Send Emails" tab
2. Fills in Subject and Message
3. Clicks "Send Emails"
4. Emails are sent immediately to all users with personalization

### Scheduled Email Sending
1. Admin goes to Admin Dashboard → Users → "Send Emails" tab
2. Fills in Subject and Message
3. Checks "Schedule Email for Later"
4. Selects a future date and time
5. Clicks "Schedule Emails"
6. Emails are queued in the database for processing at the scheduled time

## Setting Up Email Queue Processing

### Option 1: Using Vercel Cron Jobs (Recommended for Vercel deployments)

Create a file: `public/crons/process-emails.json`
```json
{
  "cronExpression": "*/5 * * * *",
  "description": "Process scheduled emails from queue every 5 minutes"
}
```

Then in your codebase, add a cron job configuration to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/process-email-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: Using External Services (e.g., EasyCron or similar)

1. Go to https://www.easycron.com or similar service
2. Create a new cron job with:
   - **URL**: `https://yourdomain.com/api/admin/process-email-queue`
   - **Method**: POST
   - **Headers**: 
     ```
     Authorization: Bearer YOUR_INTERNAL_API_TOKEN
     Content-Type: application/json
     ```
   - **Schedule**: Every 5 minutes (or your preferred interval)

### Option 3: Self-Hosted/Custom Server

Use a tool like `node-cron` in a separate worker process or schedule via system cron:

```bash
*/5 * * * * curl -X POST https://yourdomain.com/api/admin/process-email-queue \
  -H "Authorization: Bearer YOUR_INTERNAL_API_TOKEN" \
  -H "Content-Type: application/json"
```

## Configuration

### Setting Up Internal API Token

Add to your `.env.local`:
```env
INTERNAL_API_TOKEN=your_secure_random_token_here
```

Or use Vercel's environment variables if you're on Vercel.

The email processor will use either:
1. `INTERNAL_API_TOKEN` - Your custom secret token
2. `CRON_SECRET` - Fallback secret for cron jobs
3. `dev-token` - For local development (not recommended for production)

Set your Authorization header to:
```
Authorization: Bearer YOUR_TOKEN_VALUE
```

## API Endpoints

### Send Batch Emails
**POST** `/api/admin/send-batch-email`

Request body:
```json
{
  "subject": "Email Subject",
  "message": "Your message here...",
  "userIds": ["user1_id", "user2_id"],
  "scheduled": false,
  "scheduledDateTime": null
}
```

For scheduled emails:
```json
{
  "subject": "Email Subject",
  "message": "Your message here...",
  "userIds": ["user1_id", "user2_id"],
  "scheduled": true,
  "scheduledDateTime": "2026-03-10T14:30:00"
}
```

Response:
```json
{
  "success": true,
  "count": 50,
  "message": "50 emails scheduled for..."
}
```

### Process Email Queue
**POST** `/api/admin/process-email-queue`

Request header:
```
Authorization: Bearer YOUR_INTERNAL_API_TOKEN
```

Response:
```json
{
  "success": true,
  "processedCount": 10,
  "successCount": 9,
  "failureCount": 1,
  "message": "Processed 10 emails (9 sent, 1 failed)"
}
```

## Email Format

Each personalized email includes:

```
Dear [FirstName],

[Admin's Message]

---
Best regards,
SpaceOut Team
SpaceOut Workspace Solutions

Visit our website | Contact us
```

## Database Collections

### emailQueue Collection
Stores pending, scheduled, and processed emails.

Fields:
- `_id`: Unique identifier
- `userId`: User's MongoDB ID
- `email`: User's email address
- `firstName`: User's first name
- `lastName`: User's last name
- `subject`: Email subject
- `message`: Email message body
- `scheduledDateTime`: When the email should be sent
- `createdAt`: When the email was queued
- `sentAt`: When the email was actually sent
- `status`: 'pending' | 'sent' | 'failed'
- `attempts`: Number of send attempts
- `lastError`: Error message if failed

## Troubleshooting

### Emails Not Sending
1. Check that `INTERNAL_API_TOKEN` is set in environment variables
2. Verify the cron job is running by checking logs
3. Check MongoDB connection and `emailQueue` collection exists
4. Verify user IDs in the request are valid MongoDB ObjectIDs

### Scheduled Emails Not Processing
1. Verify the cron job configuration is correct
2. Check that `scheduledDateTime` is in the past when processor runs
3. Check database for pending emails in `emailQueue`
4. Review application logs for error messages

### Emails Marked as Failed
1. Check email service SMTP configuration in `/lib/email.ts`
2. Review error message in `lastError` field in database
3. Check Namecheap email service status
4. Verify recipient email addresses are valid

## Testing

### Test Immediate Email Sending
1. Add a user to the system
2. Go to Admin Dashboard → Users → Send Emails tab
3. Fill in subject and message
4. Click "Send Emails"
5. Check your email inbox

### Test Scheduled Email Sending
1. Schedule an email for 5 minutes in the future
2. Wait for the cron job to run (check your scheduled interval)
3. Run the processor manually:
   ```bash
   curl -X POST http://localhost:3000/api/admin/process-email-queue \
     -H "Authorization: Bearer dev-token" \
     -H "Content-Type: application/json"
   ```
4. Check the logs for successful processing

## Performance Considerations

- Emails are sent sequentially (one per iteration) to avoid overwhelming the SMTP server
- The retry logic helps handle temporary SMTP failures
- For very large user bases (1000+), consider:
  - Increasing cron interval to run more frequently
  - Batching emails in the processor
  - Using a dedicated email queue service

## Security Notes

- The email processor endpoint requires authentication via `INTERNAL_API_TOKEN`
- Never expose your API token in client-side code
- Use HTTPS for all API calls
- Regularly rotate your internal API token
- Monitor email queue for failed attempts

---

For support or questions, check the SpaceOut documentation or contact the development team.
