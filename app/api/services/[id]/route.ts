import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const service = await Service.findById(id).populate('branchId');

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { name, category, description } = body;

    if (!name || !category || !description) {
      return NextResponse.json(
        { message: 'name, category, and description are required' },
        { status: 400 }
      );
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { name, category, description },
      { new: true }
    ).populate('branchId');

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service, { status: 200 });
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete service' },
      { status: 500 }
    );
  }
}
