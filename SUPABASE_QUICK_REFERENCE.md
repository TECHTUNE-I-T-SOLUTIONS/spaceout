# Supabase Integration - Quick Reference

## ✅ What We Did

Replaced Socket.IO with **Supabase Realtime + MongoDB**:

| Feature | Before (Socket.IO) | Now (Supabase) |
|---------|--------|--------|
| **Location** | Node.js server (doesn't work on Vercel) | Supabase hosting (works on Vercel) |
| **Data Storage** | In-memory (lost on restart) | MongoDB (permanent) |
| **Price** | Need dedicated server | Free tier available |
| **Real-time** | WebSocket | WebSocket via Supabase |

---

## 🚀 Quick Setup (5 minutes)

### 1. Sign Up for Supabase
Go to [https://supabase.com](https://supabase.com) → Create Free Project

### 2. Get Keys
**Project Settings** → **API** → Copy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Add to `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Restart Dev Server
```bash
npm run dev
```

### 5. Test
- User sends message
- Admin receives **instantly** ✨

---

## 📁 Files Changed

| File | Change |
|------|--------|
| `lib/supabase.ts` | ✨ **NEW** - Supabase client & helpers |
| `components/chat-widget.tsx` | Socket.IO → Supabase |
| `components/admin-chat-widget.tsx` | Socket.IO → Supabase |
| `app/api/chat/conversations/route.ts` | Add Supabase broadcast |
| `app/api/chat/messages/route.ts` | Add Supabase broadcast |
| `app/api/admin/support/conversations/[id]/route.ts` | Add Supabase broadcast |
| `.env.local` | Add Supabase keys |

---

## 🎯 Architecture

```
User/Admin sends message
         ↓
   Next.js API Route
         ↓
    MongoDB (save)
         ↓
  Supabase (broadcast)
         ↓
Real-time to all connected clients
```

---

## 💡 Key Points

✅ **MongoDB still stores all data** (permanent)  
✅ **Supabase just broadcasts** (real-time)  
✅ **Works on Vercel** (no WebSocket issues)  
✅ **Free tier** includes 1M messages/month  
✅ **Zero code in pages** — works automatically  

---

## 🔧 Available Broadcast Functions

Located in `/lib/supabase.ts`:

```typescript
// Subscribe to messages in a conversation
subscribeToConversation(conversationId, callback)

// Send message to all listening clients
broadcastMessage(conversationId, message)

// Subscribe to all new conversations
subscribeToConversations(callback)

// Broadcast when new conversation created
broadcastNewConversation(conversation)

// Close conversation notification
broadcastConversationClosed(conversationId)
```

---

## 📊 What Works Now

- ✅ User sends support message
- ✅ Message saved to MongoDB
- ✅ Admin sees it **instantly** (Supabase broadcast)
- ✅ Admin replies
- ✅ User sees reply **instantly**
- ✅ All data persists in MongoDB
- ✅ Works on Vercel deployment

---

## ⚠️ What Might Show as Errors (Normal)

```
GET /socket.io?EIO=4&transport=polling 404
```

**This is OK!** These are from old Socket.IO client attempts. They'll appear in console but don't affect functionality. You can remove the socket.io packages later if desired.

---

## 🐛 If Real-time Isn't Working

1. **Check environment variables:**
   ```bash
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

2. **Verify Supabase project is active:**
   - Supabase Dashboard → **Project Settings** → Under "Pause" (it's not paused, right?)

3. **Check browser console for errors:**
   - Open DevTools → Console
   - Look for error messages

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

## 📈 Monitoring

In Supabase Dashboard:
- **Realtime** tab shows active connections
- **Logs** show broadcast activity
- Monitor free tier usage

---

## 🎓 Next Features You Can Add

- Message reactions (Supabase broadcast)
- Typing indicators (Supabase broadcast)
- Video call integration
- File sharing (upload to Supabase Storage)

All use the same pattern: **Save to MongoDB, broadcast via Supabase**

---

## 📚 Documentation

- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Broadcast Documentation](https://supabase.com/docs/guides/realtime/broadcast)
- Full setup: See `SUPABASE_SETUP.md`

---

**Status:** ✅ Ready to use! Just add your Supabase keys and go!
