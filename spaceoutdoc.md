# PROJECT NAME:
SpaceOut Workspace Platform (Enterprise Multi-Branch Edition)

---

# CORE STACK

- Next.js 14+ (App Router)
- TypeScript
- MongoDB (Mongoose)
- NextAuth (JWT strategy)
- Cloudinary
- Paystack
- Tailwind CSS (Mobile First)
- Framer Motion (subtle)
- next-themes
- Zod
- React Hook Form

Deployment: Vercel

---

# SYSTEM ARCHITECTURE PRINCIPLES

- Multi-branch from Day 1
- Role-based admin hierarchy
- Flexible pricing engine
- Prepaid coverage logic
- Membership discount system
- Secure payment verification
- Analytics-ready database design
- Production-ready folder structure
- No AI-style decorative badges
- Clean architectural UI
- Mobile-first dashboard design

---

# NEXT.JS FOLDER STRUCTURE

/app
  layout.tsx
  globals.css
  not-found.tsx
  error.tsx

  /(public)
    page.tsx
    about/page.tsx
    pricing/page.tsx
    branches/page.tsx
    gallery/page.tsx
    reviews/page.tsx
    contact/page.tsx
    legal/privacy/page.tsx
    legal/terms/page.tsx
    legal/cookies/page.tsx

  /(auth-user)
    login/page.tsx
    register/page.tsx

  /(auth-admin)
    admin-login/page.tsx

  /(user)
    dashboard/page.tsx
    check-in/page.tsx
    check-out/page.tsx
    membership/page.tsx
    bookings/page.tsx
    payments/page.tsx
    reviews/page.tsx
    feedback/page.tsx
    profile/page.tsx

  /(admin)
    admin/layout.tsx
    admin/page.tsx
    admin/analytics/page.tsx
    admin/branches/page.tsx
    admin/services/page.tsx
    admin/pricing/page.tsx
    admin/users/page.tsx
    admin/admins/page.tsx
    admin/payments/page.tsx
    admin/bookings/page.tsx
    admin/gallery/page.tsx
    admin/reviews/page.tsx
    admin/feedback/page.tsx
    admin/error-logs/page.tsx
    admin/settings/page.tsx

  /api
    auth/[...nextauth]/route.ts
    auth/admin-login/route.ts
    branches/route.ts
    services/route.ts
    checkin/route.ts
    checkout/route.ts
    bookings/route.ts
    reviews/route.ts
    feedback/route.ts
    analytics/route.ts
    payments/initialize/route.ts
    payments/verify/route.ts
    webhook/paystack/route.ts
    upload/route.ts
    error-logs/route.ts

---

# MULTI-BRANCH MODEL

All core models must include:

branchId: ObjectId

SuperAdmin can:
- Create branches
- Activate/Deactivate branches

Users must select branch during registration.

---

# ADMIN ROLES

SuperAdmin:
- Full system access
- Manage branches
- Manage services
- Manage admins
- View analytics (all branches)
- Access error logs

Admin:
- Limited to assigned branch
- View analytics (branch only)
- Manage users
- View payments
- Manage bookings
- Approve reviews
- Cannot create branches
- Cannot delete core services

---

# REFINED SERVICES MODEL (BASED ON YOUR PRICE DOCUMENT)

Services must support:

- General Workspace
- Office/Meeting Room
- Conference Room
- Content Space
- Custom Future Services

---

## SERVICE MODEL

{
  name: String,
  branchId: ObjectId,
  category: "workspace" | "office" | "conference" | "content",
  description: String,
  isActive: Boolean,
  pricingPlans: [
    {
      planName: String, 
      planType: "day" | "night" | "24hr",
      durationLabel: "hourly" | "half-day" | "daily" | "weekly" | "monthly" | "yearly",
      durationInDays: Number (nullable),
      durationInHours: Number (nullable),
      isPerHead: Boolean,
      memberPrice: Number (nullable),
      nonMemberPrice: Number (nullable),
      flatPrice: Number (nullable),
      requiresMembershipCard: Boolean,
      accessCardFee: Number (nullable),
      notes: String (nullable)
    }
  ],
  createdAt: Date
}

---

# WHY NULLABLE FIELDS?

Because not all services:

- Have hourly pricing
- Have yearly plans
- Have member discounts
- Use per-head pricing
- Require access card fees

This structure allows flexible expansion without breaking schema.

---

# MEMBERSHIP SYSTEM

₦2,500 → Valid 1 year

Fields in User:

hasMembership: Boolean
membershipExpiry: Date

If expired:
- fallback to nonMemberPrice

---

# PREPAID COVERAGE LOGIC

User can pay for:

- Daily
- Weekly
- Monthly
- Yearly

When payment succeeds:

coverageEndDate = calculated based on duration

Update:

user.prepaidUntil

On check-in:

IF today <= prepaidUntil:
  allow access without payment
ELSE:
  require payment

Must be backend enforced.

---

# PAYMENTS MODEL

{
  userId: ObjectId,
  branchId: ObjectId,
  serviceId: ObjectId,
  type: "checkin" | "membership" | "booking" | "prepaid",
  amount: Number,
  planType: String,
  coverageEndDate: Date (nullable),
  paymentReference: String,
  status: "success" | "failed",
  createdAt: Date
}

---

# ANALYTICS PAGE (ADMIN)

Admin Analytics must include:

For selected branch (or all branches for superadmin):

- Total revenue (daily / weekly / monthly)
- Revenue per service
- Membership sales count
- Active users
- Active check-ins
- Top performing service
- Prepaid users count
- Booking statistics
- Review ratings average

Analytics API must aggregate using MongoDB aggregation pipelines.

---

# ANALYTICS MODEL LOGIC

Use:

- $match by branchId
- $group by serviceId
- $sum revenue
- $count users
- $avg ratings

Analytics must be dynamic and filterable by:

- Date range
- Branch
- Service

---

# REVIEWS SYSTEM

Users can:
- Leave rating (1–5)
- Leave comment

Admin must approve before public display.

Public /reviews page:
- Branch filter
- Display star rating
- Clean layout
- No AI-style decorative UI elements

---

# ERROR LOGGING

Central logger utility:

lib/logger.ts

All API errors must:
- Catch error
- Save to ErrorLog collection

Admin can view logs in:

/admin/error-logs

---

# SIDEBAR DESIGN RULES

Desktop:
- Collapsible
- Icon-only mode
- Active route indicator

Mobile:
- Slide-in drawer
- Overlay background
- Auto-close on navigation

Mobile-first responsive layout required.

---

# SECURITY RULES

- JWT authentication
- Role-based middleware
- Branch isolation
- Server-side price calculation
- Paystack webhook verification
- Zod validation
- Rate limiting
- Secure env variables

---

# UI DESIGN RULES

Fonts:
- Asimovian → Headings
- Geist → Body
- Pacifico → Logo only

No:
- AI hero badges
- Floating marketing chips
- Overused gradients
- Gimmicky UI

Keep it:
- Minimal
- Structured
- Architectural
- Premium

---

# FINAL OBJECTIVE

Generate a fully structured, enterprise-ready,
multi-branch, role-based workspace management system
with:

- Flexible pricing engine
- Prepaid access logic
- Membership discount system
- Secure payment system
- Analytics dashboard
- Reviews and feedback system
- Error logging system
- Admin hierarchy
- Mobile-first design
- Production-grade folder structure