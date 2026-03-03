'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderType: 'user' | 'admin';
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!session?.user) return;

    socketRef.current = io();

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
      socketRef.current?.emit('join_room', session.user?.email);
    });

    socketRef.current.on('receive_message', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          senderType: 'user',
          content: data.content,
          createdAt: new Date(data.createdAt),
          isRead: true,
        },
      ]);
      setIsTyping(false);
    });

    socketRef.current.on('admin_message', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          senderType: 'admin',
          content: data.content,
          createdAt: new Date(data.createdAt),
          isRead: true,
        },
      ]);
      setIsTyping(false);
    });

    socketRef.current.on('user_typing', () => {
      setIsTyping(true);
    });

    socketRef.current.on('user_stopped_typing', () => {
      setIsTyping(false);
    });

    socketRef.current.on('conversation_closed', () => {
      toast.info('Conversation closed by admin');
      setConversationId(null);
      setMessages([]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [session?.user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleStartChat = async () => {
    if (!session?.user) {
      toast.error('Please login to start a chat');
      return;
    }

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to start conversation');

      const conversation = await res.json();
      setConversationId(conversation._id);
      setMessages([]);
      toast.success('Chat started! An admin will reply soon.');
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    if (!conversationId) {
      await handleStartChat();
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      senderType: 'user',
      content: messageInput,
      createdAt: new Date(),
      isRead: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessageInput('');

    try {
      // Send via API
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: messageInput,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      // Also emit via socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          conversationId,
          userId: session?.user?.email,
          content: messageInput,
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (!session?.user) return null;

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-40"
          title="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-8 right-8 w-96 h-[500px] flex flex-col shadow-2xl z-50 bg-white">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs text-blue-100">
                {isTyping ? 'Admin is typing...' : 'We usually reply within minutes'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && !conversationId && (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Welcome! How can we help?</p>
                  <Button
                    onClick={handleStartChat}
                    className="mt-4"
                    size="sm"
                  >
                    Start Conversation
                  </Button>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-lg p-3 ${
                      msg.senderType === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.senderType === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !messageInput.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
