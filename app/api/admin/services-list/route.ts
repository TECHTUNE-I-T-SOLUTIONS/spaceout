import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const services = await Service.find({ isActive: true })
      .select('_id name pricingPlans')
      .sort({ name: 1 });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', message: (error as any).message },
      { status: 500 }
    );
  }
}
