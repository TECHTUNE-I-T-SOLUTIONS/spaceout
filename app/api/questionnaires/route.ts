import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Questionnaire from '@/lib/models/Questionnaire';
import Question from '@/lib/models/Question';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
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
    const session = await getServerSession(authOptions);
    const body = await request.json();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { title, description, startDate, endDate, isRequired, showOnCheckIn } = body;

    const questionnaire = await Questionnaire.create({
      title,
      description,
      adminId: (session.user as any).id,
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
