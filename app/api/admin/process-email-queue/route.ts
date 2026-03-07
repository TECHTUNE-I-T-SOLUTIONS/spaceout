import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Queue Processor - Currently not in use
 * Batch emails are sent immediately without scheduling
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Email queue processing is not enabled. Emails are sent immediately.' },
    { status: 200 }
  );
}
