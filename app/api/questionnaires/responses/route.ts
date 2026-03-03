import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuestionnaireResponse from '@/lib/models/QuestionnaireResponse';
import Questionnaire from '@/lib/models/Questionnaire';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get completed questionnaires for current user
    const responses = await QuestionnaireResponse.find({
      userId: (session.user as any).id,
      status: 'completed',
    })
      .populate('questionnaireId')
      .sort({ completedAt: -1 });

    return NextResponse.json(responses);
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
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

    await dbConnect();

    const { questionnaireId, answers } = body;

    // Validate questionnaire exists
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Create or update response
    const userId = (session.user as any).id;

    const response = await QuestionnaireResponse.findOneAndUpdate(
      { questionnaireId, userId },
      {
        answers,
        status: 'completed',
        completedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update questionnaire response count
    await Questionnaire.findByIdAndUpdate(
      questionnaireId,
      { $inc: { totalResponses: 1 } }
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit response' },
      { status: 500 }
    );
  }
}
