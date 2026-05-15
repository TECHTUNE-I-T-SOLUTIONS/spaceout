import { NextRequest, NextResponse } from 'next/server';

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

  return NextResponse.json({
    ok: true,
    message: 'Cron test route reached successfully.',
    timestamp: new Date().toISOString(),
  });
}