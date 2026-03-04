import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Question from '@/lib/models/Question';
import Questionnaire from '@/lib/models/Questionnaire';
import { cookies } from 'next/headers';
import Admin from '@/lib/models/Admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify questionnaire exists and belongs to this admin
    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    if (questionnaire.adminId.toString() !== adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, options, required, order, description, helpText, placeholder, validation, conditionalLogic, randomizeOptions, showNumbers, minRating, maxRating, minRatingLabel, maxRatingLabel } = body;

    const question = await Question.create({
      questionnaireId: id,
      title,
      description,
      type,
      options,
      required,
      order,
      helpText,
      placeholder,
      validation,
      conditionalLogic,
      randomizeOptions,
      showNumbers,
      minRating,
      maxRating,
      minRatingLabel,
      maxRatingLabel,
    });

    // Add question to questionnaire
    const updatedQuestionnaire = await Questionnaire.findByIdAndUpdate(
      id,
      { $push: { questions: question._id } },
      { new: true }
    ).populate('questions');

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create question' },
      { status: 500 }
    );
  }
}
