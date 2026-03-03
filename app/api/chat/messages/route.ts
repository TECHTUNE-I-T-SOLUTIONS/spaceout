import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Types } from 'mongoose';
import { broadcastMessage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content } = await request.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = (session.user as any)?.id || session.user?.email;

    const conversation = await ChatConversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Add message
    const message = {
      _id: new Types.ObjectId(),
      sender: 'user',
      senderId: userId,
      content: content.trim(),
      isRead: false,
      createdAt: new Date(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    await conversation.save();

    // Broadcast message via Supabase
    try {
      await broadcastMessage(conversationId, {
        conversationId,
        sender: 'user',
        senderName: session.user?.name || 'User',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Chat] Failed to broadcast message:', error);
      // Don't fail the response if Supabase broadcast fails
    }

    return NextResponse.json({
      messageId: message._id,
      conversationId: conversation._id,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = (session.user as any)?.id || session.user?.email;

    const conversation = await ChatConversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversationId: conversation._id,
      messages: conversation.messages,
      status: conversation.status,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
