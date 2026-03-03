import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Pricing plans are now stored only within Service documents
  // No more standalone pricing records in the database
  return NextResponse.json(
    {
      message:
        'Pricing plans are managed through services and cannot be deleted independently. Use the service pricing endpoint instead.',
    },
    { status: 403 }
  );
}
