'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function LoginPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // Better error messages based on the error
        let errorMessage = result.error;
        if (result.error === 'Authentication failed') {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (result.error === 'No user found with this email') {
          errorMessage = 'No account found with this email address.';
        } else if (result.error === 'Your account has been deactivated') {
          errorMessage = 'Your account has been deactivated. Please contact support.';
        }
        
        setError(errorMessage);
        toast.error('Login Failed', {
          description: errorMessage,
        });
      } else if (result?.ok) {
        toast.success('Login Successful', {
          description: 'Welcome back to SpaceOut! Redirecting to your dashboard...',
        });
        router.push('/auth/loading');
      }
    } catch (err) {
      const errorMsg = 'An error occurred. Please try again.';
      setError(errorMsg);
      toast.error('An Error Occurred', {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-46 h-10 bg-gray-transparent rounded-full mb-4 relative">
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">User Login</p>
        </div>

        {/* Form Card */}
        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-200 text-center">{error}</p>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-8">
          © {new Date().getFullYear()} SpaceOut. All rights reserved.
        </p>
      </div>
    </div>
  );
}
