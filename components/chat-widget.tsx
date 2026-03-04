'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { 
  subscribeToConversation, 
  broadcastMessage, 
  subscribeToConversations,
  broadcastNewConversation
} from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  senderType: 'user' | 'admin';
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  // Use useMemo to ensure consistent hook count
  const shouldShow = useMemo(() => pathname?.startsWith('/user/') ?? false, [pathname]);
  
  // Define all hooks unconditionally
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationChannelRef = useRef<RealtimeChannel | null>(null);
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const [previousConversations, setPreviousConversations] = useState<string[]>([]);
  const [showPreviousConversations, setShowPreviousConversations] = useState(false);
  const [previousConversationDetails, setPreviousConversationDetails] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [viewingPreviousId, setViewingPreviousId] = useState<string | null>(null);
  const [previousMessages, setPreviousMessages] = useState<Message[]>([]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('[Chat] State changed:', {
      isOpen,
      conversationId,
      previousConversations: previousConversations.length,
      previousConversationDetails: previousConversationDetails.length,
      showPreviousConversations,
      viewingPreviousId,
      loadingPrevious,
    });
  }, [isOpen, conversationId, previousConversations.length, previousConversationDetails.length, showPreviousConversations, viewingPreviousId, loadingPrevious]);

  // Initialize Supabase Real-time subscriptions
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || !shouldShow) return;

    // Subscribe to new conversations
    conversationsChannelRef.current = subscribeToConversations((data) => {
      console.log('[Chat] New conversation:', data);
    });

    return () => {
      if (conversationsChannelRef.current) {
        conversationsChannelRef.current.unsubscribe();
      }
    };
  }, [session?.user, status, shouldShow]);

  // Subscribe to conversation messages
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    conversationChannelRef.current = subscribeToConversation(
      conversationId,
      (data) => {
        console.log('[Chat] New message:', data);
        // Check for both 'admin' and 'staff' sender types
        if (data.sender === 'admin' || data.sender === 'staff') {
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
        } else if (data.event === 'closed') {
          toast.info('Conversation closed by admin');
          setConversationId(null);
          setMessages([]);
        }
      }
    );

    return () => {
      if (conversationChannelRef.current) {
        conversationChannelRef.current.unsubscribe();
      }
    };
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesViewportRef.current) {
      const viewport = messagesViewportRef.current;
      setTimeout(() => {
        viewport.scrollTop = viewport.scrollHeight;
      }, 0);
    }
  }, [messages]);

  // Fetch previous conversations on mount or when widget opens
  useEffect(() => {
    if (!session?.user?.id || !isOpen) return;

    const fetchPreviousConversations = async () => {
      try {
        console.log('[Chat] Fetching conversations for user...');
        const response = await fetch(`/api/chat/conversations?limit=20`);
        if (response.ok) {
          const data = await response.json();
          console.log('[Chat] API response:', data);
          // data is an array directly, not an object with conversations property
          const conversations = Array.isArray(data) ? data : data.conversations || [];
          console.log('[Chat] Parsed conversations:', conversations.length, 'items');
          const convIds = conversations
            .filter((conv: any) => conv._id !== conversationId)
            .map((conv: any) => conv._id);
          console.log('[Chat] Previous conversations found:', convIds.length, convIds);
          setPreviousConversations(convIds);
        } else {
          console.error('[Chat] Failed to fetch conversations:', response.status);
        }
      } catch (error) {
        console.error('Error fetching previous conversations:', error);
      }
    };

    fetchPreviousConversations();
  }, [session?.user?.id, isOpen]);

  // Fetch and load previous conversation details when conversations list is available
  useEffect(() => {
    if (!previousConversations.length || previousConversationDetails.length > 0) return;

    const fetchPrevDetails = async () => {
      console.log('[Chat] Fetching details for conversations:', previousConversations);
      setLoadingPrevious(true);
      try {
        const details = await Promise.all(
          previousConversations.map(async (convId) => {
            try {
              const response = await fetch(`/api/chat/conversations/${convId}`);
              if (response.ok) {
                const data = await response.json();
                const detail = {
                  _id: convId,
                  lastMessage: data.messages?.[data.messages.length - 1]?.content || 'No messages',
                  messageCount: data.messages?.length || 0,
                  updatedAt: data.updatedAt || new Date().toISOString(),
                };
                console.log('[Chat] Fetched detail for', convId, ':', detail);
                return detail;
              }
            } catch (error) {
              console.error(`Error fetching conversation ${convId}:`, error);
            }
            return null;
          })
        );
        const filteredDetails = details.filter(Boolean);
        console.log('[Chat] All conversation details loaded:', filteredDetails);
        setPreviousConversationDetails(filteredDetails);
      } catch (error) {
        console.error('Error fetching previous conversation details:', error);
      } finally {
        setLoadingPrevious(false);
      }
    };

    fetchPrevDetails();
  }, [previousConversations]);

  const handleLoadPreviousConversation = async (convId: string) => {
    try {
      setLoadingPrevious(true);
      const response = await fetch(`/api/chat/conversations/${convId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[Chat] Loaded conversation data:', data);
        const formattedMessages = data.messages?.map((msg: any) => ({
          id: msg._id || Math.random().toString(36).substring(7),
          // Check for both 'admin' and 'staff' (staff is what's stored in DB)
          senderType: msg.senderType || (msg.sender === 'staff' || msg.sender === 'admin' ? 'admin' : 'user'),
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          isRead: msg.isRead !== false,
        })) || [];
        console.log('[Chat] Formatted messages:', formattedMessages);
        setPreviousMessages(formattedMessages);
        setViewingPreviousId(convId);
      }
    } catch (error) {
      console.error('Error loading previous conversation:', error);
      toast.error('Failed to load previous conversation');
    } finally {
      setLoadingPrevious(false);
    }
  };

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

    const content = messageInput;
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      senderType: 'user',
      content,
      createdAt: new Date(),
      isRead: false,
    };

    console.log('[Chat] Optimistic message being added:', userMessage);
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      console.log('[Chat] Messages updated. Total:', updated.length);
      return updated;
    });
    setMessageInput('');
    console.log('[Chat] Input cleared, message input should now be empty');

    try {
      // Send via API
      console.log('[Chat] Sending message to API...');
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      console.log('[Chat] Message sent to API successfully');

      // Broadcast via Supabase for real-time delivery (fire-and-forget)
      broadcastMessage(conversationId, {
        conversationId,
        sender: 'user',
        content,
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.error('[Chat] Broadcast error:', err);
      });
    } catch (error: any) {
      console.error('[Chat] Error sending message:', error);
      toast.error('Failed to send message');
      setMessageInput(content);
    }
  };

  // Only render if user is authenticated, session exists, and should show on user routes
  if (!session?.user || !shouldShow) return null;

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-gray-600 text-white rounded-full p-4 shadow-lg hover:bg-gray-700 transition-all duration-200 hover:scale-110 z-40"
          title="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-8 right-8 w-96 h-[500px] flex flex-col shadow-2xl z-50 bg-white">
          {/* Header */}
          <div className="bg-gray-600 text-white p-4 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs text-gray-100">
                {isTyping ? 'Admin is typing...' : 'We usually reply within minutes'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-700 p-1 rounded"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {viewingPreviousId && (
              <div className="px-4 pt-3 border-b">
                <button
                  onClick={() => {
                    setViewingPreviousId(null);
                    setPreviousMessages([]);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Conversations
                </button>
              </div>
            )}

            {/* Messages Viewport */}
            <div 
              ref={messagesViewportRef}
              className="flex-1 overflow-y-auto p-4"
            >
              {/* Show Selected Previous Conversation Messages */}
              {viewingPreviousId && (
                <div className="space-y-4">
                  {loadingPrevious ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="animate-spin inline-block">
                        <Loader2 className="w-6 h-6" />
                      </div>
                      <p className="text-sm mt-2">Loading messages...</p>
                    </div>
                  ) : previousMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-sm">No messages in this conversation</p>
                    </div>
                  ) : (
                    previousMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs rounded-lg p-3 ${
                            msg.senderType === 'user'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderType === 'user'
                                ? 'text-gray-100'
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
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>
              )}

              {/* Show Current Conversation Messages */}
              {!showPreviousConversations && !viewingPreviousId && conversationId && (
                <div className="space-y-4">
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
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.senderType === 'user'
                              ? 'text-gray-100'
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
              )}

              {/* Show Default View - Previous Conversations or Welcome */}
              {!showPreviousConversations && !viewingPreviousId && !conversationId && (
                <div className="space-y-2">
                  {previousConversations.length > 0 ? (
                    <>
                      <div className="text-sm font-medium text-gray-700 mb-3">Your Conversations</div>
                      {previousConversationDetails.length > 0 ? (
                        previousConversationDetails.map((conv) => (
                          <button
                            key={conv._id}
                            onClick={() => handleLoadPreviousConversation(conv._id)}
                            className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">{conv.lastMessage}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''} • {new Date(conv.updatedAt).toLocaleDateString()}
                            </p>
                          </button>
                        ))
                      ) : loadingPrevious ? (
                        <div className="text-center text-gray-500 py-8">
                          <div className="animate-spin inline-block">
                            <Loader2 className="w-6 h-6" />
                          </div>
                          <p className="text-sm mt-2">Loading conversations...</p>
                        </div>
                      ) : null}
                      <button
                        onClick={handleStartChat}
                        className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                      >
                        + Start New Conversation
                      </button>
                    </>
                  ) : (
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
                </div>
              )}
            </div>
          </div>

          {/* Input - Show for active or previous conversations */}
          {(conversationId || viewingPreviousId) && (
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
          )}
        </Card>
      )}
    </>
  );
}
