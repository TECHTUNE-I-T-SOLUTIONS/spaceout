import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Pricing from '@/lib/models/Pricing';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const pricingPlans = await Pricing.find({ isActive: true })
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: pricingPlans },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}
