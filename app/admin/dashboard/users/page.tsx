'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Eye, Mail, Send, ChevronRight, ChevronLeft, Check, Upload, EyeOff } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [createUserStep, setCreateUserStep] = useState(1);
  const [branches, setBranches] = useState<{ _id: string; name: string; location: string }[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserForm, setCreateUserForm] = useState({
    // Step 1: Basic Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    sex: '',
    dateOfBirth: '',
    houseAddress: '',
    
    // Step 2: Documents
    passportPhoto: null as File | null,
    signature: null as File | null,
    passportPhotoPreview: '',
    signaturePreview: '',
    
    // Step 3: Student Status
    isStudent: '',
    
    // Step 4: Educational or Business Info
    institution: '',
    faculty: '',
    courseOfStudy: '',
    level: '',
    firmName: '',
    businessDescription: '',
    officeAddress: '',
    officeHotline: '',
    officeEmail: '',
    
    // Step 5: Service Options
    loyaltyOption: '',
    bookingPreferences: [] as string[],
    
    // Step 6: Duration & Branch
    usageDuration: '',
    branchId: '',
    
    // Step 7: Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: 'Parent',
  });

  const totalCreateUserSteps = 7;

  const resetCreateUserForm = () => {
    setCreateUserForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      sex: '',
      dateOfBirth: '',
      houseAddress: '',
      passportPhoto: null,
      signature: null,
      passportPhotoPreview: '',
      signaturePreview: '',
      isStudent: '',
      institution: '',
      faculty: '',
      courseOfStudy: '',
      level: '',
      firmName: '',
      businessDescription: '',
      officeAddress: '',
      officeHotline: '',
      officeEmail: '',
      loyaltyOption: '',
      bookingPreferences: [],
      usageDuration: '',
      branchId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: 'Parent',
    });
    setCreateUserStep(1);
    setCreateUserError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'passport' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setCreateUserError('File size must be less than 10 MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        if (fileType === 'passport') {
          setCreateUserForm((prev) => ({ ...prev, passportPhoto: file, passportPhotoPreview: preview }));
        } else {
          setCreateUserForm((prev) => ({ ...prev, signature: file, signaturePreview: preview }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBookingPreferenceToggle = (preference: string) => {
    setCreateUserForm((prev) => ({
      ...prev,
      bookingPreferences: prev.bookingPreferences.includes(preference)
        ? prev.bookingPreferences.filter((p) => p !== preference)
        : [...prev.bookingPreferences, preference],
    }));
  };

  const validateCreateUserStep = () => {
    setCreateUserError('');
    
    if (createUserStep === 1) {
      if (!createUserForm.firstName.trim()) {
        setCreateUserError('First name is required');
        return false;
      }
      if (!createUserForm.lastName.trim()) {
        setCreateUserError('Last name is required');
        return false;
      }
      if (!createUserForm.sex) {
        setCreateUserError('Please select gender');
        return false;
      }
      if (!createUserForm.dateOfBirth) {
        setCreateUserError('Date of birth is required');
        return false;
      }
      if (!createUserForm.houseAddress.trim()) {
        setCreateUserError('House address is required');
        return false;
      }
      if (!createUserForm.phone.trim()) {
        setCreateUserError('Phone number is required');
        return false;
      }
      if (!createUserForm.email.trim()) {
        setCreateUserError('Email is required');
        return false;
      }
      if (!createUserForm.password) {
        setCreateUserError('Password is required');
        return false;
      }
      if (createUserForm.password.length < 6) {
        setCreateUserError('Password must be at least 6 characters');
        return false;
      }
      if (createUserForm.password !== createUserForm.confirmPassword) {
        setCreateUserError('Passwords do not match');
        return false;
      }
    }

    if (createUserStep === 2) {
      if (!createUserForm.passportPhoto) {
        setCreateUserError('Passport photograph is required');
        return false;
      }
      if (!createUserForm.signature) {
        setCreateUserError('Signature is required');
        return false;
      }
    }

    if (createUserStep === 3) {
      if (!createUserForm.isStudent) {
        setCreateUserError('Please indicate if you are a student');
        return false;
      }
    }

    if (createUserStep === 4) {
      if (createUserForm.isStudent === 'yes') {
        if (!createUserForm.institution.trim()) {
          setCreateUserError('Tertiary institution is required');
          return false;
        }
        if (!createUserForm.faculty.trim()) {
          setCreateUserError('Faculty is required');
          return false;
        }
        if (!createUserForm.courseOfStudy.trim()) {
          setCreateUserError('Course of study is required');
          return false;
        }
        if (!createUserForm.level.trim()) {
          setCreateUserError('Level is required');
          return false;
        }
      } else {
        if (!createUserForm.firmName.trim()) {
          setCreateUserError('Firm name is required');
          return false;
        }
        if (!createUserForm.businessDescription.trim()) {
          setCreateUserError('Business description is required');
          return false;
        }
        if (!createUserForm.officeAddress.trim()) {
          setCreateUserError('Office address is required');
          return false;
        }
        if (!createUserForm.officeHotline.trim()) {
          setCreateUserError('Office hotline is required');
          return false;
        }
        if (!createUserForm.officeEmail.trim()) {
          setCreateUserError('Office email is required');
          return false;
        }
      }
    }

    if (createUserStep === 5) {
      if (!createUserForm.loyaltyOption) {
        setCreateUserError('Please select loyalty option');
        return false;
      }
      if (createUserForm.bookingPreferences.length === 0) {
        setCreateUserError('Please select at least one booking preference');
        return false;
      }
    }

    if (createUserStep === 6) {
      if (!createUserForm.usageDuration) {
        setCreateUserError('Please select duration');
        return false;
      }
      if (!createUserForm.branchId) {
        setCreateUserError('Please select a branch');
        return false;
      }
    }

    if (createUserStep === 7) {
      if (!createUserForm.emergencyContactName.trim()) {
        setCreateUserError('Emergency contact name is required');
        return false;
      }
      if (!createUserForm.emergencyContactPhone.trim()) {
        setCreateUserError('Emergency contact phone is required');
        return false;
      }
      if (!createUserForm.emergencyContactRelationship.trim()) {
        setCreateUserError('Emergency contact relationship is required');
        return false;
      }
    }

    return true;
  };

  const handleCreateUserNext = () => {
    if (validateCreateUserStep()) {
      setCreateUserStep((prev) => prev + 1);
    }
  };

  const handleCreateUserPrevious = () => {
    setCreateUserStep((prev) => prev - 1);
    setCreateUserError('');
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setBranches([
        { _id: '1', name: 'Downtown Branch', location: 'San Francisco, CA' },
        { _id: '2', name: 'Uptown Branch', location: 'New York, NY' },
      ]);
    } finally {
      setIsLoadingBranches(false);
    }
  };

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
                setCreateUserError('');
                
                // Prepare the data for submission
                const submitData: any = {
                  firstName: createUserForm.firstName,
                  lastName: createUserForm.lastName,
                  email: createUserForm.email,
                  password: createUserForm.password,
                  phone: createUserForm.phone,
                  sex: createUserForm.sex,
                  dateOfBirth: createUserForm.dateOfBirth,
                  houseAddress: createUserForm.houseAddress,
                  passportPhotoUrl: createUserForm.passportPhotoPreview,
                  signatureUrl: createUserForm.signaturePreview,
                  isStudent: createUserForm.isStudent,
                  branchId: createUserForm.branchId,
                  emergencyContactName: createUserForm.emergencyContactName,
                  emergencyContactPhone: createUserForm.emergencyContactPhone,
                  emergencyContactRelationship: createUserForm.emergencyContactRelationship,
                };

                // Add educational info if student
                if (createUserForm.isStudent === 'yes') {
                  submitData.educationalInfo = {
                    institution: createUserForm.institution,
                    faculty: createUserForm.faculty,
                    courseOfStudy: createUserForm.courseOfStudy,
                    level: createUserForm.level,
                  };
                } else {
                  submitData.businessInfo = {
                    firmName: createUserForm.firmName,
                    businessDescription: createUserForm.businessDescription,
                    officeAddress: createUserForm.officeAddress,
                    officeHotline: createUserForm.officeHotline,
                    officeEmail: createUserForm.officeEmail,
                  };
                }

                // Add service preferences
                submitData.servicePreferences = {
                  loyaltyOption: createUserForm.loyaltyOption,
                  bookingPreferences: createUserForm.bookingPreferences,
                  usageDuration: createUserForm.usageDuration,
                };

                const response = await fetch('/api/admin/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(submitData),
                });

                if (response.ok) {
                  toast.success('User Created', {
                    description: `${createUserForm.firstName} ${createUserForm.lastName} has been created successfully.`,
                  });
                  resetCreateUserForm();
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
            {createUserError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-900 dark:text-red-100">{createUserError}</p>
              </div>
            )}

            {createUserStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
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
                  <Label>Sex *</Label>
                  <RadioGroup value={createUserForm.sex} onValueChange={(value) => setCreateUserForm((prev) => ({ ...prev, sex: value }))}>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prefer-not-to-say" id="prefer" />
                        <Label htmlFor="prefer" className="font-normal cursor-pointer">Prefer not to say</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">D.O.B *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={createUserForm.dateOfBirth}
                      onChange={(e) =>
                        setCreateUserForm({
                          ...createUserForm,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="houseAddress">House Address *</Label>
                  <Input
                    id="houseAddress"
                    value={createUserForm.houseAddress}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        houseAddress: e.target.value,
                      })
                    }
                    placeholder="123 Main Street, City"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Mobile No. *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={createUserForm.phone}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+234 800 000 0000"
                    className="mt-1"
                    required
                  />
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
                    placeholder="your@email.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={createUserForm.confirmPassword}
                      onChange={(e) =>
                        setCreateUserForm({
                          ...createUserForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      className="mt-1"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {createUserStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <div>
                  <Label>Passport Photograph *</Label>
                  <p className="text-sm text-muted-foreground mb-3">Upload 1 supported file: image. Max 10 MB.</p>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'passport')}
                      className="hidden"
                      id="passportInput"
                    />
                    <label htmlFor="passportInput" className="cursor-pointer block">
                      {createUserForm.passportPhotoPreview ? (
                        <img src={createUserForm.passportPhotoPreview} alt="Passport" className="h-32 w-32 object-cover rounded mx-auto" />
                      ) : (
                        <div>
                          <Upload className="mx-auto mb-2" size={32} />
                          <p>Click to upload passport photograph</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Signature *</Label>
                  <p className="text-sm text-muted-foreground mb-3">Upload 1 supported file: drawing or image. Max 10 MB.</p>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent cursor-pointer transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'signature')}
                      className="hidden"
                      id="signatureInput"
                    />
                    <label htmlFor="signatureInput" className="cursor-pointer block">
                      {createUserForm.signaturePreview ? (
                        <img src={createUserForm.signaturePreview} alt="Signature" className="h-32 w-32 object-cover rounded mx-auto" />
                      ) : (
                        <div>
                          <Upload className="mx-auto mb-2" size={32} />
                          <p>Click to upload signature</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {createUserStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Student Status</h3>
                  <div>
                    <Label>Are you a Student? *</Label>
                    <RadioGroup value={createUserForm.isStudent} onValueChange={(value) => setCreateUserForm((prev) => ({ ...prev, isStudent: value }))}>
                      <div className="flex items-center space-x-6 mt-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="student-yes" />
                          <Label htmlFor="student-yes" className="font-normal cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="student-no" />
                          <Label htmlFor="student-no" className="font-normal cursor-pointer">No</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </motion.div>
            )}

            {createUserStep === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-4">
                  {createUserForm.isStudent === 'yes' ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Educational Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="institution">Tertiary Institution *</Label>
                        <Input
                          id="institution"
                          value={createUserForm.institution}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              institution: e.target.value,
                            })
                          }
                          placeholder="University of Lagos"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="faculty">Faculty *</Label>
                        <Input
                          id="faculty"
                          value={createUserForm.faculty}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              faculty: e.target.value,
                            })
                          }
                          placeholder="Science"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="courseOfStudy">Course of Study *</Label>
                        <Input
                          id="courseOfStudy"
                          value={createUserForm.courseOfStudy}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              courseOfStudy: e.target.value,
                            })
                          }
                          placeholder="Computer Science"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="level">Level *</Label>
                        <Input
                          id="level"
                          value={createUserForm.level}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              level: e.target.value,
                            })
                          }
                          placeholder="200 Level"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firmName">Firm Name *</Label>
                        <Input
                          id="firmName"
                          value={createUserForm.firmName}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              firmName: e.target.value,
                            })
                          }
                          placeholder="Your Company Name"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessDescription">Business Description *</Label>
                        <textarea
                          id="businessDescription"
                          value={createUserForm.businessDescription}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              businessDescription: e.target.value,
                            })
                          }
                          placeholder="Describe your business"
                          className="w-full border rounded-md p-2 h-20 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="officeAddress">Office Address *</Label>
                        <Input
                          id="officeAddress"
                          value={createUserForm.officeAddress}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              officeAddress: e.target.value,
                            })
                          }
                          placeholder="123 Business Ave"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="officeHotline">Office Hotline *</Label>
                        <Input
                          id="officeHotline"
                          value={createUserForm.officeHotline}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              officeHotline: e.target.value,
                            })
                          }
                          placeholder="+234 800 000 0000"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="officeEmail">Office Email *</Label>
                        <Input
                          id="officeEmail"
                          type="email"
                          value={createUserForm.officeEmail}
                          onChange={(e) =>
                            setCreateUserForm({
                              ...createUserForm,
                              officeEmail: e.target.value,
                            })
                          }
                          placeholder="info@company.com"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {createUserStep === 5 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Service Options</h3>
                  <div>
                    <Label>Loyalty *</Label>
                  <RadioGroup value={createUserForm.loyaltyOption} onValueChange={(value) => setCreateUserForm((prev) => ({ ...prev, loyaltyOption: value }))}>
                    <div className="flex items-center space-x-6 mt-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="loyalty-card" />
                        <Label htmlFor="loyalty-card" className="font-normal cursor-pointer">Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-card" id="loyalty-no-card" />
                        <Label htmlFor="loyalty-no-card" className="font-normal cursor-pointer">No Card</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Bookings *</Label>
                  <div className="space-y-3 mt-3">
                    {['General Workspace', 'Office Setup', 'Conference Room', 'Special Offer', 'Content Creation'].map((booking) => (
                      <div key={booking} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={booking}
                          checked={createUserForm.bookingPreferences.includes(booking)}
                          onChange={() => handleBookingPreferenceToggle(booking)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={booking} className="font-normal cursor-pointer">
                          {booking}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {createUserStep === 6 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Workspace Duration & Branch</h3>
                  <div>
                    <Label htmlFor="usageDuration">Duration *</Label>
                  <Select value={createUserForm.usageDuration} onValueChange={(value) => setCreateUserForm((prev) => ({ ...prev, usageDuration: value }))}>
                    <SelectTrigger id="usageDuration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="bi-annual">Bi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="branchId">Select Branch *</Label>
                  <Select value={createUserForm.branchId} onValueChange={(value) => setCreateUserForm((prev) => ({ ...prev, branchId: value }))}>
                    <SelectTrigger id="branchId" disabled={isLoadingBranches}>
                      <SelectValue placeholder={isLoadingBranches ? 'Loading branches...' : 'Select a branch'} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.name} - {branch.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {createUserStep === 7 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  <div>
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={createUserForm.emergencyContactName}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        emergencyContactName: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={createUserForm.emergencyContactPhone}
                    onChange={(e) =>
                      setCreateUserForm({
                        ...createUserForm,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                    placeholder="+234 803 555 0590"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                  <Select value={createUserForm.emergencyContactRelationship} onValueChange={(value) => setCreateUserForm((prev) => ({ ...prev, emergencyContactRelationship: value }))}>
                    <SelectTrigger id="emergencyContactRelationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateUserModal(false)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                {createUserStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateUserStep((prev) => prev - 1)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </Button>
                )}
                {createUserStep < totalCreateUserSteps ? (
                  <Button
                    type="button"
                    onClick={() => setCreateUserStep((prev) => prev + 1)}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={18} />
                  </Button>
                ) : (
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
                        <Check size={16} />
                        Create User
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
