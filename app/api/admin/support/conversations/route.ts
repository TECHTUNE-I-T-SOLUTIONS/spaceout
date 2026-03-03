import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ChatConversation from '@/lib/models/ChatConversation';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get all conversations (for admin dashboard)
    const conversations = await ChatConversation.find({})
      .sort({ updatedAt: -1 })
      .populate('userId', 'name email')
      .lean()
      .exec();

    // Transform for frontend
    const transformed = conversations.map((conv: any) => ({
      _id: conv._id,
      userId: conv.userId?._id || conv.userId,
      userEmail: conv.userId?.email,
      userName: conv.userId?.name,
      subject: conv.subject,
      department: conv.department,
      status: conv.status,
      messages: conv.messages || [],
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      hasUnread: (conv.messages || []).some((m: any) => !m.isRead && m.sender === 'user'),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
