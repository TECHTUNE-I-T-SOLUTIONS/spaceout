'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { FileUpload } from '@/components/file-upload';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsData {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    businessName: 'SpaceOut',
    businessEmail: 'admin@spaceout.com',
    businessPhone: '+1 (555) 000-0000',
    businessAddress: '123 Main St',
  });

  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === 'superadmin';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInputChange = (field: keyof SettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings Updated', {
        description: 'Your settings have been saved successfully.',
      });
    } catch (error: any) {
      toast.error('Save Failed', {
        description: error.message || 'Failed to save settings.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (field: 'logoUrl' | 'faviconUrl', file: any) => {
    setSettings((prev) => ({ ...prev, [field]: file.url }));
    toast.success('File Uploaded', {
      description: `${file.fileName} uploaded successfully.`,
    });
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
          {isSuperAdmin ? 'Manage system-wide configuration' : 'Manage your branch settings'}
        </p>
      </div>

      {/* Business Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">
          {isSuperAdmin ? 'System Settings' : 'Business Information'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Enter business name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="businessEmail">Email Address</Label>
            <Input
              id="businessEmail"
              type="email"
              value={settings.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              placeholder="admin@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="businessPhone">Phone Number</Label>
            <Input
              id="businessPhone"
              value={settings.businessPhone}
              onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="businessAddress">Address</Label>
            <Input
              id="businessAddress"
              value={settings.businessAddress}
              onChange={(e) => handleInputChange('businessAddress', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Branding */}
      {isSuperAdmin && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Branding</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-4 block">Logo</Label>
              <FileUpload
                accept="image/*"
                maxSize={2 * 1024 * 1024}
                onUploadSuccess={(file) => handleFileUpload('logoUrl', file)}
              />
              {settings.logoUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Current Logo:</p>
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="h-16 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="mb-4 block">Favicon</Label>
              <FileUpload
                accept="image/*"
                maxSize={1 * 1024 * 1024}
                onUploadSuccess={(file) => handleFileUpload('faviconUrl', file)}
              />
              {settings.faviconUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Current Favicon:</p>
                  <img
                    src={settings.faviconUrl}
                    alt="Favicon"
                    className="h-8 w-8 border rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Account Info */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Your Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{session?.user?.name || 'Admin'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium capitalize">{userRole || 'administrator'}</span>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSaveSettings}
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
              Save Settings
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
