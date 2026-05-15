import { NextRequest, NextResponse } from 'next/server';
import { sendBirthdayEmails } from '@/lib/birthday-email-service';

function verifyCronSecret(request: NextRequest) {
  const acceptedSecrets = [
    process.env.CRON_SECRET,
    process.env.SPECIAL_DAY_EMAIL_CRON_SECRET,
    process.env.VERCEL_PROTECTION_BYPASS_SECRET,
  ].filter(Boolean);

  if (acceptedSecrets.length === 0) return null;

  const authorizationHeader = request.headers.get('authorization');
  const providedSecrets = [
    request.headers.get('x-cron-secret') ||
    request.nextUrl.searchParams.get('secret') ||
    (authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null),
    request.headers.get('x-vercel-protection-bypass') || request.nextUrl.searchParams.get('bypass'),
  ].filter(Boolean) as string[];

  const isAuthorized = providedSecrets.some((secret) => acceptedSecrets.includes(secret));

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

function parseDryRun(value: string | null) {
  return value === '1' || value === 'true';
}

function parseDate(input: string | null) {
  if (!input) return new Date();

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

async function handleRequest(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const dryRun = parseDryRun(request.nextUrl.searchParams.get('dryRun'));
  const date = parseDate(request.nextUrl.searchParams.get('date'));
  const result = await sendBirthdayEmails({ date, dryRun });

  return NextResponse.json({
    ok: true,
    date: date.toISOString(),
    ...result,
  });
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}