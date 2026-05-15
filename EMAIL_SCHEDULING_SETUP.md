# Email Scheduling Setup Guide

## Overview

SpaceOut supports two email automation paths:

1. Admin-triggered batch emails from the dashboard.
2. Scheduled birthday emails from the public cron endpoint.

## Birthday Emails On cron-job.org

Use cron-job.org to hit the birthday endpoint once per day.

1. Create a job in [cron-job.org](https://cron-job.org).
2. Set the request URL to `https://yourdomain.com/api/public/birthday-emails?secret=YOUR_CRON_SECRET`.
3. Use the `GET` method.
4. Schedule it once per day at a time that matches your business timezone.
5. If Vercel protection is enabled for the route, add this header as well:

```http
x-vercel-protection-bypass: YOUR_VERCEL_PROTECTION_BYPASS_SECRET
```

The birthday endpoint automatically sends:

- a reminder email 7 days before the birthday
- a birthday email on the birthday itself

## Environment Variables

Add these values to your environment:

```env
CRON_SECRET=your_secure_random_token_here
SPECIAL_DAY_EMAIL_CRON_SECRET=your_secure_random_token_here
VERCEL_PROTECTION_BYPASS_SECRET=your_vercel_protection_bypass_secret_here
```

You can use the same secret for `CRON_SECRET` and `SPECIAL_DAY_EMAIL_CRON_SECRET` if you want one shared token.

## Batch Email Flow

The existing admin email queue still works for manual and scheduled messages from the dashboard.

1. Go to Admin Dashboard → Users → Send Emails.
2. Enter the subject and message.
3. Choose whether to send immediately or schedule for later.
4. Save or send the email.

## Troubleshooting

- If cron-job.org receives `401 Unauthorized`, verify the `secret` query string or `x-cron-secret` header.
- If Vercel blocks the request before it reaches the app, add the `x-vercel-protection-bypass` header and configure the same bypass secret in Vercel.
- If emails do not send, confirm SMTP settings in [lib/email.ts](lib/email.ts).

## Notes

- Birthday scheduling is date-based, so one daily cron job is enough.
- The endpoint can be called with `GET` or `POST`, but `GET` is the simplest option for cron-job.org.
