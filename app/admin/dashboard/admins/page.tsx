'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CreateAdminModal } from '@/components/modals/create-admin-modal';
import { Edit2, Trash2, Mail, Phone, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export default function AdminsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;

    try {
      const response = await fetch(`/api/admins/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Admin account deleted successfully');
        fetchAdmins();
      } else {
        toast.error('Failed to delete admin account');
      }
    } catch (error) {
      toast.error('Error deleting admin account');
    }
  };

  const getRoleColor = (role: string) => {
    if (role === 'superadmin') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'superadmin') {
      return <Shield className="w-3 h-3" />;
    }
    return <User className="w-3 h-3" />;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Admins</h1>
          <p className="text-muted-foreground mt-1">Create and manage admin accounts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Admin</Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading admin accounts...</p>
        </Card>
      ) : admins.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Admin Accounts Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first admin account to manage the system.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Admin</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin) => (
            <motion.div
              key={admin._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{admin.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getRoleColor(admin.role)}`}>
                        {getRoleIcon(admin.role)}
                        {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                      </div>
                      {admin.isEmailVerified && (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>

                  {admin.lastLogin && (
                    <div className="text-xs text-muted-foreground">
                      Last login: {new Date(admin.lastLogin).toLocaleDateString()}
                    </div>
                  )}

                  <div className={`text-xs px-2 py-1 rounded ${admin.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`}>
                    {admin.isActive ? '✓ Active' : '✕ Inactive'}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(admin._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateAdminModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchAdmins}
      />
    </motion.div>
  );
}
