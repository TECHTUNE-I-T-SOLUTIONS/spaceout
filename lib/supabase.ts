import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Store for channels to ensure they stay subscribed
const channelStores = new Map<string, any>();

// Real-time channel subscription helpers
export const subscribeToConversation = (conversationId: string, callback: (payload: any) => void) => {
  const channelName = `conversation:${conversationId}`;
  if (!channelStores.has(channelName)) {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();
    channelStores.set(channelName, channel);
  }
  return channelStores.get(channelName);
};

export const broadcastMessage = async (conversationId: string, message: any) => {
  const channelName = `conversation:${conversationId}`;
  
  // Ensure channel is subscribed first
  if (!channelStores.has(channelName)) {
    const channel = supabase.channel(channelName).subscribe();
    channelStores.set(channelName, channel);
  }
  
  const channel = channelStores.get(channelName);
  
  // Wait for subscription to be ready
  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (channel?.state === 'joined') {
        channel.send('broadcast', {
          event: 'message',
          payload: message,
        }).then(resolve).catch(reject);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });
};

export const subscribeToConversations = (callback: (payload: any) => void) => {
  const channelName = 'conversations';
  if (!channelStores.has(channelName)) {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'new_conversation' }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();
    channelStores.set(channelName, channel);
  }
  return channelStores.get(channelName);
};

export const broadcastNewConversation = async (conversation: any) => {
  const channelName = 'conversations';
  
  // Ensure channel is subscribed first
  if (!channelStores.has(channelName)) {
    const channel = supabase.channel(channelName).subscribe();
    channelStores.set(channelName, channel);
  }
  
  const channel = channelStores.get(channelName);
  
  // Wait for subscription to be ready
  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (channel?.state === 'joined') {
        channel.send('broadcast', {
          event: 'new_conversation',
          payload: conversation,
        }).then(resolve).catch(reject);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });
};

export const broadcastConversationClosed = async (conversationId: string) => {
  const channelName = `conversation:${conversationId}`;
  
  // Ensure channel is subscribed first
  if (!channelStores.has(channelName)) {
    const channel = supabase.channel(channelName).subscribe();
    channelStores.set(channelName, channel);
  }
  
  const channel = channelStores.get(channelName);
  
  // Wait for subscription to be ready
  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (channel?.state === 'joined') {
        channel.send('broadcast', {
          event: 'closed',
          payload: { conversationId },
        }).then(resolve).catch(reject);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });
};
