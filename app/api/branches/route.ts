import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Branch from '@/lib/models/Branch';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const branches = await Branch.find({ isActive: true });
    return NextResponse.json(branches);
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, location, phone, email, capacity, amenities, image } = body;

    const branch = await Branch.create({
      name,
      location,
      phone,
      email,
      capacity,
      amenities,
      image,
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create branch' },
      { status: 500 }
    );
  }
}
