'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { FileUpload } from '@/components/file-upload';
import { Save, AlertCircle, Loader2, Mail, Shield, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  // phone?: string | null;
  profileImage?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  // phone: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    firstName: '',
    lastName: '',
    email: '',
    // phone: '',
  });

  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === 'superadmin';

  useEffect(() => {
    setIsMounted(true);
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch('/api/auth/admin/me');
      if (response.ok) {
        const adminData = await response.json();
        setAdminProfile(adminData);
        setFormData({
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          // phone: adminData.phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast.error('Failed to load admin profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const updatedData = await response.json();
      setAdminProfile(updatedData);
      setIsEditing(false);

      toast.success('Profile Updated', {
        description: 'Your profile has been saved successfully.',
      });
    } catch (error: any) {
      toast.error('Save Failed', {
        description: error.message || 'Failed to save profile.',
      });
    } finally {
      setIsLoading(false);
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
            <p className="text-sm text-red-800">Please log in to access settings.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your admin profile and account details
        </p>
      </div>

      {/* Admin Profile - View Mode */}
      {!isEditing && adminProfile && (
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold">Admin Profile</h2>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              Edit Profile
            </Button>
          </div>

          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> First Name
                </p>
                <p className="font-semibold text-lg">{adminProfile.firstName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Last Name
                </p>
                <p className="font-semibold text-lg">{adminProfile.lastName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="font-semibold text-lg">{adminProfile.email}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Role
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-semibold text-lg capitalize">{adminProfile.role}</p>
                  <Badge className={adminProfile.role === 'superadmin' ? 'bg-purple-500' : 'bg-blue-500'}>
                    {adminProfile.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${adminProfile.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="font-semibold text-lg">{adminProfile.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Verified
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${adminProfile.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <p className="font-semibold text-lg">{adminProfile.isEmailVerified ? 'Verified' : 'Not Verified'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Member Since
                </p>
                <p className="font-semibold text-lg">
                  {new Date(adminProfile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {adminProfile.lastLogin && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last Login
                  </p>
                  <p className="font-semibold text-lg">
                    {new Date(adminProfile.lastLogin).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Admin Profile - Edit Mode */}
      {isEditing && adminProfile && (
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold">Edit Admin Profile</h2>
            <Button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  firstName: adminProfile.firstName,
                  lastName: adminProfile.lastName,
                  email: adminProfile.email,
                  // phone: adminProfile.phone || '',
                });
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>

            {/* <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="mt-1"
              />
            </div> */}
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  firstName: adminProfile.firstName,
                  lastName: adminProfile.lastName,
                  email: adminProfile.email,
                  // phone: adminProfile.phone || '',
                });
              }}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
