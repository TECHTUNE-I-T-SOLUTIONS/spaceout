import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// POST mark messages as read
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

    await dbConnect();
    const { id } = await params;

    const conversation = await ChatConversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Mark all user messages as read
    conversation.messages = conversation.messages.map((msg: any) => {
      if (msg.sender === 'user') {
        msg.isRead = true;
      }
      return msg;
    });

    await conversation.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
