import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return current server time in Nigeria timezone (UTC+1)
    const timestamp = new Date().toISOString();
    
    return NextResponse.json(
      {
        timestamp,
        timezone: 'Africa/Lagos',
        utcOffset: '+01:00',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting server time:', error);
    return NextResponse.json(
      { error: 'Failed to get server time', message: error.message },
      { status: 500 }
    );
  }
}
