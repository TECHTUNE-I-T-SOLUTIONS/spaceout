'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Eye, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  _id: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  address?: string;
  lastLogin?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  hasMembership?: boolean;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  membershipStatusRaw?: 'active' | 'inactive' | 'expired' | null;
  membershipNeedsRepair?: boolean;
  membershipType?: 'annual' | 'monthly' | 'lifetime';
  membershipActivatedAt?: string;
  membershipExpiryDate?: string;
  membershipExpiry?: string;
  branchId?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [repairingMembership, setRepairingMembership] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; userId: string | null }>({ show: false, userId: null });
  const [deleting, setDeleting] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    branchId: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: 'Parent',
    },
  });

  // Batch email states
  const [batchEmailSubject, setBatchEmailSubject] = useState('');
  const [batchEmailMessage, setBatchEmailMessage] = useState('');
  const [sendingBatchEmail, setSendingBatchEmail] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        // Map _id to id for easier usage
        const mappedUsers = data.map((user: any) => ({
          ...user,
          id: user._id,
        }));
        setUsers(mappedUsers);
        toast.success('Users Loaded', {
          description: `Fetched ${data.length} users successfully.`,
        });
      } else {
        toast.error('Failed to Load Users', {
          description: 'Unable to fetch user list.',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error', {
        description: 'Failed to load users.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteConfirmation({ show: true, userId });
  };

  const confirmDelete = async () => {
    const userId = deleteConfirmation.userId;
    if (!userId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId && user.id !== userId));
        toast.success('User Deleted', {
          description: 'User has been removed successfully.',
        });
        setShowDetailsModal(false);
      } else {
        toast.error('Failed to Delete User', {
          description: 'Unable to remove the user.',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error', {
        description: 'Failed to delete user.',
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmation({ show: false, userId: null });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailSubject.trim() || !emailBody.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in all fields.',
      });
      return;
    }

    try {
      setSendingEmail(true);
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailSubject,
          message: emailBody,
          userName: selectedUser.name,
        }),
      });

      if (response.ok) {
        toast.success('Email Sent', {
          description: `Email sent successfully to ${selectedUser.name}.`,
        });
        setEmailSubject('');
        setEmailBody('');
        setShowEmailModal(false);
      } else {
        toast.error('Failed to Send Email', {
          description: 'Unable to send email at this time.',
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error', {
        description: 'Failed to send email.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleActivateMembership = async () => {
    if (!selectedUser?.id && !selectedUser?._id) return;

    try {
      setRepairingMembership(true);
      const userId = selectedUser.id || selectedUser._id;
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipStatus: 'active' }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Unable to update membership status');
      }

      const result = await response.json();
      const updatedUser = result?.user || selectedUser;

      setSelectedUser(updatedUser);
      setUsers((current) =>
        current.map((user) =>
          (user.id === updatedUser.id || user._id === updatedUser._id)
            ? { ...user, ...updatedUser }
            : user
        )
      );

      toast.success('Membership activated', {
        description: 'The user membership status has been updated to active.',
      });
    } catch (error: any) {
      console.error('Error activating membership:', error);
      toast.error('Failed to activate membership', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setRepairingMembership(false);
    }
  };

  const handleSendBatchEmail = async () => {
    if (!batchEmailSubject.trim() || !batchEmailMessage.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in both subject and message.',
      });
      return;
    }

    if (users.length === 0) {
      toast.error('No Users', {
        description: 'There are no users to send emails to.',
      });
      return;
    }

    try {
      setSendingBatchEmail(true);
      const response = await fetch('/api/admin/send-batch-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: batchEmailSubject,
          message: batchEmailMessage,
          userIds: users.map(u => u._id || u.id),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Emails Sent', {
          description: `${result.count} emails sent to all users successfully.`,
        });
        setBatchEmailSubject('');
        setBatchEmailMessage('');
      } else {
        const error = await response.json();
        toast.error('Failed to Send Emails', {
          description: error.error || 'Unable to send emails at this time.',
        });
      }
    } catch (error) {
      console.error('Error sending batch emails:', error);
      toast.error('Error', {
        description: 'Failed to send emails.',
      });
    } finally {
      setSendingBatchEmail(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowCreateUserModal(true)}
        >
          <Plus size={18} />
          Add User
        </Button>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Eye size={16} />
            Users & Management
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail size={16} />
            Send Emails
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Users Found</h2>
          <p className="text-muted-foreground mb-6">
            Start by creating your first user account.
          </p>
          <Button>Create First User</Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View Details"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Send Email"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEmailModal(true);
                          }}
                        >
                          <Mail size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Delete"
                          onClick={() => handleDeleteUser(user.id || user._id)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
          )}
        </TabsContent>

        {/* Send Emails Tab */}
        <TabsContent value="emails" className="space-y-4">
          <Card className="p-6 space-y-6">
            {/* Email Sending Section */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Send Transactional Emails</h2>
                <p className="text-muted-foreground">
                  Send personalized emails to all users. The system will automatically add their name and signature.
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="batch-subject" className="text-base font-semibold">Email Subject *</Label>
                <Input
                  id="batch-subject"
                  placeholder="Enter email subject (e.g., 'Important: Service Update')"
                  value={batchEmailSubject}
                  onChange={(e) => setBatchEmailSubject(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="batch-message" className="text-base font-semibold">Message *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Note: Each recipient will receive a personalized email starting with "Dear [Name]," followed by your message.
                </p>
                <Textarea
                  id="batch-message"
                  placeholder="Enter your message here..."
                  value={batchEmailMessage}
                  onChange={(e) => setBatchEmailMessage(e.target.value)}
                  className="h-40 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Character count: {batchEmailMessage.length}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  📧 {users.length} email(s) will be sent immediately to all users
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchEmailSubject('');
                    setBatchEmailMessage('');
                  }}
                  disabled={sendingBatchEmail}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSendBatchEmail}
                  disabled={sendingBatchEmail || !batchEmailSubject.trim() || !batchEmailMessage.trim()}
                  className="flex items-center gap-2"
                >
                  {sendingBatchEmail ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Emails
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 pr-4">
              {/* Primary Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
                    <p className="text-base font-semibold mt-1">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</Label>
                    <p className="text-base font-semibold mt-1 break-all">{selectedUser.email}</p>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                    <p className="text-base font-semibold mt-1">{selectedUser.phone}</p>
                  </div>
                )}

                {selectedUser.address && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Address</Label>
                    <p className="text-base font-semibold mt-1 break-words">{selectedUser.address}</p>
                  </div>
                )}
              </div>

              {/* Account Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Role</Label>
                    <div className="mt-1">
                      <span className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm font-semibold capitalize inline-block">
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded text-sm font-semibold inline-block ${
                        selectedUser.isActive 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Information */}
              {selectedUser.emergencyContact && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Contact Name</Label>
                      <p className="text-base font-semibold mt-1">{selectedUser.emergencyContact.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Contact Phone</Label>
                      <p className="text-base font-semibold mt-1">{selectedUser.emergencyContact.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Relationship</Label>
                      <p className="text-base font-semibold mt-1 capitalize">{selectedUser.emergencyContact.relationship}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Membership Information */}
              {selectedUser.hasMembership !== undefined && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Membership Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded text-sm font-semibold inline-block ${
                          selectedUser.hasMembership
                            ? selectedUser.membershipStatus === 'active'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                              : selectedUser.membershipStatus === 'expired' || selectedUser.membershipStatus === 'inactive' || selectedUser.membershipStatus === 'Inactive'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                        }`}>
                          {selectedUser.hasMembership ? (selectedUser.membershipStatus ? selectedUser.membershipStatus.charAt(0).toUpperCase() + selectedUser.membershipStatus.slice(1) : 'Active') : 'No Membership'}
                        </span>
                      </div>
                    {selectedUser.hasMembership && (selectedUser.membershipNeedsRepair || selectedUser.membershipStatus !== 'active') && (
                      <div className="mt-3 flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">
                          This membership record is repairable. Mark it active to sync the user profile and access-card record.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={handleActivateMembership}
                          disabled={repairingMembership}
                        >
                          {repairingMembership ? 'Activating...' : 'Mark Membership Active'}
                        </Button>
                      </div>
                    )}
                    </div>
                    
                    {selectedUser.hasMembership && selectedUser.membershipType && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Membership Type</Label>
                        <p className="text-sm font-semibold mt-1 capitalize">
                          {selectedUser.membershipType}
                        </p>
                      </div>
                    )}
                    
                    {selectedUser.hasMembership && selectedUser.membershipActivatedAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Activated</Label>
                        <p className="text-sm font-semibold mt-1">
                          {new Date(selectedUser.membershipActivatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {selectedUser.hasMembership && selectedUser.membershipExpiryDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Expiry Date</Label>
                        <p className="text-sm font-semibold mt-1">
                          {new Date(selectedUser.membershipExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {selectedUser.hasMembership && !selectedUser.membershipExpiryDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Duration</Label>
                        <p className="text-sm font-semibold mt-1 text-green-600 dark:text-green-400">
                          Lifetime
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Account Created</Label>
                    <p className="text-sm font-semibold mt-1">
                      {new Date(selectedUser.createdAt).toLocaleDateString()} at {new Date(selectedUser.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {selectedUser.lastLogin && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Last Login</Label>
                      <p className="text-sm font-semibold mt-1">
                        {new Date(selectedUser.lastLogin).toLocaleDateString()} at {new Date(selectedUser.lastLogin).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-6 border-t">
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowEmailModal(true);
                  }}
                  className="flex items-center gap-2 flex-1"
                  variant="default"
                >
                  <Mail size={16} />
                  Send Email
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteUser(selectedUser.id || selectedUser._id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to User</DialogTitle>
            <DialogDescription>
              Send a direct message to {selectedUser?.name} at {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">ℹ️ Note:</span> This email will be sent from <span className="font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">spaces@spaceoutworkstation.com</span>
              </p>
            </div>

            {/* Recipient Info */}
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Recipient</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {selectedUser?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedUser?.name}</p>
                  <p className="text-xs text-muted-foreground break-all">{selectedUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Email Subject */}
            <div>
              <Label htmlFor="email-subject" className="font-semibold">Email Subject</Label>
              <Input
                id="email-subject"
                placeholder="e.g., Account Verification Required or Special Offer"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Make it clear and descriptive</p>
            </div>

            {/* Email Message */}
            <div>
              <Label htmlFor="email-body" className="font-semibold">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Type your message here... You can include important information, instructions, or promotional content."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="mt-2 h-40 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {emailBody.length}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailSubject('');
                  setEmailBody('');
                }}
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className="flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmation.show} onOpenChange={(open) => {
        if (!open) setDeleteConfirmation({ show: false, userId: null });
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Permanently delete user?
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  All associated data will be removed. This action is permanent.
                </p>
              </div>
            </div>

            {selectedUser && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">User to be deleted:</p>
                <div className="space-y-1">
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation({ show: false, userId: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user with all required information
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setCreatingUser(true);
                const response = await fetch('/api/admin/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(createUserForm),
                });

                if (response.ok) {
                  toast.success('User Created', {
                    description: `${createUserForm.firstName} ${createUserForm.lastName} has been created successfully.`,
                  });
                  setCreateUserForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    phone: '',
                    branchId: '',
                    emergencyContact: {
                      name: '',
                      phone: '',
                      relationship: 'Parent',
                    },
                  });
                  setShowCreateUserModal(false);
                  await fetchUsers();
                } else {
                  const error = await response.json();
                  toast.error('Failed to Create User', {
                    description: error.error || 'Unable to create user.',
                  });
                }
              } catch (error) {
                console.error('Error creating user:', error);
                toast.error('Error', {
                  description: 'Failed to create user.',
                });
              } finally {
                setCreatingUser(false);
              }
            }}
            className="space-y-4 pr-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={createUserForm.firstName}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      firstName: e.target.value,
                    })
                  }
                  placeholder="John"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={createUserForm.lastName}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      lastName: e.target.value,
                    })
                  }
                  placeholder="Doe"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={createUserForm.email}
                onChange={(e) =>
                  setCreateUserForm({
                    ...createUserForm,
                    email: e.target.value,
                  })
                }
                placeholder="john@example.com"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={createUserForm.password}
                onChange={(e) =>
                  setCreateUserForm({
                    ...createUserForm,
                    password: e.target.value,
                  })
                }
                placeholder="••••••••"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={createUserForm.phone}
                onChange={(e) =>
                  setCreateUserForm({
                    ...createUserForm,
                    phone: e.target.value,
                  })
                }
                placeholder="+234 (0) 809 988 5454"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="branchId">Branch ID *</Label>
              <Input
                id="branchId"
                value={createUserForm.branchId}
                onChange={(e) =>
                  setCreateUserForm({
                    ...createUserForm,
                    branchId: e.target.value,
                  })
                }
                placeholder="Branch ObjectId"
                className="mt-1"
                required
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-sm mb-3">Emergency Contact</h4>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <Label htmlFor="ecName">Contact Name *</Label>
                  <Input
                    id="ecName"
                    value={createUserForm.emergencyContact.name}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        emergencyContact: {
                          ...createUserForm.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="Jane Doe"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ecPhone">Contact Phone *</Label>
                  <Input
                    id="ecPhone"
                    value={createUserForm.emergencyContact.phone}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        emergencyContact: {
                          ...createUserForm.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    placeholder="+234 (0) 809 988 5454"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="relationship">Relationship *</Label>
                <select
                  id="relationship"
                  aria-label="Emergency contact relationship"
                  value={createUserForm.emergencyContact.relationship}
                  onChange={(e) =>
                    setCreateUserForm({
                      ...createUserForm,
                      emergencyContact: {
                        ...createUserForm.emergencyContact,
                        relationship: e.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  required
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateUserModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingUser}
                className="flex items-center gap-2"
              >
                {creatingUser ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
