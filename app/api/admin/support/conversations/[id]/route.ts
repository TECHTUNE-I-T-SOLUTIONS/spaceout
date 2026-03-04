import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';
import { broadcastMessage } from '@/lib/supabase';

export async function GET(
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

    const conversation = await ChatConversation.findById(id)
      .populate('userId', 'name email')
      .exec();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: conversation._id,
      userId: conversation.userId?._id,
      userEmail: conversation.userId?.email,
      userName: conversation.userId?.name,
      subject: conversation.subject,
      status: conversation.status,
      messages: conversation.messages.map((msg: any) => ({
        id: msg._id,
        senderType: msg.sender,
        senderName: msg.sender === 'admin' ? 'Admin' : conversation.userId?.name,
        content: msg.content,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      })),
      createdAt: conversation.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const conversation = await ChatConversation.findByIdAndUpdate(
      id,
      {
        $push: {
          messages: {
            sender: 'staff',
            senderId: adminId,
            content: content.trim(),
            createdAt: new Date(),
            isRead: true,
          },
        },
        lastMessage: content.trim(),
        lastMessageTime: new Date(),
      },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Return immediately - broadcast message via Supabase asynchronously
    broadcastMessage(id, {
      conversationId: id,
      sender: 'staff',
      senderName: 'Admin',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }).catch((error) => {
      console.error('[Admin Chat] Failed to broadcast message:', error);
      // Log but continue - don't fail the response
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      conversationId: id,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
