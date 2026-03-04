'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/file-upload';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { Loader2, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  passportUrl?: string;
  signatureUrl?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  hasMembership?: boolean;
  membershipExpiry?: string;
  prepaidUntil?: string;
  isEmailVerified?: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isUploadingPassport, setIsUploadingPassport] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: '',
    passportUrl: '',
    signatureUrl: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    hasMembership: false,
    membershipExpiry: '',
    prepaidUntil: '',
    isEmailVerified: false,
  });

  useEffect(() => {
    setIsMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to Load Profile', {
        description: 'Unable to fetch your profile information.',
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpload = async (uploadedFile: any) => {
    try {
      // uploadedFile is already uploaded and has a url
      setProfile((prev) => ({
        ...prev,
        profileImage: uploadedFile.url,
      }));

      toast.success('Profile Image Updated', {
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error) {
      console.error('Profile image upload error:', error);
      toast.error('Upload Failed', {
        description: 'Failed to update profile image.',
      });
    }
  };

  const handlePassportImageUpload = async (uploadedFile: any) => {
    try {
      // uploadedFile is already uploaded and has a url
      setProfile((prev) => ({
        ...prev,
        passportUrl: uploadedFile.url,
      }));

      toast.success('Passport Updated', {
        description: 'Your passport image has been updated successfully.',
      });
    } catch (error) {
      console.error('Passport upload error:', error);
      toast.error('Upload Failed', {
        description: 'Failed to update passport image.',
      });
    }
  };

  const handlePassportUpload = async (file: File) => {
    try {
      setIsUploadingPassport(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadedFile = await response.json();

      setProfile((prev) => ({
        ...prev,
        passportUrl: uploadedFile.url,
        profileImage: uploadedFile.url,
      }));

      toast.success('Passport Uploaded', {
        description: 'Your passport has been uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Passport upload error:', error);
      toast.error('Upload Failed', {
        description: error.message || 'Failed to upload passport.',
      });
    } finally {
      setIsUploadingPassport(false);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    try {
      setIsUploadingSignature(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadedFile = await response.json();

      setProfile((prev) => ({
        ...prev,
        signatureUrl: uploadedFile.url,
      }));

      toast.success('Signature Uploaded', {
        description: 'Your signature has been uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Signature upload error:', error);
      toast.error('Upload Failed', {
        description: error.message || 'Failed to upload signature.',
      });
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          passportUrl: profile.passportUrl,
          signatureUrl: profile.signatureUrl,
          emergencyContact: profile.emergencyContact,
        }),
      });

      if (response.ok) {
        toast.success('Profile Updated', {
          description: 'Your profile has been saved successfully.',
        });
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        toast.error('Failed to Save Profile', {
          description: errorData.message || 'Unable to save profile changes.',
        });
      }
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast.error('Failed to Save Profile', {
        description: error.message || 'An error occurred while saving your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Authentication Required</h3>
            <p className="text-sm text-red-800">Please log in to view your profile.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      {/* Profile Picture */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
        <div className="flex flex-col items-center">
          {profile.passportUrl ? (
            <div className="mb-4">
              <img
                src={profile.passportUrl}
                alt="Passport"
                className="w-32 h-40 object-cover border-4 border-primary rounded"
              />
            </div>
          ) : profile.profileImage ? (
            <div className="mb-4">
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            </div>
          ) : (
            <div className="w-32 h-40 bg-muted flex items-center justify-center mb-4 rounded">
              <span className="text-muted-foreground text-4xl">📄</span>
            </div>
          )}
          {isEditing && (
            <div className="w-full max-w-xs">
              <p className="text-sm text-muted-foreground mb-2">Upload Passport Image</p>
              <FileUpload
                accept="image/*"
                maxSize={2 * 1024 * 1024}
                onUploadSuccess={handlePassportImageUpload}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={profile.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
                placeholder="Your first name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={profile.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
                placeholder="Your last name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                placeholder="Your email"
                className="mt-1 bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="+1 (555) 000-0000"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Emergency Contact</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="emergencyName">Contact Name</Label>
              <Input
                id="emergencyName"
                type="text"
                value={profile.emergencyContact?.name || ''}
                onChange={(e) => handleInputChange('emergencyContact', { ...profile.emergencyContact || {}, name: e.target.value, phone: profile.emergencyContact?.phone || '', relationship: profile.emergencyContact?.relationship || '' })}
                disabled={!isEditing}
                placeholder="Emergency contact name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emergencyPhone">Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={profile.emergencyContact?.phone || ''}
                onChange={(e) => handleInputChange('emergencyContact', { ...profile.emergencyContact || {}, name: profile.emergencyContact?.name || '', phone: e.target.value, relationship: profile.emergencyContact?.relationship || '' })}
                disabled={!isEditing}
                placeholder="Emergency contact phone"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emergencyRelationship">Relationship</Label>
              <Input
                id="emergencyRelationship"
                type="text"
                value={profile.emergencyContact?.relationship || ''}
                onChange={(e) => handleInputChange('emergencyContact', { ...profile.emergencyContact || {}, name: profile.emergencyContact?.name || '', phone: profile.emergencyContact?.phone || '', relationship: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., Parent, Spouse"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Membership & Prepaid */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Membership & Access</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profile.hasMembership || false}
                  disabled
                  className="rounded"
                />
                Active Membership
              </Label>
              {profile.hasMembership && (
                <p className="text-xs text-muted-foreground mt-2">
                  Expires: {profile.membershipExpiry ? new Date(profile.membershipExpiry).toLocaleDateString() : 'N/A'}
                </p>
              )}
            </div>

            <div>
              <Label>Prepaid Access Until</Label>
              <Input
                type="text"
                value={profile.prepaidUntil ? new Date(profile.prepaidUntil).toLocaleDateString() : 'Not active'}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Verification Files */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Verification Documents</h2>

        <div className="space-y-6">
          {/* Passport Upload */}
          <div>
            <Label htmlFor="passportUpload" className="mb-3 block">Passport/ID Document</Label>
            <div className="flex flex-col gap-4">
              {profile.passportUrl && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-2 font-medium">✓ Document Uploaded</p>
                  <a 
                    href={profile.passportUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary text-sm hover:underline"
                  >
                    View Passport
                  </a>
                </div>
              )}
              {isEditing && (
                <div className="relative">
                  <input
                    id="passportUpload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePassportUpload(file);
                    }}
                    disabled={isUploadingPassport}
                    className="hidden"
                  />
                  <label htmlFor="passportUpload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={isUploadingPassport}
                      asChild
                    >
                      <span>
                        {isUploadingPassport ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {profile.passportUrl ? 'Update Passport' : 'Upload Passport'}
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Signature Upload */}
          <div>
            <Label htmlFor="signatureUpload" className="mb-3 block">Signature Document</Label>
            <div className="flex flex-col gap-4">
              {profile.signatureUrl && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-2 font-medium">✓ Document Uploaded</p>
                  <a 
                    href={profile.signatureUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary text-sm hover:underline"
                  >
                    View Signature
                  </a>
                </div>
              )}
              {isEditing && (
                <div className="relative">
                  <input
                    id="signatureUpload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSignatureUpload(file);
                    }}
                    disabled={isUploadingSignature}
                    className="hidden"
                  />
                  <label htmlFor="signatureUpload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={isUploadingSignature}
                      asChild
                    >
                      <span>
                        {isUploadingSignature ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {profile.signatureUrl ? 'Update Signature' : 'Upload Signature'}
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving || isUploadingPassport || isUploadingSignature}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving || isUploadingPassport || isUploadingSignature} 
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>
    </motion.div>
  );
}
