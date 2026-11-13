'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/file-upload';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, Upload, User, Mail, Phone, Briefcase, Shield, GraduationCap, Building2, FileText, Image as ImageIcon, MapPin, CreditCard, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  sex?: 'male' | 'female' | 'prefer-not-to-say';
  dateOfBirth?: string;
  houseAddress?: string;
  phone?: string;
  role?: string;
  branchId?: string;
  hasMembership?: boolean;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  membershipType?: 'annual' | 'monthly' | 'lifetime';
  membershipActivatedAt?: string;
  membershipExpiryDate?: string;
  membershipExpiry?: string;
  prepaidUntil?: string;
  passportUrl?: string;
  passportPhotoUrl?: string;
  signatureUrl?: string;
  isStudent?: boolean;
  educationalInfo?: {
    institution?: string;
    faculty?: string;
    courseOfStudy?: string;
    level?: string;
  };
  businessInfo?: {
    firmName?: string;
    businessDescription?: string;
    officeAddress?: string;
    officeHotline?: string;
    officeEmail?: string;
  };
  servicePreferences?: {
    loyaltyOption?: 'card' | 'no-card';
    bookingPreferences?: string[];
    usageDuration?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'bi-annual' | 'annual';
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  profileImage?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  documentsUploaded?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isUploadingPassport, setIsUploadingPassport] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '', email: '', firstName: '', lastName: '', name: '', sex: undefined,
    dateOfBirth: '', houseAddress: '', phone: '', role: '', branchId: '',
    hasMembership: false, membershipStatus: undefined, membershipType: undefined,
    membershipActivatedAt: '', membershipExpiryDate: '', membershipExpiry: '', prepaidUntil: '',
    passportUrl: '', passportPhotoUrl: '', signatureUrl: '', isStudent: false,
    educationalInfo: {}, businessInfo: {}, servicePreferences: {},
    emergencyContact: { name: '', phone: '', relationship: '' },
    profileImage: '', isActive: true, isEmailVerified: false, documentsUploaded: false,
    createdAt: '', updatedAt: '',
  });

  useEffect(() => { setIsMounted(true); fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) setProfile(await res.json());
    } catch { toast.error('Failed to Load Profile', { description: 'Unable to fetch your profile.' }); }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpload = (uploadedFile: any) => {
    try {
      setProfile((prev) => ({ ...prev, profileImage: uploadedFile.url }));
      toast.success('Profile Image Updated', { description: 'Your profile picture has been updated.' });
    } catch { toast.error('Upload Failed', { description: 'Failed to update profile image.' }); }
  };

  const handlePassportImageUpload = (uploadedFile: any) => {
    try {
      setProfile((prev) => ({ ...prev, passportUrl: uploadedFile.url }));
      toast.success('Passport Updated', { description: 'Your passport image has been updated.' });
    } catch { toast.error('Upload Failed', { description: 'Failed to update passport.' }); }
  };

  const handlePassportUpload = async (file: File) => {
    try {
      setIsUploadingPassport(true);
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
      const { url } = await res.json();
      setProfile((prev) => ({ ...prev, passportUrl: url, profileImage: url }));
      toast.success('Passport Uploaded', { description: 'Your passport has been uploaded.' });
    } catch (error: any) {
      toast.error('Upload Failed', { description: error.message || 'Failed to upload passport.' });
    } finally { setIsUploadingPassport(false); }
  };

  const handleSignatureUpload = async (file: File) => {
    try {
      setIsUploadingSignature(true);
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
      const { url } = await res.json();
      setProfile((prev) => ({ ...prev, signatureUrl: url }));
      toast.success('Signature Uploaded', { description: 'Your signature has been uploaded.' });
    } catch (error: any) {
      toast.error('Upload Failed', { description: error.message || 'Failed to upload signature.' });
    } finally { setIsUploadingSignature(false); }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName, lastName: profile.lastName, name: profile.name, sex: profile.sex,
          dateOfBirth: profile.dateOfBirth, houseAddress: profile.houseAddress, phone: profile.phone,
          passportUrl: profile.passportUrl, passportPhotoUrl: profile.passportPhotoUrl, signatureUrl: profile.signatureUrl,
          isStudent: profile.isStudent, educationalInfo: profile.educationalInfo, businessInfo: profile.businessInfo,
          servicePreferences: profile.servicePreferences, emergencyContact: profile.emergencyContact, profileImage: profile.profileImage,
        }),
      });
      if (res.ok) {
        toast.success('Profile Updated', { description: 'Your profile has been saved.' });
        setIsEditing(false);
      } else {
        const err = await res.json();
        toast.error('Failed to Save Profile', { description: err.message || 'Unable to save changes.' });
      }
    } catch (error: any) {
      toast.error('Failed to Save Profile', { description: error.message || 'An error occurred.' });
    } finally { setIsSaving(false); }
  };

  if (!isMounted) return null;
  if (status === 'loading') return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (status === 'unauthenticated') return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-3 py-3 max-w-[1400px] mx-auto">
      <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div><h3 className="font-semibold text-red-900 text-sm">Authentication Required</h3><p className="text-xs text-red-800">Please log in to view your profile.</p></div>
      </div>
    </motion.div>
  );

  const Field = ({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );

  const DisplayValue = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
    <p className={`text-[11px] break-words ${mono ? 'font-mono' : ''} ${children ? '' : 'text-muted-foreground'}`}>
      {children || '—'}
    </p>
  );

  return (
    <motion.div className="px-3 py-3 max-w-[1400px] mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">My Profile</h1>
          <p className="text-[10px] text-muted-foreground">Manage your account information</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={handleSaveProfile} disabled={isSaving || isUploadingPassport || isUploadingSignature}>
              {isSaving ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </motion.div>

      {/* Profile Picture */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : profile.passportUrl ? (
                <img src={profile.passportUrl} alt="Passport" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Your Name'}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 break-words">
                <Mail className="w-3 h-3 flex-shrink-0" /> <span className="break-words">{profile.email || 'email@example.com'}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">{profile.phone || 'No phone'}</p>
            </div>
            {isEditing && (
              <div className="ml-auto">
                <FileUpload
                  accept="image/*"
                  maxSize={2 * 1024 * 1024}
                  onUploadSuccess={handleProfileImageUpload}
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Personal & Account Info */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <h2 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Personal & Account
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Field icon={User} label="First Name">
              {isEditing ? (
                <Input value={profile.firstName || ''} onChange={e => handleInputChange('firstName', e.target.value)} className="h-7 mt-0.5 text-[11px]" />
              ) : (
                <DisplayValue>{profile.firstName}</DisplayValue>
              )}
            </Field>
            <Field icon={User} label="Last Name">
              {isEditing ? (
                <Input value={profile.lastName || ''} onChange={e => handleInputChange('lastName', e.target.value)} className="h-7 mt-0.5 text-[11px]" />
              ) : (
                <DisplayValue>{profile.lastName}</DisplayValue>
              )}
            </Field>
            <Field icon={Mail} label="Email">
              <DisplayValue mono>{profile.email}</DisplayValue>
            </Field>
            <Field icon={Phone} label="Phone">
              {isEditing ? (
                <Input value={profile.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} className="h-7 mt-0.5 text-[11px]" />
              ) : (
                <DisplayValue>{profile.phone}</DisplayValue>
              )}
            </Field>
            <Field icon={Building2} label="Role">
              <DisplayValue>{profile.role}</DisplayValue>
            </Field>
            <Field icon={Building2} label="Branch">
              <DisplayValue>{profile.branchId}</DisplayValue>
            </Field>
            <Field icon={MapPin} label="Address">
              {isEditing ? (
                <Input value={profile.houseAddress || ''} onChange={e => handleInputChange('houseAddress', e.target.value)} className="h-7 mt-0.5 text-[11px]" />
              ) : (
                <DisplayValue>{profile.houseAddress}</DisplayValue>
              )}
            </Field>
            <Field icon={Shield} label="Sex">
              {isEditing ? (
                <Select value={profile.sex || ''} onValueChange={val => handleInputChange('sex', val)}>
                  <SelectTrigger className="h-7 mt-0.5 text-[11px]"><SelectValue placeholder="Sex" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="prefer-not-to-say">N/A</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <DisplayValue>{profile.sex?.replace('-', ' ')}</DisplayValue>
              )}
            </Field>
            <Field icon={Calendar} label="DOB">
              <DisplayValue>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-NG') : ''}</DisplayValue>
            </Field>
            <Field icon={Shield} label="Active">
              <DisplayValue>{profile.isActive ? 'Yes' : 'No'}</DisplayValue>
            </Field>
            <Field icon={Shield} label="Email Verified">
              <DisplayValue>{profile.isEmailVerified ? 'Yes' : 'No'}</DisplayValue>
            </Field>
            <Field icon={FileText} label="Documents">
              <DisplayValue>{profile.documentsUploaded ? 'Yes' : 'No'}</DisplayValue>
            </Field>
          </div>
        </Card>
      </motion.div>

      {/* Membership & Access */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <h2 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Membership & Access
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Field icon={CreditCard} label="Status">
              <DisplayValue>{profile.membershipStatus || 'None'}</DisplayValue>
            </Field>
            <Field icon={CreditCard} label="Type">
              <DisplayValue>{profile.membershipType || '—'}</DisplayValue>
            </Field>
            <Field icon={Calendar} label="Activated">
              <DisplayValue>{profile.membershipActivatedAt ? new Date(profile.membershipActivatedAt).toLocaleDateString('en-NG') : ''}</DisplayValue>
            </Field>
            <Field icon={Calendar} label="Expires">
              <DisplayValue>{profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-NG') : profile.prepaidUntil ? new Date(profile.prepaidUntil).toLocaleDateString('en-NG') : '—'}</DisplayValue>
            </Field>
            <Field icon={Shield} label="Has Membership">
              <DisplayValue>{profile.hasMembership ? 'Yes' : 'No'}</DisplayValue>
            </Field>
          </div>
        </Card>
      </motion.div>

      {/* Education / Business */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <h2 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            {profile.isStudent ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
            {profile.isStudent ? 'Education' : 'Business'}
          </h2>
          {isEditing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {profile.isStudent ? (
                <>
                  <Field icon={Building2} label="Institution">
                    <Input value={profile.educationalInfo?.institution || ''} onChange={e => setProfile(p => ({ ...p, educationalInfo: { ...p.educationalInfo, institution: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={Building2} label="Faculty">
                    <Input value={profile.educationalInfo?.faculty || ''} onChange={e => setProfile(p => ({ ...p, educationalInfo: { ...p.educationalInfo, faculty: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={FileText} label="Course">
                    <Input value={profile.educationalInfo?.courseOfStudy || ''} onChange={e => setProfile(p => ({ ...p, educationalInfo: { ...p.educationalInfo, courseOfStudy: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={GraduationCap} label="Level">
                    <Select value={profile.educationalInfo?.level || ''} onValueChange={val => setProfile(p => ({ ...p, educationalInfo: { ...p.educationalInfo, level: val } }))}>
                      <SelectTrigger className="h-7 mt-0.5 text-[11px]"><SelectValue placeholder="Level" /></SelectTrigger>
                      <SelectContent>
                        {['100','200','300','400','500','600'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              ) : (
                <>
                  <Field icon={Building2} label="Firm">
                    <Input value={profile.businessInfo?.firmName || ''} onChange={e => setProfile(p => ({ ...p, businessInfo: { ...p.businessInfo, firmName: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={FileText} label="Description">
                    <Input value={profile.businessInfo?.businessDescription || ''} onChange={e => setProfile(p => ({ ...p, businessInfo: { ...p.businessInfo, businessDescription: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={MapPin} label="Office">
                    <Input value={profile.businessInfo?.officeAddress || ''} onChange={e => setProfile(p => ({ ...p, businessInfo: { ...p.businessInfo, officeAddress: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={Phone} label="Hotline">
                    <Input value={profile.businessInfo?.officeHotline || ''} onChange={e => setProfile(p => ({ ...p, businessInfo: { ...p.businessInfo, officeHotline: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                  <Field icon={Mail} label="Email">
                    <Input value={profile.businessInfo?.officeEmail || ''} onChange={e => setProfile(p => ({ ...p, businessInfo: { ...p.businessInfo, officeEmail: e.target.value } }))} className="h-7 mt-0.5 text-[11px]" />
                  </Field>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {profile.isStudent ? (
                <>
                  <Field icon={Building2} label="Institution"><DisplayValue>{profile.educationalInfo?.institution}</DisplayValue></Field>
                  <Field icon={Building2} label="Faculty"><DisplayValue>{profile.educationalInfo?.faculty}</DisplayValue></Field>
                  <Field icon={FileText} label="Course"><DisplayValue>{profile.educationalInfo?.courseOfStudy}</DisplayValue></Field>
                  <Field icon={GraduationCap} label="Level"><DisplayValue>{profile.educationalInfo?.level}</DisplayValue></Field>
                </>
              ) : (
                <>
                  <Field icon={Building2} label="Firm"><DisplayValue>{profile.businessInfo?.firmName}</DisplayValue></Field>
                  <Field icon={FileText} label="Description"><DisplayValue>{profile.businessInfo?.businessDescription}</DisplayValue></Field>
                  <Field icon={MapPin} label="Office"><DisplayValue>{profile.businessInfo?.officeAddress}</DisplayValue></Field>
                  <Field icon={Phone} label="Hotline"><DisplayValue>{profile.businessInfo?.officeHotline}</DisplayValue></Field>
                  <Field icon={Mail} label="Email"><DisplayValue>{profile.businessInfo?.officeEmail}</DisplayValue></Field>
                </>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <h2 className="text-xs font-semibold mb-2">Preferences</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Field icon={CreditCard} label="Loyalty">
              {isEditing ? (
                <Select value={profile.servicePreferences?.loyaltyOption || ''} onValueChange={val => setProfile(p => ({ ...p, servicePreferences: { ...p.servicePreferences, loyaltyOption: val as 'card' | 'no-card' } }))}>
                  <SelectTrigger className="h-7 mt-0.5 text-[11px]"><SelectValue placeholder="Loyalty" /></SelectTrigger>
                  <SelectContent><SelectItem value="card">Card</SelectItem><SelectItem value="no-card">No Card</SelectItem></SelectContent>
                </Select>
              ) : (
                <DisplayValue>{profile.servicePreferences?.loyaltyOption}</DisplayValue>
              )}
            </Field>
            <Field icon={Clock} label="Duration">
              {isEditing ? (
                <Select value={profile.servicePreferences?.usageDuration || ''} onValueChange={val => setProfile(p => ({ ...p, servicePreferences: { ...p.servicePreferences, usageDuration: val as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'bi-annual' | 'annual' } }))}>
                  <SelectTrigger className="h-7 mt-0.5 text-[11px]"><SelectValue placeholder="Duration" /></SelectTrigger>
                  <SelectContent>{['hourly','daily','weekly','monthly','quarterly','bi-annual','annual'].map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <DisplayValue>{profile.servicePreferences?.usageDuration}</DisplayValue>
              )}
            </Field>
            <Field icon={FileText} label="Bookings">
              {isEditing ? (
                <div className="flex flex-col gap-1 mt-0.5">
                  {['General Workspace', 'Office Setup', 'Conference Room'].map(opt => (
                    <label key={opt} className="flex items-center gap-1.5">
                      <Checkbox checked={profile.servicePreferences?.bookingPreferences?.includes(opt) || false} onCheckedChange={checked => setProfile(p => { const arr = p.servicePreferences?.bookingPreferences || []; return { ...p, servicePreferences: { ...p.servicePreferences, bookingPreferences: checked ? [...arr, opt] : arr.filter(o => o !== opt) } }; }) } disabled={!isEditing} />
                      <span className="text-[10px]">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <DisplayValue>{profile.servicePreferences?.bookingPreferences?.join(', ')}</DisplayValue>
              )}
            </Field>
          </div>
        </Card>
      </motion.div>

      {/* Emergency Contact */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <h2 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Emergency Contact
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {isEditing ? (
              <>
                <Field icon={User} label="Name">
                  <Input value={profile.emergencyContact?.name || ''} onChange={e => handleInputChange('emergencyContact', { ...profile.emergencyContact || {}, name: e.target.value })} className="h-7 mt-0.5 text-[11px]" placeholder="Name" />
                </Field>
                <Field icon={Phone} label="Phone">
                  <Input value={profile.emergencyContact?.phone || ''} onChange={e => handleInputChange('emergencyContact', { ...profile.emergencyContact || {}, phone: e.target.value })} className="h-7 mt-0.5 text-[11px]" placeholder="Phone" />
                </Field>
                <Field icon={Shield} label="Relationship">
                  <Select value={profile.emergencyContact?.relationship || ''} onValueChange={val => handleInputChange('emergencyContact', { ...profile.emergencyContact || {}, relationship: val })}>
                    <SelectTrigger className="h-7 mt-0.5 text-[11px]"><SelectValue placeholder="Relationship" /></SelectTrigger>
                    <SelectContent>
                      {['Spouse','Parent','Child','Sibling','Friend','Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : (
              <>
                <Field icon={User} label="Name"><DisplayValue>{profile.emergencyContact?.name}</DisplayValue></Field>
                <Field icon={Phone} label="Phone"><DisplayValue>{profile.emergencyContact?.phone}</DisplayValue></Field>
                <Field icon={Shield} label="Relationship"><DisplayValue>{profile.emergencyContact?.relationship}</DisplayValue></Field>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Verification Documents */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-3">
          <h2 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Verification Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><ImageIcon className="w-4 h-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-muted-foreground">Passport/ID</p>
                {profile.passportUrl ? (
                  <a href={profile.passportUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline truncate block">View Document</a>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No document</p>
                )}
              </div>
              {isEditing && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => { const input = document.createElement('input'); input.type='file'; input.accept='image/*,.pdf'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handlePassportUpload(f); }; input.click(); }} disabled={isUploadingPassport}>
                  {isUploadingPassport ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-muted-foreground">Signature</p>
                {profile.signatureUrl ? (
                  <a href={profile.signatureUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline truncate block">View Document</a>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No document</p>
                )}
              </div>
              {isEditing && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => { const input = document.createElement('input'); input.type='file'; input.accept='image/*,.pdf'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleSignatureUpload(f); }; input.click(); }} disabled={isUploadingSignature}>
                  {isUploadingSignature ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
