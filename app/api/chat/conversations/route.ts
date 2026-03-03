import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userId = (session.user as any)?.id || session.user?.email;

    // Check if user has active conversation
    let conversation = await ChatConversation.findOne({
      userId,
      status: { $in: ['open', 'in_progress'] },
    });

    if (!conversation) {
      // Create new conversation
      conversation = new ChatConversation({
        userId,
        messages: [],
        status: 'open',
        isResumable: true,
        metadata: {
          startedAt: new Date(),
          userAgent: request.headers.get('user-agent'),
        },
      });

      await conversation.save();
    }

    return NextResponse.json({
      _id: conversation._id,
      status: conversation.status,
      messages: conversation.messages,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userId = (session.user as any)?.id || session.user?.email;

    const conversations = await ChatConversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10);

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
