# SpaceOut Pricing Fields - Final Debug & Fix

## The Real Problem 🔍

Non-WiFi pricing fields were being sent to the API (verified by 200 responses) but **Mongoose was not tracking the subdocument changes**, so the fields weren't being saved to MongoDB.

## Root Cause

When updating a Mongoose subdocument in an array, you must:
1. Modify the fields individually OR use specific Mongoose methods
2. Call `markModified('fieldName')` to tell Mongoose to track the change

**What Was Wrong:**
```typescript
// This doesn't always trigger Mongoose change tracking:
service.pricingPlans[planIndex] = updatedPlan;
await service.save();
```

**What's Fixed:**
```typescript
// Modify fields individually:
existingPlan.nonWifiPrice = planData.nonWifiPrice;
existingPlan.nonWifiPriceMember = planData.nonWifiPriceMember;
existingPlan.nonWifiPriceNonMember = planData.nonWifiPriceNonMember;

// Explicitly tell Mongoose this field changed:
service.markModified('pricingPlans');
await service.save();
```

## Changes Made

### 1. `/app/api/pricing/route.ts` (CREATE new pricing plans)

✅ Always include non-WiFi fields in the pricingPlan object:
```typescript
pricingPlan.nonWifiPrice = nonWifiPrice ? parseFloat(nonWifiPrice) : undefined;
pricingPlan.nonWifiPriceMember = nonWifiPriceMember ? parseFloat(nonWifiPriceMember) : undefined;
pricingPlan.nonWifiPriceNonMember = nonWifiPriceNonMember ? parseFloat(nonWifiPriceNonMember) : undefined;
```

✅ Mark array as modified before saving:
```typescript
service.markModified('pricingPlans');
await service.save();
```

✅ Added logging to track what's being saved:
```typescript
console.log('[POST /pricing] Saved pricing plan:', JSON.stringify(...));
```

### 2. `/app/api/services/[id]/pricing/route.ts` (UPDATE existing pricing plans)

✅ Update fields individually with explicit undefined checks:
```typescript
if (planData.nonWifiPrice !== undefined) existingPlan.nonWifiPrice = planData.nonWifiPrice;
if (planData.nonWifiPriceMember !== undefined) existingPlan.nonWifiPriceMember = planData.nonWifiPriceMember;
if (planData.nonWifiPriceNonMember !== undefined) existingPlan.nonWifiPriceNonMember = planData.nonWifiPriceNonMember;
```

✅ Mark array as modified:
```typescript
service.markModified('pricingPlans');
await service.save();
```

✅ Added logging to verify incoming and saved data:
```typescript
console.log('[PUT /pricing] Received planData:', JSON.stringify(planData, null, 2));
console.log('[PUT /pricing] Saved pricing plan:', JSON.stringify(...));
```

### 3. `/app/layout.tsx` (BONUS: Fixed ChatWidget hook error)

✅ Moved ChatWidget outside ClientOnlyWrapper to prevent hook count mismatch

## How to Test ✅

### Test Method 1: Create New Pricing Plan
1. Go to Admin Dashboard → Pricing Management
2. Click "Create New Plan"
3. Fill in all fields including:
   - Non-WiFi Member Price
   - Non-WiFi Non-Member Price
4. Click Save
5. **Check console logs** - you should see:
   ```
   [POST /pricing] Adding pricing plan: {...nonWifiPriceMember: 800, nonWifiPriceNonMember: 1200}
   [POST /pricing] Saved pricing plan: {...nonWifiPriceMember: 800, nonWifiPriceNonMember: 1200}
   ```
6. Check MongoDB Atlas - verify fields are present in the document

### Test Method 2: Update Existing Pricing Plan
1. Go to Admin Dashboard → Pricing Management
2. Click "Edit" on any existing plan
3. Add Non-WiFi Member and Non-Member prices
4. Click Save
5. **Check console logs** - you should see:
   ```
   [PUT /pricing] Received planData: {...nonWifiPriceMember: 800}
   [PUT /pricing] Saved pricing plan: {...nonWifiPriceMember: 800}
   ```
6. Check MongoDB Atlas - verify fields are in the updated document

### Test Method 3: View Public Pricing Page
1. Go to `/pricing` 
2. Scroll through pricing plans
3. You should see Non-WiFi Member and Non-Member rates displaying with green color

## Expected Output After Fix

**MongoDB Document:**
```json
{
  "pricingPlans": [
    {
      "planName": "Daily Rate",
      "memberPrice": 2000,
      "nonMemberPrice": 3000,
      "flatPrice": 3000,
      "nonWifiPrice": 2500,
      "nonWifiPriceMember": 800,      // ✓ NOW SAVES
      "nonWifiPriceNonMember": 1200   // ✓ NOW SAVES
    }
  ]
}
```

## Key Insight 💡

**Mongoose requires explicit change tracking for nested array modifications.**

When you update subdocument properties, Mongoose may not always detect the change automatically. Always call `markModified()` when:
- Updating array items (pricingPlans)
- Modifying nested objects
- Setting fields to undefined or null values

## Cleanup (when working properly)

Delete these temporary debugging files:
- `/app/api/test-pricing/route.ts`
- `/app/api/fix-pricing/route.ts` 
- `/app/fix-pricing/page.tsx`
- Remove console.log statements from API routes

## Files Modified Summary

| File | Changes | Status |
|------|---------|--------|
| `app/api/pricing/route.ts` | markModified + logging | ✅ |
| `app/api/services/[id]/pricing/route.ts` | Field-by-field updates + markModified + logging | ✅ |
| `app/layout.tsx` | ChatWidget positioning | ✅ |
| `lib/models/Service.ts` | Already fixed (explicit types + strict:false) | ✅ |

**This should finally solve the non-WiFi pricing persistence issue!** 🎉
