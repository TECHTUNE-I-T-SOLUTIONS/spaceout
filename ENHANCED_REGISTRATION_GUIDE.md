# Enhanced Registration System & MongoDB Model Updates

## 📋 Overview

The SpaceOut platform now features an **enhanced multi-step registration flow** that captures comprehensive user information required for membership and check-ins.

---

## 🔄 Old vs New Registration

### Old Registration (Simple Form)
- Single page form
- Only: email, password, name, phone, branchId
- No file uploads
- Basic validation

### New Registration (Enhanced Multi-Step)
- 6-step animated form
- Complete user profile capture
- Passport & signature uploads to Cloudinary
- Emergency contact information
- Advanced validation with Zod
- Form progress tracking

---

## 📝 User Model Changes

### Previous User Schema
```typescript
{
  name: String,
  email: String,
  password: String,
  phone: String,
  role: "user",
  branchId: ObjectId,
  membership: Boolean,
  prepaidUntil: Date,
  profileImage: String,
  isActive: Boolean,
  ...
}
```

### Updated User Schema
```typescript
{
  firstName: String (required),
  lastName: String (required),
  name: String (required),
  email: String (required, unique),
  password: String (required),
  phone: String (required),
  role: "user" (default),
  branchId: ObjectId (required),
  
  // Membership
  hasMembership: Boolean (default: false),
  membershipExpiry: Date,
  prepaidUntil: Date,
  
  // Files (Cloudinary URLs)
  passportUrl: String,
  signatureUrl: String,
  profileImage: String,
  
  // Emergency Contact
  emergencyContact: {
    name: String (required),
    phone: String (required),
    relationship: Enum (Spouse, Parent, Child, Sibling, Friend, Other)
  },
  
  // Auth
  isActive: Boolean (default: true),
  isEmailVerified: Boolean (default: false),
  resetToken: String,
  resetTokenExpiry: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 New Files Created

### 1. **Validation Schema**
📁 `lib/validations/registration.ts`
- Zod schemas for each step
- Email, password, phone validation
- Field-level error messages

### 2. **Registration Form Component**
📁 `components/enhanced-registration-form.tsx`
- Multi-step form with Framer Motion animations
- Progress bar with step indicators
- Form context using React Hook Form
- File upload integration
- Review step before submission

### 3. **Enhanced Registration API**
📁 `app/api/auth/register-enhanced/route.ts`
- Validates all user fields
- Checks for duplicate emails
- Hashes password securely
- Creates user in MongoDB
- Returns user data (without password)

### 4. **Enhanced Registration Page**
📁 `app/auth/register-enhanced/page.tsx`
- Route to access the new form
- URL: `/auth/register-enhanced`

---

## 📂 MongoDB Model Modification (No Migration Needed!)

### Why MongoDB Models are Easy to Update

**MongoDB is schema-less**, meaning:
- ✅ You can add new fields to the Mongoose schema anytime
- ✅ Existing documents don't need migration
- ✅ Old documents will have `undefined` for new fields
- ✅ New documents will have all fields

### How We Updated the User Model

```bash
# Step 1: Update lib/models/User.ts (DONE ✅)
# - Added new fields to IUser interface
# - Added new fields to UserSchema
# - Set required/optional properties
# - Kept all existing fields

# Step 2: Use it immediately (DONE ✅)
# - No database migration needed
# - Old users can still log in
# - New users have full profile data
```

### If You Need to Add More Fields Later

Just update the model:

```typescript
// lib/models/User.ts

export interface IUser extends Document {
  email: string;
  // Add new field here:
  dateOfBirth?: Date;  // ← New field
  // ... rest of fields
}

