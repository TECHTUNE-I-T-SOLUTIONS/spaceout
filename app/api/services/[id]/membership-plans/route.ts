import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

// GET membership plans for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    const activePlans = service.membershipPlans?.filter(plan => plan.isActive) || [];
    return NextResponse.json(activePlans);
  } catch (error: any) {
    console.error('Error fetching membership plans:', error);
    return NextResponse.json(
      { message: 'Failed to fetch membership plans' },
      { status: 500 }
    );
  }
}

// POST create membership plan for a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin session
    const adminRole = request.cookies.get('admin_role')?.value;
    const adminId = request.cookies.get('admin_id')?.value;

    if (!adminId || !['admin', 'superadmin'].includes(adminRole || '')) {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    const { name, duration, price, description, features } = await request.json();

    // Validation
    if (!name || duration === undefined || price === undefined) {
      return NextResponse.json(
        { message: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { message: 'Duration must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { message: 'Price must be a non-negative number' },
        { status: 400 }
      );
    }

    // Initialize membershipPlans array if it doesn't exist
    if (!service.membershipPlans) {
      service.membershipPlans = [];
    }

    const newPlan = {
      _id: new (require('mongoose')).Types.ObjectId(),
      name,
      duration,
      price,
      description: description || '',
      features: Array.isArray(features) ? features : [],
      isActive: true,
    };

    service.membershipPlans.push(newPlan as any);
    service.markModified('membershipPlans');
    await service.save();

    return NextResponse.json(
      { message: 'Membership plan created successfully', plan: newPlan },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating membership plan:', error);
    return NextResponse.json(
      { message: 'Failed to create membership plan' },
      { status: 500 }
    );
  }
}

// PUT update membership plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin session
    const adminRole = request.cookies.get('admin_role')?.value;
    const adminId = request.cookies.get('admin_id')?.value;

    if (!adminId || !['admin', 'superadmin'].includes(adminRole || '')) {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    const { planId, name, duration, price, description, features, isActive } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = service.membershipPlans?.find((p: any) => p._id?.toString() === planId);
    if (!plan) {
      return NextResponse.json(
        { message: 'Membership plan not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (name !== undefined) plan.name = name;
    if (duration !== undefined) plan.duration = duration;
    if (price !== undefined) plan.price = price;
    if (description !== undefined) plan.description = description;
    if (Array.isArray(features)) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;

    service.markModified('membershipPlans');
    await service.save();

    return NextResponse.json(
      { message: 'Membership plan updated successfully', plan }
    );
  } catch (error: any) {
    console.error('Error updating membership plan:', error);
    return NextResponse.json(
      { message: 'Failed to update membership plan' },
      { status: 500 }
    );
  }
}

// DELETE membership plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin session
    const adminRole = request.cookies.get('admin_role')?.value;
    const adminId = request.cookies.get('admin_id')?.value;

    if (!adminId || !['admin', 'superadmin'].includes(adminRole || '')) {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    service.membershipPlans = service.membershipPlans?.filter(
      (p: any) => p._id?.toString() !== planId
    ) || [];
    
    service.markModified('membershipPlans');
    await service.save();

    return NextResponse.json(
      { message: 'Membership plan deleted successfully' }
    );
  } catch (error: any) {
    console.error('Error deleting membership plan:', error);
    return NextResponse.json(
      { message: 'Failed to delete membership plan' },
      { status: 500 }
    );
  }
}
