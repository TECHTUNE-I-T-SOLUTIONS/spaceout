import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const conversation = await ChatConversation.findByIdAndUpdate(
      id,
      {
        status: 'closed',
        closedAt: new Date(),
      },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Conversation closed successfully',
      conversationId: id,
    });
  } catch (error: any) {
    console.error('Error closing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to close conversation' },
      { status: 500 }
    );
  }
}
