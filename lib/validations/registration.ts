import { z } from 'zod';

// Step 1: Personal Information
export const PersonalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
  branchId: z.string().min(1, 'Please select a branch'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Step 2: Contact Information
export const ContactInfoSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format'),
});

// Step 3: Emergency Contact
export const EmergencyContactSchema = z.object({
  name: z.string().min(2, 'Emergency contact name is required'),
  phone: z
    .string()
    .min(10, 'Emergency contact phone is required')
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format'),
  relationship: z.enum(['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'], {
    errorMap: () => ({ message: 'Please select a valid relationship' }),
  }),
});

// Steps 4 & 5: File Uploads
export const FileUploadSchema = z.object({
  passportUrl: z.string().optional().or(z.literal('')),
  signatureUrl: z.string().optional().or(z.literal('')),
});

// Complete Registration Schema
export const CompleteRegistrationSchema = PersonalInfoSchema.and(ContactInfoSchema).and(EmergencyContactSchema).and(FileUploadSchema);

export type PersonalInfoFormData = z.infer<typeof PersonalInfoSchema>;
export type ContactInfoFormData = z.infer<typeof ContactInfoSchema>;
export type EmergencyContactFormData = z.infer<typeof EmergencyContactSchema>;
export type FileUploadFormData = z.infer<typeof FileUploadSchema>;
export type CompleteRegistrationFormData = z.infer<typeof CompleteRegistrationSchema>;
