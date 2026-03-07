import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Queue Status - Currently not in use
 * Batch emails are sent immediately without queuing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      stats: {
        pending: 0,
        sent: 0,
        failed: 0,
        total: 0,
      },
      message: 'Email queue monitoring is not enabled. Emails are sent immediately.',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
