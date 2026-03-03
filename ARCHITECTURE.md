# SpaceOut Real-Time Architecture

## Complete System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL DEPLOYMENT                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js Application (Frontend)               │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  User Side                    Admin Side            │  │  │
│  │  │  ┌──────────────────┐    ┌──────────────────┐      │  │  │
│  │  │  │ Chat Widget      │    │ Admin Chat       │      │  │  │
│  │  │  │ - Send message   │    │ - View conv list │      │  │  │
│  │  │  │ - See replies    │    │ - Reply to users │      │  │  │
│  │  │  └──────────────────┘    └──────────────────┘      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                      ↓                                      │  │
│  │              Next.js API Routes                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ /api/chat/conversations    - Create conversation   │  │  │
│  │  │ /api/chat/messages         - Send message           │  │  │
│  │  │ /api/admin/support/...     - Admin endpoints        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                        ↓ ↓ ↓
└────────────────────────┼─┼─┼─────────────────────────────────────┘
                         │ │ │
        ┌────────────────┘ │ └──────────────────┐
        │                  │                     │
        ↓                  ↓                     ↓
   ┌──────────┐       ┌──────────┐        ┌──────────┐
   │ MongoDB  │       │ Supabase │        │  Others  │
   │(Search) │       │ Realtime │        │  (Stripe)│
   │          │       │(WebSocket)        │          │
   │ Stores:  │       │                   │          │
   │- Messages│       │Broadcasts:        │          │
   │- Users   │       │- Messages         │          │
   │- Conv... │       │- New conversations│          │
   │          │       │- Typing events    │          │
   └──────────┘       └──────────┘        └──────────┘
        ↓                   ↓
   Persistent          Real-Time Link
   Storage             (WebSocket)
```

---

## Data Flow: Message Sending

### User Sends Message

```
1. User types in chat widget
2. Clicks "Send"
   ↓
3. Client sends POST to /api/chat/messages
   ↓
4. API Route:
   a. Saves message to MongoDB
   b. Broadcasts via Supabase
   ↓
5. Two things happen:
   a. User's widget gets Supabase event → shows sent ✓
   b. Admin's widget gets Supabase event → shows new message
   ↓
6. Admin types reply & clicks "Send"
   ↓
7. Same process: MongoDB + Supabase broadcast
   ↓
8. User sees reply instantly
```

---

## Database Architecture

### MongoDB (Data Layer)

**Stored Collections:**
```
ChatConversation {
  _id: ObjectId
  userId: ObjectId (ref: User)
  subject: "General Support"
  status: "open" | "closed"
  messages: [
    {
      sender: "user" | "staff"
      content: "Hello"
      createdAt: Date
      isRead: boolean
    }
  ]
  createdAt: Date
  updatedAt: Date
}

User {
  _id: ObjectId
  email: string (unique)
  name: string
  password: string (hashed)
  role: "user" | "admin"
  ...
}
```

### Supabase (Real-Time Layer)

**Broadcast Channels (No DB Required!):**
```
- conversations           → New conversation events
- conversation:{id}       → Messages in specific conversation
  
No tables needed! Just channels.
```

---

## Component Communication

### Chat Widget (User)

```typescript
// Subscribe
const channel = subscribeToConversation(conversationId, (msg) => {
  // Show message from admin
})

// Send
POST /api/chat/messages {
  conversationId, content
}
→ MongoDB saves
→ Supabase broadcasts
→ Channel triggers callback
→ Update UI
```

### Admin Chat Widget

```typescript
// Subscribe to all conversations
const convChannel = subscribeToConversations((conv) => {
  // Add to list
})

// Subscribe to selected conversation
const msgChannel = subscribeToConversation(selectedId, (msg) => {
  // Show user message
})

// Send reply
POST /api/admin/support/conversations/{id}/messages {
  content
}
→ MongoDB saves
→ Supabase broadcasts
→ User's widget receives event
```

---

## Message Lifecycle

```
Timestamp          Event                      Storage     Real-Time
────────────────────────────────────────────────────   ──────────
T0                 User opens chat            -          Setup Supabase sub
T1    User types   message                    -          Local state
T5    User clicks  "Send"                     -          Optimistic update
T6    POST API     /api/chat/messages         ✓          Broadcast event
T7                 Supabase event             -          Channel receives
T8                 Admin widget               -          ✓ Shows message
                   receives