const UserSchema = new Schema<IUser>(
  {
    email: { /* ... */ },
    // Add new field here:
    dateOfBirth: {
      type: Date,
      // optional if you don't require it
    },
    // ... rest of fields
  }
);
```

**That's it!** No migration script needed.

---

## 🔐 Security Features

1. **Password Hashing**: Uses bcrypt for secure password storage
2. **Email Validation**: Valid email format required
3. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
4. **File Uploads**: Via Cloudinary (not stored in MongoDB)
5. **Emergency Contact**: Validated relationships only

---

## 📱 Registration Steps Breakdown

### Step 1: Personal Information
- First Name
- Last Name
- Email
- Branch Selection
- Password
- Confirm Password

### Step 2: Contact Information
- Phone Number

### Step 3: Emergency Contact
- Name
- Phone Number
- Relationship

### Step 4: Upload Passport/ID
- File upload to Cloudinary
- Stored as `passportUrl`

### Step 5: Upload Signature
- File upload to Cloudinary
- Stored as `signatureUrl`

### Step 6: Review & Confirm
- Shows all entered information
- Requires both files uploaded
- Terms & Privacy Policy agreement

---

## 🔌 API Endpoints

### Old Registration (Still Works)
```
POST /api/auth/register
Body: {
  email: string,
  password: string,
  name: string,
  phone: string,
  branchId: string
}
```

### New Enhanced Registration
```
POST /api/auth/register-enhanced
Body: {
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone: string,
  branchId: string,
  emergencyContact: {
    name: string,
    phone: string,
    relationship: string
  },
  passportUrl: string,
  signatureUrl: string
}
```

---

## 🎯 Usage

### Navigate to New Registration Form
```
/auth/register-enhanced
```

### Access User Data in API Routes
```typescript
import User from '@/lib/models/User';

const user = await User.findById(userId);
console.log(user.emergencyContact.name);
console.log(user.passportUrl);
console.log(user.membershipExpiry);
```

### Update User Profile
```typescript
const updated = await User.findByIdAndUpdate(
  userId,
  {
    hasMembership: true,
    membershipExpiry: new Date('2025-03-03'),
  },
  { new: true }
);
```

---

## ✅ What's Working

- ✅ 6-step animated form with progress tracking
- ✅ Form validation with Zod
- ✅ Cloudinary file uploads (passport & signature)
- ✅ Emergency contact information
- ✅ Enhanced User model in MongoDB
- ✅ Registration API with validation
- ✅ Password hashing & security

---

## ⚠️ Notes

1. **Old & New Registration Coexist**: Both endpoints work independently
2. **No Database Migration**: MongoDB handles schema updates automatically
3. **File Uploads Required**: Passport and signature are mandatory
4. **Branch Required**: Users must select a branch during signup
5. **Email Uniqueness**: Email is unique across all users

---

## 🔄 Next Steps

1. Test the enhanced registration at `/auth/register-enhanced`
2. Verify Cloudinary uploads work
3. Check MongoDB has correct user document structure
4. Update home page links to point to new registration form
5. Implement payment verification flow (Paystack integration)
6. Add membership activation after payment

---

## 💡 MongoDB Model Expansion Tips

When adding new fields to MongoDB models:

```typescript
// lib/models/YourModel.ts

export interface IYourModel extends Document {
  // Add new field
  newField: string;  
  // Array field
  newArray: string[];
  // Nested object
  nestedData: {
    key: string;
    value: number;
  };
  // Optional field
  optionalField?: Date;
}

const YourSchema = new Schema<IYourModel>({
  newField: {
    type: String,
    required: true,  // or false for optional
    default: 'value', // optional default
  },
  newArray: [String],
  nestedData: {
    key: String,
    value: Number,
  },
  optionalField: Date,
});

export default mongoose.models.YourModel || 
  mongoose.model<IYourModel>('YourModel', YourSchema);
```

**No migration needed – it just works!** 🎉

---

## 📞 Support

For questions about:
- **Registration flow**: Check the form component (`components/enhanced-registration-form.tsx`)
- **Validation rules**: Check Zod schemas (`lib/validations/registration.ts`)
- **User model**: Check MongoDB schema (`lib/models/User.ts`)
- **API logic**: Check registration endpoint (`app/api/auth/register-enhanced/route.ts`)
