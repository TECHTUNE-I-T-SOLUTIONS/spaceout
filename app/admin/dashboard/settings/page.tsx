'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

  const userRole = (session?.user as any)?.role ?? adminProfile?.role;
  const isSuperAdmin = userRole === 'superadmin';
  const router = useRouter();
  
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    setIsMounted(true);
    fetchAdminProfile();
  }, []);

  // If NextAuth session is unauthenticated but admin cookie-based profile exists, allow access.
  useEffect(() => {
    if (status === 'unauthenticated' && !profileLoading && !adminProfile) {
      router.push('/admin/auth/login');
    }
  }, [status, profileLoading, adminProfile, router]);

  useEffect(() => {
    if (siteConfig && typeof siteConfig.maintenanceMessage !== 'undefined') {
      setMaintenanceMessage(siteConfig.maintenanceMessage || '');
    }
  }, [siteConfig]);

  const fetchAdminProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch('/api/auth/admin/me', { credentials: 'include' });
      if (response.ok) {
        const adminData = await response.json();
        setAdminProfile(adminData);
        setFormData({
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          // phone: adminData.phone || '',
        });
      } else if (response.status === 401) {
        router.push('/admin/auth/login');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast.error('Failed to load admin profile');
      router.push('/admin/auth/login');
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

      if (isSuperAdmin) await fetchSiteConfig();
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

    const fetchSiteConfig = async () => {
      try {
        setCfgLoading(true);
        const res = await fetch('/api/site-config', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setSiteConfig(json.config || { maintenanceMode: false });
        }
      } catch (e) {
        console.error('Failed to fetch site config', e);
      } finally {
        setCfgLoading(false);
      }
    };

    // When adminProfile becomes available and role is superadmin, load site config
    useEffect(() => {
      if (adminProfile?.role === 'superadmin') {
        fetchSiteConfig();
      }
    }, [adminProfile]);

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

  // Note: we redirect to login via effect when unauthenticated and no admin profile.

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-6 pb-12">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your admin profile and account details
        </p>
      </div>

      {/* Admin Profile - View Mode */}
      {!isEditing && adminProfile && (
        <Card className="p-6 border-l-4 border-l-primary mb-8">
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

      {/* Superadmin: Maintenance Toggle Card */}
      {!isEditing && isSuperAdmin && (
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Platform Maintenance</h3>
              <p className="text-sm text-muted-foreground">Enable or disable the site-wide maintenance banner.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Maintenance</span>
                <Switch
                  checked={!!siteConfig?.maintenanceMode}
                  onCheckedChange={(val) => {
                    setPendingToggle(Boolean(val));
                    setConfirmationText('');
                    setConfirmOpen(true);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {cfgLoading ? (
              'Loading...'
            ) : (
              <>
                <div className="mb-2">{siteConfig?.maintenanceMessage || 'No maintenance message set'}</div>
                <div>
                  <Label>Maintenance Message</Label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                    rows={3}
                    placeholder="Short message shown in the maintenance banner"
                    aria-label="Maintenance banner message"
                  />
                  <p className="text-sm text-muted-foreground mt-2">This message will display in the top banner when maintenance is enabled.</p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Dialog for Maintenance Toggle (moved outside edit area) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Maintenance Toggle</DialogTitle>
            <DialogDescription>
              This action will change the platform maintenance mode. To confirm you are the developer, type <strong>DEVELOPER</strong> below and click Confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Input placeholder="Type DEVELOPER to confirm" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} />
            <div className="mt-3">
              <Label>Message to show</Label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full mt-2 p-2 border rounded-md"
                rows={3}
                placeholder="Message that appears in the maintenance banner"
                aria-label="Maintenance banner message (confirm)"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingToggle(null); }}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (confirmationText !== 'DEVELOPER') {
                    toast.error('Confirmation text incorrect');
                    return;
                  }
                  setConfirmOpen(false);
                  try {
                    const res = await fetch('/api/site-config', {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ maintenanceMode: pendingToggle, maintenanceMessage: maintenanceMessage || null }),
                    });
                    if (!res.ok) throw new Error('Failed to update');
                    const json = await res.json();
                    setSiteConfig(json.config);
                    toast.success('Maintenance mode updated');
                  } catch (e) {
                    console.error('Failed to update maintenance', e);
                    toast.error('Failed to update maintenance mode');
                  } finally {
                    setPendingToggle(null);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        </div>

        {/* Confirmation Dialog for Maintenance Toggle (Super Admin Only) */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Maintenance Toggle</DialogTitle>
              <DialogDescription>
                This action will change the platform maintenance mode. To confirm you are the developer, type <strong>DEVELOPER</strong> below and click Confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Input placeholder="Type DEVELOPER to confirm" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} />
            </div>
            <DialogFooter>
              <div className="flex gap-2 justify-end w-full">
                <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingToggle(null); }}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (confirmationText !== 'DEVELOPER') {
                      toast.error('Confirmation text incorrect');
                      return;
                    }
                    setConfirmOpen(false);
                    try {
                      const res = await fetch('/api/site-config', {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ maintenanceMode: pendingToggle, maintenanceMessage: siteConfig?.maintenanceMessage || null }),
                      });
                      if (!res.ok) throw new Error('Failed to update');
                      const json = await res.json();
                      setSiteConfig(json.config);
                      toast.success('Maintenance mode updated');
                    } catch (e) {
                      console.error('Failed to update maintenance', e);
                      toast.error('Failed to update maintenance mode');
                    } finally {
                      setPendingToggle(null);
                    }
                  }}
                >
                  Confirm
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end gap-3 pt-6">
          <Button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                firstName: adminProfile.firstName,
                lastName: adminProfile.lastName,
                email: adminProfile.email,
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
