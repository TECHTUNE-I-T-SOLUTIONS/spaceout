# Setting Up Supabase Realtime for SpaceOut

## Why Supabase Realtime?

**Problem:** Socket.IO doesn't work on Vercel (WebSocket connections aren't supported in serverless)

**Solution:** Use Supabase Realtime for broadcast channels while keeping MongoDB for data persistence

- ✅ Supabase Realtime = WebSocket server (handles real-time messages)
- ✅ MongoDB = Database (stores all data permanently)
- ✅ Works perfectly on Vercel
- ✅ Free tier available (1,000,000 messages/month)

---

## Step-by-Step Setup

### 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new organization and project

**Choose settings:**
- **Region:** Closest to your users (e.g., `us-east-1`)
- **Database Name:** `spaceout`
- **Database Password:** Generate a secure password

### 2. Get Your API Keys

After project creation:

1. Go to **Project Settings** (⚙️ icon, bottom left)
2. Click **API** in the left menu
3. Copy these values:

```
NEXT_PUBLIC_SUPABASE_URL = Your project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY = anon public key
```

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Add to Environment Variables

Add to your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Rest of your existing variables...
MONGODB_URI=...
NEXTAUTH_SECRET=...
```

### 4. Enable Realtime (Optional - Usually On by Default)

1. In Supabase Dashboard, go to **Replication** in left menu
2. Ensure realtime is enabled for your project
3. You don't need database tables - we only use broadcast channels!

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│   User Chat Widget (Next.js)            │
│   - Sends message to /api/chat/messages │
│   - Subscribes to Supabase channel      │
└──────────┬──────────────────────────────┘
           │
           ├─→ Save to MongoDB
           │   (persistent storage)
           │
           └─→ Broadcast via Supabase
               (real-time to all clients)
               
┌─────────────────────────────────────────┐
│   Admin Chat Widget (Next.js)           │
│   - Subscribes to Supabase channels     │
│   - Receives real-time messages         │
│   - Sends responses (same flow)         │
└─────────────────────────────────────────┘
```

### Message Flow

1. **User sends message:**
   - Message sent to `/api/chat/messages`
   - Saved in MongoDB
   - Broadcasted via Supabase Realtime

2. **Admin receives real-time:**
   - Admin chat widget listens to Supabase channel
   - Message appears instantly (no polling!)
   - Admin replies via `/api/admin/support/conversations/[id]/messages`
   - Reply saved to MongoDB & broadcast via Supabase

---

## Code Examples

### Broadcasting a Message

```typescript
import { broadcastMessage } from '@/lib/supabase';

// In your API route after saving to MongoDB:
await broadcastMessage(conversationId, {
  conversationId,
  sender: 'user', // or 'admin'
  content: 'Hello!',
  createdAt: new Date().toISOString(),
});
```

### Subscribing to Messages

```typescript
import { subscribeToConversation } from '@/lib/supabase';

const channel = subscribeToConversation(conversationId, (data) => {
  console.log('New message:', data);
  // Update UI
});

// Cleanup:
channel.unsubscribe();
```

---

## Pricing & Limits

**Supabase Free Tier:**
- 500,000 monthly active users
- 2 GB storage
- 1,000,000 messages/month (Realtime)
- ✅ Perfect for starting!

**Paid Tiers:**
- Pro: $25/month (more messages & users)
- Team: $599/month (dedicated support)

See [Supabase Pricing](https://supabase.com/pricing)

---

## Testing Realtime

### 1. Test in Development

```bash
npm run dev
```

1. Open two browser tabs
2. Tab 1: User sends message
3. Tab 2 (Admin): Should see message appear instantly

### 2. Check Supabase Dashboard

In Supabase Dashboard → **Realtime** section:
- See active connections
- Monitor message throughput
- Check for errors

---

## Troubleshooting

### Problem: "Cannot read properties of undefined (reading 'channel')"

**Fix:** Ensure environment variables are set:

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

If empty, add to `.env.local` and restart dev server.

### Problem: Messages not appearing in real-time

**Check:**
1. Supabase URL & key are correct
2. Supabase project is active (check dashboard)
3. Check console for errors: `[Chat] Failed to broadcast message`
4. Verify network tab shows `/socket.io` requests (they'll come in but won't fail)

### Problem: "Project is paused"

**Fix:** Go to Supabase Dashboard → Project Settings → Pause/Resume → Resume Project

---

## Removing Socket.IO

Socket.IO packages are still installed but no longer used:

**Keep them for now** - they won't cause issues and might be useful later.

When ready to remove:

```bash
pnpm remove socket.io socket.io-client @types/socket.io @types/socket.io-client
```

---

## Next Steps

1. Sign up for [Supabase](https://supabase.com)
2. Create a project
3. Copy API keys to `.env.local`
4. Restart dev server
5. Test: User sends message → Admin receives instantly!

---

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Broadcast Channel Guide](https://supabase.com/docs/guides/realtime/broadcast)

---

**Questions?** Check `/lib/supabase.ts` for all available broadcast helpers.
