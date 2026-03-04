import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session: any = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userId = session.user?.id || session.user?.email;
    console.log('[Chat] Fetching conversation:', id, 'for userId:', userId);

    // Find conversation and verify ownership in a single query
    const conversation = await ChatConversation.findOne({
      _id: id,
      userId: userId,
    });

    if (!conversation) {
      console.log('[Chat] Conversation not found or access denied - id:', id, 'userId:', userId);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: conversation._id,
      messages: conversation.messages || [],
      updatedAt: conversation.updatedAt,
      status: conversation.status,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
