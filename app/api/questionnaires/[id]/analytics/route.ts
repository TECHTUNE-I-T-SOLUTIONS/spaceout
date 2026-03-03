import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import QuestionnaireResponse from '@/lib/models/QuestionnaireResponse';
import Question from '@/lib/models/Question';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get all responses for questionnaire
    const responses = await QuestionnaireResponse.find({
      questionnaireId: params.id,
      status: 'completed',
    })
      .populate('userId', 'name email')
      .populate('answers.questionId')
      .sort({ completedAt: -1 });

    // Get all questions
    const questions = await Question.find({
      questionnaireId: params.id,
    }).sort({ order: 1 });

    // Calculate analytics
    const analytics = {
      totalResponses: responses.length,
      completionRate: 100, // Would need total participants count for accurate rate
      questionAnalytics: questions.map((question) => {
        const questionResponses = responses.map((r) =>
          r.answers.find((a) => a.questionId.toString() === question._id.toString())
        );

        let distribution = {};
        let avgRating = 0;

        if (question.type === 'multiple_choice' || question.type === 'dropdown') {
          // Count answer frequencies
          questionResponses.forEach((resp) => {
            if (resp?.answer) {
              const answer = String(resp.answer);
              distribution[answer] = (distribution[answer] || 0) + 1;
            }
          });
        } else if (question.type === 'rating') {
          const ratings = questionResponses
            .filter((r) => r?.answer)
            .map((r) => Number(r!.answer));
          avgRating = ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length)
            : 0;
        }

        return {
          questionId: question._id,
          title: question.title,
          type: question.type,
          totalAnswered: questionResponses.filter((r) => r).length,
          distribution,
          avgRating: question.type === 'rating' ? avgRating : null,
          responses: questionResponses
            .filter((r) => r && question.type === 'open_ended')
            .map((r) => r!.answer),
        };
      }),
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
