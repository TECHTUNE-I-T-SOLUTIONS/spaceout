import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Pricing from '@/lib/models/Pricing';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    let query: any = { isActive: true };

    if (branchId) {
      query.branchId = branchId;
    }

    const pricingPlans = await Pricing.find(query)
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    return NextResponse.json(pricingPlans);
  } catch (error: any) {
    console.error('Error fetching pricing plans:', error);

    await ErrorLog.create({
      route: '/api/pricing',
      error: error.message || 'Failed to fetch pricing plans',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch pricing plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      branchId,
      name,
      description,
      price,
      billingPeriod,
      features,
      icon,
      isFeatured,
    } = body;

    if (!branchId || !name || !description || price === undefined) {
      return NextResponse.json(
        { message: 'branchId, name, description, and price are required' },
        { status: 400 }
      );
    }

    const pricing = await Pricing.create({
      branchId,
      name,
      description,
      price: parseFloat(price),
      billingPeriod: billingPeriod || 'monthly',
      features: features || [],
      icon,
      isFeatured: isFeatured || false,
    });

    return NextResponse.json(pricing, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pricing plan:', error);

    await ErrorLog.create({
      route: '/api/pricing',
      error: error.message || 'Failed to create pricing plan',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to create pricing plan' },
      { status: 500 }
    );
  }
}