T9                 Admin types reply          -          Local state
T11   Admin sends  POST /api/admin/...       ✓          Broadcast event
T12                Supabase event             -          Channel receives
T13                User widget                -          ✓ Shows reply
                   receives
T15                User reads message         Queued     (Optional: Mark as read)
```

---

## Error Handling

### If MongoDB is Down
```
API returns 500
Supabase broadcast fails gracefully
UI shows: "Failed to send message"
Can retry after
```

### If Supabase is Down
```
Message saves to MongoDB ✓ (persistent!)
Supabase broadcast fails (logged but not blocking)
Real-time doesn't work temporarily
But data is safe in MongoDB
When Supabase recovers, new messages broadcast fine
```

### If Network is Down
```
Client-side error before API call
"Check your connection"
Message not sent (stays in input)
Can retry when online
```

---

## Scaling Considerations

### Small Scale (Your Starting Point)
- 1-10 users
- <100 messages/day
- ✅ Completely free
- ✅ MongoDB Atlas free tier (512MB)
- ✅ Supabase free tier (1M messages/month)

### Medium Scale (Growth)
- 100-1000 users
- 1000+ messages/day
- 💰 MongoDB: ~$10-50/month
- 💰 Supabase: Free tier still works
- ⚠️ Consider indexed searches

### Large Scale (Production)
- 10K+ users
- 100K+ messages/day
- 💰 MongoDB: $50-500+/month (enterprise)
- 💰 Supabase Pro: $25/month
- 🔧 Consider sharding, caching

---

## Security Considerations

### Current Implementation
```
✅ NextAuth for user authentication
✅ Admin cookie validation on routes
✅ MongoDB stores hashed passwords (bcryptjs)
✅ Supabase anon key (read-only for broadcast)
```

### Future Improvements
```
- Rate limiting on message endpoints
- Message encryption in transit
- User permissions (who can see what conversations)
- Admin audit logs
- GDPR compliance (data deletion)
```

---

## Testing Real-Time

### Manual Testing
```
1. Open two browser windows
2. Window 1: User chat
3. Window 2: Admin dashboard
4. User sends message → appears instantly in Window 2
5. Admin replies → appears instantly in Window 1
```

### Load Testing
```
Use Supabase dashboard to monitor:
- Active connections
- Messages per second
- Network bandwidth
- Database operations
```

### Debugging
```
// In browser console:
window.NEXT_PUBLIC_SUPABASE_URL     // Check key
window.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check logs:
api/chat/messages - [Chat] message sent
api/admin/... - [Admin Chat] message sent
```

---

## Cost Breakdown (Monthly)

### Free Tier
- MongoDB Atlas: Free (512MB)
- Supabase: Free (1M messages)
- Vercel: Free (12 serverless functions)
- **Total: $0/month** ✨ (Perfect for MVP!)

### Starter Tier ($30)
- MongoDB Atlas: $10 (10GB)
- Supabase Pro: $25 (unlimited messages)
- Vercel Pro: $20 (but often free for indie)
- **Total: ~$30-50/month**

---

## Production Deployment (Vercel)

```
1. Push code to GitHub
2. Connect Vercel to repo
3. Add environment variables:
   - MONGODB_URI
   - NEXTAUTH_SECRET
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy
5. ✅ Real-time works instantly!
```

**No server to manage. No WebSocket issues. Just works!** 🚀

---

## Quick Reference

| Component | Tech | Purpose |
|-----------|------|---------|
| Frontend | Next.js 16 (React 19) | UI |
| Auth | NextAuth | User login |
| Database | MongoDB | Persistent storage |
| Real-Time | Supabase Realtime | WebSocket broadcast |
| Hosting | Vercel | Deploy frontend |
| Email | Nodemailer | Send emails |
| Payments | Stripe/Paystack | Payment processing |

---

## Architecture Evolution

```
Phase 1 (Current):           Phase 2 (Next):           Phase 3 (Future):
────────────────             ──────────────            ────────────────
MongoDB             +        File Storage     +        Dedicated Support Team
Supabase Realtime   +        Full-text Search +        Advanced Analytics
NextAuth            +        Message Threading         Video Chat Integration
                             Typing Indicators
```

---

**This architecture is production-ready and scales beautifully! 🚀**
