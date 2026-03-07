'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ChevronRight, ChevronLeft, Check, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface Branch {
  _id: string;
  name: string;
  location: string;
}

interface FormData {
  // Basic Information
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: string;
  houseAddress: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Documents
  passportPhoto: File | null;
  signature: File | null;

  // Student Status
  isStudent: string; // 'yes' or 'no'

  // Educational Info (if student)
  institution: string;
  faculty: string;
  courseOfStudy: string;
  level: string;

  // Business Info (if not student)
  firmName: string;
  businessDescription: string;
  officeAddress: string;
  officeHotline: string;
  officeEmail: string;

  // Service Options
  loyaltyOption: string; // 'card' or 'no-card'
  bookingPreferences: string[]; // Multiple selections
  usageDuration: string; // Duration selection

  // Branch
  branchId: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export function ComprehensiveSignupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    sex: '',
    dateOfBirth: '',
    houseAddress: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    passportPhoto: null,
    signature: null,
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
    emergencyContactRelationship: '',
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string>('');
  const [signaturePreview, setSignaturePreview] = useState<string>('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'passport' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10 MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        if (fileType === 'passport') {
          setFormData((prev) => ({ ...prev, passportPhoto: file }));
          setPassportPhotoPreview(preview);
        } else {
          setFormData((prev) => ({ ...prev, signature: file }));
          setSignaturePreview(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBookingPreferenceToggle = (preference: string) => {
    setFormData((prev) => ({
      ...prev,
      bookingPreferences: prev.bookingPreferences.includes(preference)
        ? prev.bookingPreferences.filter((p) => p !== preference)
        : [...prev.bookingPreferences, preference],
    }));
  };

  const validateStep = () => {
    setError('');

    if (currentStep === 1) {
      // Basic Information validation
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return false;
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required');
        return false;
      }
      if (!formData.sex) {
        setError('Please select gender');
        return false;
      }
      if (!formData.dateOfBirth) {
        setError('Date of birth is required');
        return false;
      }
      if (!formData.houseAddress.trim()) {
        setError('House address is required');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    if (currentStep === 2) {
      // Documents validation
      if (!formData.passportPhoto) {
        setError('Passport photograph is required');
        return false;
      }
      if (!formData.signature) {
        setError('Signature is required');
        return false;
      }
    }

    if (currentStep === 3) {
      // Student status must be selected
      if (!formData.isStudent) {
        setError('Please indicate if you are a student');
        return false;
      }
    }

    if (currentStep === 4) {
      // Educational or Business Info validation
      if (formData.isStudent === 'yes') {
        if (!formData.institution.trim()) {
          setError('Tertiary institution is required');
          return false;
        }
        if (!formData.faculty.trim()) {
          setError('Faculty is required');
          return false;
        }
        if (!formData.courseOfStudy.trim()) {
          setError('Course of study is required');
          return false;
        }
        if (!formData.level.trim()) {
          setError('Level is required');
          return false;
        }
      } else {
        if (!formData.firmName.trim()) {
          setError('Firm name is required');
          return false;
        }
        if (!formData.businessDescription.trim()) {
          setError('Business description is required');
          return false;
        }
        if (!formData.officeAddress.trim()) {
          setError('Office address is required');
          return false;
        }
        if (!formData.officeHotline.trim()) {
          setError('Office hotline is required');
          return false;
        }
        if (!formData.officeEmail.trim()) {
          setError('Office email is required');
          return false;
        }
      }
    }

    if (currentStep === 5) {
      // Service Options validation
      if (!formData.loyaltyOption) {
        setError('Please select loyalty option');
        return false;
      }
      if (formData.bookingPreferences.length === 0) {
        setError('Please select at least one booking preference');
        return false;
      }
    }

    if (currentStep === 6) {
      // Duration and branch validation
      if (!formData.usageDuration) {
        setError('Please select duration');
        return false;
      }
      if (!formData.branchId) {
        setError('Please select a branch');
        return false;
      }
    }

    if (currentStep === 7) {
      // Emergency contact validation
      if (!formData.emergencyContactName.trim()) {
        setError('Emergency contact name is required');
        return false;
      }
      if (!formData.emergencyContactPhone.trim()) {
        setError('Emergency contact phone is required');
        return false;
      }
      if (!formData.emergencyContactRelationship.trim()) {
        setError('Emergency contact relationship is required');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      setIsLoading(true);
      setError('');

      // Upload documents first
      const formDataUpload = new FormData();
      if (formData.passportPhoto) {
        formDataUpload.append('passport', formData.passportPhoto);
      }
      if (formData.signature) {
        formDataUpload.append('signature', formData.signature);
      }

      let passportUrl = '';
      let signatureUrl = '';

      if (formData.passportPhoto || formData.signature) {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload documents');
        }

        const uploadData = await uploadResponse.json();
        passportUrl = uploadData.passportUrl || '';
        signatureUrl = uploadData.signatureUrl || '';
      }

      // Register user
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
        houseAddress: formData.houseAddress,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        passportPhotoUrl: passportUrl,
        signatureUrl: signatureUrl,
        isStudent: formData.isStudent === 'yes',
        educationalInfo:
          formData.isStudent === 'yes'
            ? {
                institution: formData.institution,
                faculty: formData.faculty,
                courseOfStudy: formData.courseOfStudy,
                level: formData.level,
              }
            : undefined,
        businessInfo:
          formData.isStudent === 'no'
            ? {
                firmName: formData.firmName,
                businessDescription: formData.businessDescription,
                officeAddress: formData.officeAddress,
                officeHotline: formData.officeHotline,
                officeEmail: formData.officeEmail,
              }
            : undefined,
        servicePreferences: {
          loyaltyOption: formData.loyaltyOption,
          bookingPreferences: formData.bookingPreferences,
          usageDuration: formData.usageDuration,
        },
        branchId: formData.branchId,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      // Redirect to login
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Prince"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Techtune"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label>Sex *</Label>
                <RadioGroup value={formData.sex} onValueChange={(value) => setFormData((prev) => ({ ...prev, sex: value }))}>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-normal cursor-pointer">
                        Female
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-normal cursor-pointer">
                        Male
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="prefer-not-to-say" id="prefer" />
                      <Label htmlFor="prefer" className="font-normal cursor-pointer">
                        Prefer not to say
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">D.O.B *</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="houseAddress">House Address *</Label>
                <Input
                  id="houseAddress"
                  name="houseAddress"
                  value={formData.houseAddress}
                  onChange={handleChange}
                  placeholder="123 Main Street, City"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="phone">Mobile No. *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
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
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
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
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-6">Documents</h2>

            <div className="space-y-6">
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
                    disabled={isLoading}
                  />
                  <label htmlFor="passportInput" className="cursor-pointer block">
                    {passportPhotoPreview ? (
                      <img src={passportPhotoPreview} alt="Passport" className="h-32 w-32 object-cover rounded mx-auto" />
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
                    disabled={isLoading}
                  />
                  <label htmlFor="signatureInput" className="cursor-pointer block">
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Signature" className="h-32 w-32 object-cover rounded mx-auto" />
                    ) : (
                      <div>
                        <Upload className="mx-auto mb-2" size={32} />
                        <p>Click to upload signature</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-6">Student Status</h2>

            <div>
              <Label>Are you a Student? *</Label>
              <RadioGroup value={formData.isStudent} onValueChange={(value) => setFormData((prev) => ({ ...prev, isStudent: value }))}>
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="student-yes" />
                    <Label htmlFor="student-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="student-no" />
                    <Label htmlFor="student-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {formData.isStudent === 'yes' ? (
              <div>
                <h2 className="text-2xl font-bold mb-6">Educational Information</h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="institution">Tertiary Institution *</Label>
                    <Input
                      id="institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      placeholder="University of Lagos"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="faculty">Faculty *</Label>
                    <Input
                      id="faculty"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      placeholder="Science"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="courseOfStudy">Course of Study *</Label>
                    <Input
                      id="courseOfStudy"
                      name="courseOfStudy"
                      value={formData.courseOfStudy}
                      onChange={handleChange}
                      placeholder="Computer Science"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="level">Level *</Label>
                    <Input
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      placeholder="200 Level"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">Business Information</h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firmName">Firm Name *</Label>
                    <Input
                      id="firmName"
                      name="firmName"
                      value={formData.firmName}
                      onChange={handleChange}
                      placeholder="Your Company Name"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessDescription">Business Description *</Label>
                    <textarea
                      id="businessDescription"
                      name="businessDescription"
                      value={formData.businessDescription}
                      onChange={handleChange}
                      placeholder="Describe your business"
                      className="w-full border rounded-md p-2 h-20"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="officeAddress">Office Address *</Label>
                    <Input
                      id="officeAddress"
                      name="officeAddress"
                      value={formData.officeAddress}
                      onChange={handleChange}
                      placeholder="123 Business Ave"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="officeHotline">Office Hotline *</Label>
                    <Input
                      id="officeHotline"
                      name="officeHotline"
                      value={formData.officeHotline}
                      onChange={handleChange}
                      placeholder="+234 800 000 0000"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="officeEmail">Office Email *</Label>
                    <Input
                      id="officeEmail"
                      name="officeEmail"
                      type="email"
                      value={formData.officeEmail}
                      onChange={handleChange}
                      placeholder="info@company.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-6">Service Options</h2>

            <div className="space-y-6">
              <div>
                <Label>Loyalty *</Label>
                <RadioGroup value={formData.loyaltyOption} onValueChange={(value) => setFormData((prev) => ({ ...prev, loyaltyOption: value }))}>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="loyalty-card" />
                      <Label htmlFor="loyalty-card" className="font-normal cursor-pointer">
                        Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no-card" id="loyalty-no-card" />
                      <Label htmlFor="loyalty-no-card" className="font-normal cursor-pointer">
                        No Card
                      </Label>
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
                        checked={formData.bookingPreferences.includes(booking)}
                        onChange={() => handleBookingPreferenceToggle(booking)}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={booking} className="font-normal cursor-pointer">
                        {booking}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-6">Workspace Duration & Branch</h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="usageDuration">Duration *</Label>
                <Select value={formData.usageDuration} onValueChange={(value) => setFormData((prev) => ({ ...prev, usageDuration: value }))}>
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
                <Select value={formData.branchId} onValueChange={(value) => setFormData((prev) => ({ ...prev, branchId: value }))}>
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
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-6">Emergency Contact</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="+234 803 555 0590"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                <Select value={formData.emergencyContactRelationship} onValueChange={(value) => setFormData((prev) => ({ ...prev, emergencyContactRelationship: value }))}>
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
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-8 mt-8 mb-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </h3>
          <h3 className="text-sm font-medium text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</h3>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {error && <Alert className="mb-6 bg-red-50 border-red-200 text-red-900">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        {renderStep()}

        <div className="flex gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="ml-auto flex items-center gap-2"
            >
              Next
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading} className="ml-auto flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Complete Registration
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Sign in here
        </Link>
      </p>
    </Card>
  );
}
