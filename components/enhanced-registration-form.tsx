'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/file-upload';
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CompleteRegistrationSchema, CompleteRegistrationFormData } from '@/lib/validations/registration';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Branch {
  _id: string;
  name: string;
  location: string;
}

const formSteps = [
  { step: 1, title: 'Personal Info', description: 'Basic account information' },
  { step: 2, title: 'Contact Info', description: 'Your phone number' },
  { step: 3, title: 'Emergency Contact', description: 'In case of emergency' },
  { step: 4, title: 'Upload Passport', description: 'Identification document' },
  { step: 5, title: 'Upload Signature', description: 'Your digital signature' },
  { step: 6, title: 'Review', description: 'Confirm all details' },
];

export function EnhancedRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const methods = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(CompleteRegistrationSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
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

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await methods.trigger(['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'branchId']);
    } else if (currentStep === 2) {
      isValid = await methods.trigger(['phone']);
    } else if (currentStep === 3) {
      isValid = await methods.trigger(['emergencyContact.name', 'emergencyContact.phone', 'emergencyContact.relationship']);
    } else if (currentStep === 4 || currentStep === 5) {
      isValid = true;
    }

    if (isValid) {
      if (currentStep < formSteps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CompleteRegistrationFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/auth/register-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          branchId: data.branchId,
          emergencyContact: data.emergencyContact,
          passportUrl: data.passportUrl,
          signatureUrl: data.signatureUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      toast.success('Registration Successful!', {
        description: 'Welcome to SpaceOut. Redirecting to login...',
      });

      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 1500);
    } catch (error: any) {
      toast.error('Registration Failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {formSteps.map((item, idx) => (
              <div key={item.step} className="flex items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= item.step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  animate={{ scale: currentStep === item.step ? 1.2 : 1 }}
                >
                  {currentStep > item.step ? <Check size={20} /> : item.step}
                </motion.div>
                {idx < formSteps.length - 1 && (
                  <div
                    className={`h-1 w-12 mx-2 transition-colors ${
                      currentStep > item.step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step info */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {formSteps.length}
            </p>
            <h2 className="text-2xl font-bold mt-1">{formSteps[currentStep - 1].title}</h2>
            <p className="text-muted-foreground">{formSteps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Form Container */}
        <Card className="p-8">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Personal Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          {...methods.register('firstName')}
                          className="mt-1"
                        />
                        {methods.formState.errors.firstName && (
                          <p className="text-xs text-destructive mt-1">
                            {methods.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          {...methods.register('lastName')}
                          className="mt-1"
                        />
                        {methods.formState.errors.lastName && (
                          <p className="text-xs text-destructive mt-1">
                            {methods.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...methods.register('email')}
                        className="mt-1"
                      />
                      {methods.formState.errors.email && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branchId">Select Branch</Label>
                      <Select
                        value={methods.watch('branchId')}
                        onValueChange={(value) => methods.setValue('branchId', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose your branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingBranches ? (
                            <p className="p-2 text-sm">Loading branches...</p>
                          ) : (
                            branches.map((branch) => (
                              <SelectItem key={branch._id} value={branch._id}>
                                {branch.name} - {branch.location}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {methods.formState.errors.branchId && (
                        <p className="text-xs text-destructive">
                          {methods.formState.errors.branchId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...methods.register('password')}
                        className="mt-1"
                      />
                      {methods.formState.errors.password && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...methods.register('confirmPassword')}
                        className="mt-1"
                      />
                      {methods.formState.errors.confirmPassword && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Contact Info */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 (123) 456-7890"
                        {...methods.register('phone')}
                        className="mt-1"
                      />
                      {methods.formState.errors.phone && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Emergency Contact */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                      <Input
                        id="emergencyName"
                        placeholder="Jane Doe"
                        {...methods.register('emergencyContact.name')}
                        className="mt-1"
                      />
                      {methods.formState.errors.emergencyContact?.name && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.emergencyContact.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        placeholder="+234 (555) 123-4567"
                        {...methods.register('emergencyContact.phone')}
                        className="mt-1"
                      />
                      {methods.formState.errors.emergencyContact?.phone && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.emergencyContact.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="relationship">Relationship</Label>
                      <Select
                        value={methods.watch('emergencyContact.relationship')}
                        onValueChange={(value) => methods.setValue('emergencyContact.relationship', value as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'].map((rel) => (
                            <SelectItem key={rel} value={rel}>
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {methods.formState.errors.emergencyContact?.relationship && (
                        <p className="text-xs text-destructive mt-1">
                          {methods.formState.errors.emergencyContact.relationship.message}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Passport Upload */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <Label>Upload Passport/ID Document</Label>
                    <FileUpload
                      accept="image/*,.pdf"
                      maxSize={5 * 1024 * 1024}
                      onUploadSuccess={(file) => {
                        methods.setValue('passportUrl', file.url);
                        toast.success('Passport uploaded successfully');
                      }}
                    />
                    {methods.watch('passportUrl') && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">✓ Passport uploaded</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 5: Signature Upload */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <Label>Upload Your Signature</Label>
                    <FileUpload
                      accept="image/*,.pdf"
                      maxSize={5 * 1024 * 1024}
                      onUploadSuccess={(file) => {
                        methods.setValue('signatureUrl', file.url);
                        toast.success('Signature uploaded successfully');
                      }}
                    />
                    {methods.watch('signatureUrl') && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">✓ Signature uploaded</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">First Name</p>
                          <p className="font-semibold">{methods.watch('firstName')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Name</p>
                          <p className="font-semibold">{methods.watch('lastName')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-semibold text-sm">{methods.watch('email')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-semibold">{methods.watch('phone')}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Emergency Contact</p>
                          <p className="font-semibold">
                            {methods.watch('emergencyContact.name')} ({methods.watch('emergencyContact.relationship')})
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          {methods.watch('passportUrl') ? (
                            <>
                              <Check size={16} className="text-green-600" />
                              <span className="text-sm">Passport uploaded</span>
                            </>
                          ) : (
                            <span className="text-sm text-destructive">Passport required</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {methods.watch('signatureUrl') ? (
                            <>
                              <Check size={16} className="text-green-600" />
                              <span className="text-sm">Signature uploaded</span>
                            </>
                          ) : (
                            <span className="text-sm text-destructive">Signature required</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      By clicking "Create Account", you agree to our{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="flex gap-4 justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ArrowLeft size={16} />
                  Previous
                </Button>

                {currentStep < formSteps.length ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="gap-2"
                  >
                    Next
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !methods.watch('passportUrl') || !methods.watch('signatureUrl')}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Create Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
