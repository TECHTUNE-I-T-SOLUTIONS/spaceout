'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  subscribeToConversations,
  subscribeToConversation,
  broadcastMessage,
  broadcastConversationClosed,
} from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AdminMessage {
  id: string;
  senderType: 'user' | 'admin';
  senderName: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

interface AdminConversation {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  status: 'open' | 'closed' | 'archived';
  messages: AdminMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

export default function AdminChatWidget() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<AdminConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const conversationChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Supabase Real-time subscriptions
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    console.log('[Admin] Initializing Supabase subscriptions');

    // Subscribe to new conversations
    conversationsChannelRef.current = subscribeToConversations((data) => {
      console.log('[Admin] New conversation:', data);
      if (data.conversationId) {
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === data.conversationId);
          if (!exists) {
            return [
              {
                _id: data.conversationId,
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                subject: data.subject,
                status: 'open',
                messages: [],
                lastMessage: data.lastMessage,
                lastMessageTime: new Date(data.lastMessageTime),
              },
              ...prev,
            ];
          }
          return prev;
        });
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      if (conversationsChannelRef.current) {
        conversationsChannelRef.current.unsubscribe();
      }
    };
  }, [session?.user, status]);

  // Subscribe to current conversation messages
  useEffect(() => {
    if (!selectedConversation?._id) return;

    console.log('[Admin] Subscribing to conversation:', selectedConversation._id);

    conversationChannelRef.current = subscribeToConversation(
      selectedConversation._id,
      (data) => {
        console.log('[Admin] New message event:', data);
        if (data.sender === 'user') {
          setSelectedConversation((prev) =>
            prev
              ? {
                  ...prev,
                  messages: [
                    ...prev.messages,
                    {
                      id: Math.random().toString(36).substring(7),
                      senderType: 'user',
                      senderName: data.senderName || 'User',
                      content: data.content,
                      createdAt: new Date(data.createdAt),
                      isRead: false,
                    },
                  ],
                }
              : null
          );
        } else if (data.event === 'closed') {
          setSelectedConversation((prev) =>
            prev ? { ...prev, status: 'closed' } : null
          );
        }
      }
    );

    return () => {
      if (conversationChannelRef.current) {
        conversationChannelRef.current.unsubscribe();
      }
    };
  }, [selectedConversation?._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  // Load conversations when widget opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/support/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        setUnreadCount(data.filter((c: any) => c.hasUnread).length);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: AdminConversation) => {
    setSelectedConversation(conversation);
    setConversationLoading(true);

    try {
      const res = await fetch(
        `/api/admin/support/conversations/${conversation._id}`
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setConversationLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation) return;

    const message = messageInput;
    setMessageInput('');

    try {
      const res = await fetch(
        `/api/admin/support/conversations/${selectedConversation._id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message }),
        }
      );

      if (!res.ok) throw new Error('Failed to send message');

      // Broadcast via Supabase for real-time delivery
      await broadcastMessage(selectedConversation._id, {
        conversationId: selectedConversation._id,
        sender: 'admin',
        senderName: 'Admin',
        content: message,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessageInput(message);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `/api/admin/support/conversations/${selectedConversation._id}/close`,
        {
          method: 'POST',
        }
      );

      if (res.ok) {
        toast.success('Conversation closed');
        setSelectedConversation(null);
        await loadConversations();

        // Broadcast close event via Supabase
        await broadcastConversationClosed(selectedConversation._id);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      toast.error('Failed to close conversation');
    }
  };

  return (
    <>
      {/* Chat Widget Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        title="Support Center"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Widget Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col z-40 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Support Center</h3>
              <p className="text-xs opacity-90">
                {conversations.length} conversation
                {conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-800 p-1 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {!selectedConversation ? (
              // Conversations List
              <div className="w-full flex flex-col">
                <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Conversations</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={loadConversations}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      '↻'
                    )}
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation._id}
                          onClick={() => handleSelectConversation(conversation)}
                          className="w-full text-left p-3 rounded hover:bg-muted transition space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">
                              {conversation.subject}
                            </p>
                            {conversation.status === 'closed' && (
                              <CheckCircle size={14} className="text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.userEmail}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate line-clamp-1">
                              {conversation.lastMessage}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              // Selected Conversation
              <div className="w-full flex flex-col">
                {/* Conversation Header */}
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {selectedConversation.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.userEmail}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="hover:bg-muted p-1 rounded"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        selectedConversation.status === 'open'
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-100'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
                      }`}
                    >
                      {selectedConversation.status.charAt(0).toUpperCase() +
                        selectedConversation.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {conversationLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedConversation.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.senderType === 'admin'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderType === 'admin'
                                ? 'bg-gray-600 text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1">
                              {msg.senderName}
                            </p>
                            <p className="text-sm break-words">
                              {msg.content}
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                {selectedConversation.status === 'open' ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t space-y-3"
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your response..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" type="submit">
                        <Send size={16} />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleCloseConversation}
                    >
                      Close Conversation
                    </Button>
                  </form>
                ) : (
                  <div className="p-4 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                      This conversation is closed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
