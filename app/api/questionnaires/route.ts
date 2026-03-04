import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Questionnaire from '@/lib/models/Questionnaire';
import Question from '@/lib/models/Question';
import { cookies } from 'next/headers';
import Admin from '@/lib/models/Admin';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check admin authentication via cookies
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionnaires = await Questionnaire.find({
      status: 'published',
      startDate: { $lte: new Date() },
      $or: [{ endDate: null }, { endDate: { $gte: new Date() } }],
    })
      .populate('questions')
      .sort({ createdAt: -1 });

    return NextResponse.json(questionnaires);
  } catch (error: any) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaires' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminEmail = cookieStore.get('admin_email')?.value;
    const adminId = cookieStore.get('admin_id')?.value;
    const body = await request.json();

    if (!adminEmail || !adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify admin exists and is active
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, startDate, endDate, isRequired, showOnCheckIn } = body;

    const questionnaire = await Questionnaire.create({
      title,
      description,
      adminId: adminId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isRequired,
      showOnCheckIn,
      status: 'draft',
    });

    return NextResponse.json(questionnaire, { status: 201 });
  } catch (error: any) {
    console.error('Error creating questionnaire:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create questionnaire' },
      { status: 500 }
    );
  }
}
