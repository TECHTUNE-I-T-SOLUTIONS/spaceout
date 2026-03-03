'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

interface Branch {
  _id: string;
  name: string;
  location: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  branchId: string;
}

export default function RegisterPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    branchId: '',
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validation for each step
  const validateStep = (step: number) => {
    setError('');

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          setError('First name is required');
          return false;
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required');
          return false;
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Valid email is required');
          return false;
        }
        return true;

      case 2:
        if (!formData.password || formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        return true;

      case 3:
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
        return true;

      case 4:
        if (!formData.branchId) {
          setError('Please select a branch');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
        branchId: formData.branchId,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      // Registration successful, redirect to login
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const stepTitles = [
    'Personal Information',
    'Security & Contact',
    'Emergency Contact',
    'Location & Review',
  ];

  const stepDescription = [
    'Tell us your basic information',
    'Create a secure password and provide your contact number',
    'Add an emergency contact person',
    'Select your branch and review your details',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-44 h-14 flex items-center justify-center">
                  {mounted && theme === 'dark' ? (
                    <Image
                      src="/logo-dark.png"
                      alt="SpaceOut"
                      width={84}
                      height={84}
                      className="object-contain"
                    />
                  ) : (
                    <Image
                      src="/logo-light.png"
                      alt="SpaceOut"
                      width={84}
                      height={84}
                      className="object-contain"
                    />
                  )}
                </div>
                <h1 className="text-2xl font-bold">Create Account</h1>
              </div>

              {/* Step Indicator */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{stepTitles[currentStep - 1]}</h2>
                  <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stepDescription[currentStep - 1]}</p>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gray-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <Input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <Input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Password & Phone */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Emergency Contact */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Name</label>
                    <Input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Phone Number</label>
                    <Input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 987-6543"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship</label>
                    <Select value={formData.emergencyContactRelationship} onValueChange={(value) => handleSelectChange('emergencyContactRelationship', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Branch Selection & Review */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Your Branch</label>
                    <Select value={formData.branchId} onValueChange={(value) => handleSelectChange('branchId', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            <div>
                              <p className="font-medium">{branch.name}</p>
                              <p className="text-xs text-muted-foreground">{branch.location}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Review Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold mb-4">Review Your Information</h3>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium break-all">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{formData.phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Branch</p>
                        <p className="font-medium">
                          {branches.find(b => b._id === formData.branchId)?.name || 'Not selected'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{formData.emergencyContactName} ({formData.emergencyContactRelationship})</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </Button>
                )}

                {currentStep < totalSteps && (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    Next
                    <ChevronRight size={18} />
                  </Button>
                )}

                {currentStep === totalSteps && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Create Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gray-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

