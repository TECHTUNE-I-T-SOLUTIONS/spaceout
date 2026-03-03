import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';
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

    const services = await Service.find(query)
      .populate('branchId')
      .lean();

    return NextResponse.json(services, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching services:', error);

    await ErrorLog.create({
      route: '/api/services',
      error: error.message || 'Failed to fetch services',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch services' },
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
      category,
      description,
      pricingPlans,
    } = body;

    // Validation
    if (!branchId || !name || !category || !description) {
      return NextResponse.json(
        { message: 'branchId, name, category, and description are required' },
        { status: 400 }
      );
    }

    const service = await Service.create({
      branchId,
      name,
      category,
      description,
      pricingPlans: pricingPlans || [],
      isActive: true,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service:', error);

    await ErrorLog.create({
      route: '/api/services',
      error: error.message || 'Failed to create service',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to create service' },
      { status: 500 }
    );
  }
}
