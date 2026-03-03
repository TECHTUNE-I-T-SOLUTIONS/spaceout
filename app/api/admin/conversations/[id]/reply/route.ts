import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Types } from 'mongoose';

// POST reply to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const conversation = await ChatConversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Add admin message
    const message = {
      _id: new Types.ObjectId(),
      sender: 'admin',
      senderId: (session.user as any)?.id || session.user?.email,
      content: content.trim(),
      isRead: true,
      createdAt: new Date(),
    };

    conversation.messages.push(message);
    conversation.status = 'in_progress';
    conversation.staffId = (session.user as any)?.id || session.user?.email;
    conversation.updatedAt = new Date();
    await conversation.save();

    return NextResponse.json({
      messageId: message._id,
    });
  } catch (error: any) {
    console.error('Error replying to conversation:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
