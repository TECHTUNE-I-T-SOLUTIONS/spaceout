import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Question from '@/lib/models/Question';
import Questionnaire from '@/lib/models/Questionnaire';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const questions = await Question.find({
      questionnaireId: params.id,
    }).sort({ order: 1 });

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Verify questionnaire exists and belongs to admin
    const questionnaire = await Questionnaire.findById(params.id);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    const { title, type, options, required, order, description } = body;

    const question = await Question.create({
      questionnaireId: params.id,
      title,
      description,
      type,
      options,
      required,
      order,
    });

    // Add question to questionnaire
    await Questionnaire.findByIdAndUpdate(
      params.id,
      { $push: { questions: question._id } },
      { new: true }
    );

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create question' },
      { status: 500 }
    );
  }
}
