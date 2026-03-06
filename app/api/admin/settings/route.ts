import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return default settings
    const settings = {
      businessName: 'SpaceOut',
      businessEmail: 'admin@spaceoutworkstation.com',
      businessPhone: '+234 (0) 809 988 5454',
      businessAddress: '123 Main St',
      businessCity: 'San Francisco',
      businessState: 'CA',
      businessZip: '94102',
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.businessName || !body.businessEmail) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    // Save settings (mock implementation)
    // In production, save to database here
    console.log('Settings saved:', body);

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: body,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
