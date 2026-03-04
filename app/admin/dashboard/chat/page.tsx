'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Send, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import io, { Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: 'user' | 'admin';
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  userId: string;
  messages: Message[];
  status: 'open' | 'closed' | 'archived' | 'in_progress';
  staffId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();

    // Initialize Socket.IO
    socketRef.current = io();

    socketRef.current.on('connect', () => {
      console.log('Admin connected to chat');
    });

    socketRef.current.on('receive_message', (data) => {
      // Update conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId
            ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  _id: Math.random().toString(),
                  sender: 'user',
                  senderId: data.userId,
                  content: data.content,
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
            : conv
        )
      );

      // Update selected conversation
      if (selectedConversation?._id === data.conversationId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: Math.random().toString(),
            sender: 'user',
            senderId: data.userId,
            content: data.content,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      toast.info('New message received');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedConversation?._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');

      const data = await res.json();
      setConversations(data);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages);

    // Mark messages as read
    try {
      await fetch(`/api/admin/conversations/${conversation._id}/mark-read`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/conversations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          content: messageInput,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const newMessage: Message = {
        _id: Math.random().toString(),
        sender: 'admin',
        senderId: 'admin', // Will be replaced with actual staff ID
        content: messageInput,
        isRead: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessageInput('');

      // Emit via socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit('admin_send_message', {
          conversationId: selectedConversation._id,
          staffId: 'admin', // Will be replaced with actual staff ID
          content: messageInput,
        });
      }

      toast.success('Message sent');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `/api/admin/conversations/${selectedConversation._id}/close`,
        { method: 'POST' }
      );

      if (!res.ok) throw new Error('Failed to close conversation');

      // Update UI
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === selectedConversation._id
            ? { ...conv, status: 'closed' }
            : conv
        )
      );
      setSelectedConversation(null);
      toast.success('Conversation closed');
    } catch (error: any) {
      console.error('Error closing conversation:', error);
      toast.error('Failed to close conversation');
    }
  };

  const statusColors = {
    open: 'bg-green-500',
    in_progress: 'bg-gray-500',
    closed: 'bg-gray-500',
    archived: 'bg-gray-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Chat Management</h1>
            <p className="text-gray-600 mt-2">Manage customer support conversations</p>
          </div>
          <Button onClick={fetchConversations} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {conversations.length === 0 ? (
                  <p className="text-center text-gray-500">No conversations</p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedConversation?._id === conv._id
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <p className="font-medium text-sm">{conv.userId}</p>
                          </div>
                          <p className="text-xs mt-1 opacity-75">
                            {conv.messages.length} messages
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-white ${statusColors[conv.status]}`}
                        >
                          {conv.status}
                        </Badge>
                      </div>
                      <p className="text-xs mt-2 opacity-60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(conv.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          {selectedConversation ? (
            <Card className="col-span-2 flex flex-col">
              {/* Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedConversation.userId}</CardTitle>
                    <p className="text-sm text-gray-500">
                      Started{' '}
                      {formatDistanceToNow(new Date(selectedConversation.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleCloseConversation}
                    disabled={selectedConversation.status === 'closed'}
                  >
                    Close Chat
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        msg.sender === 'admin'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-3 ${
                          msg.sender === 'admin'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === 'admin'
                              ? 'text-gray-100'
                              : 'text-gray-600'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !messageInput.trim()}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="col-span-2 flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
