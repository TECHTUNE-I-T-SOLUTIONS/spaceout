import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get all active services
    const services = await Service.find({ isActive: true })
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: services },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
