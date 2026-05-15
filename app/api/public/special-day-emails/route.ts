import { NextRequest, NextResponse } from 'next/server';
import {
  buildSpecialDayEmail,
  getManualSpecialDayTemplates,
  getSpecialDayTemplatesForDate,
  sendSpecialDayEmails,
  type SpecialDayKey,
} from '@/lib/special-day-email-service';

function parseDate(input: string | null) {
  if (!input) return new Date();

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function parseOccasionKeys(rawValue: string | null) {
  if (!rawValue) return undefined;

  const keys = rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean) as SpecialDayKey[];

  return keys.length > 0 ? keys : undefined;
}

function verifyCronSecret(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET || process.env.SPECIAL_DAY_EMAIL_CRON_SECRET;
  if (!configuredSecret) return null;

  const authorizationHeader = request.headers.get('authorization');
  const providedSecret =
    request.headers.get('x-cron-secret') ||
    request.nextUrl.searchParams.get('secret') ||
    (authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null);

  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const date = parseDate(request.nextUrl.searchParams.get('date'));
  const occasionKeys = parseOccasionKeys(request.nextUrl.searchParams.get('occasionKeys'));
  const occasions = occasionKeys && occasionKeys.length > 0
    ? getManualSpecialDayTemplates(occasionKeys)
    : getSpecialDayTemplatesForDate(date);

  const preview = occasions.length > 0
    ? buildSpecialDayEmail('Valued Member', occasions, date)
    : null;

  return NextResponse.json({
    ok: true,
    date: date.toISOString(),
    occasions: occasions.map((occasion) => ({
      key: occasion.key,
      title: occasion.title,
      subject: occasion.subject,
      kind: occasion.kind,
      notes: occasion.notes,
    })),
    preview,
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const date = parseDate(body.date || request.nextUrl.searchParams.get('date'));
  const occasionKeys = body.occasionKeys || parseOccasionKeys(request.nextUrl.searchParams.get('occasionKeys'));

  const result = await sendSpecialDayEmails({
    date,
    occasionKeys,
  });

  return NextResponse.json({
    ok: true,
    date: date.toISOString(),
    ...result,
  });
}
