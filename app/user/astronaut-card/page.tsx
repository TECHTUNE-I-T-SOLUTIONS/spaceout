'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { MembershipCard } from '@/components/membership-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle as AlertIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface UserSubscription {
  _id: string;
  serviceName: string;
  planName: string;
  expiryDate: string;
  status: string;
  isAccessCard?: boolean;
  purchaseDate?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  signatureUrl?: string;
  createdAt?: string;
}

export default function AstronautCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [membershipData, setMembershipData] = useState<UserSubscription | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      // Check for payment success/failure messages
      const successParam = searchParams.get('success');
      const message = searchParams.get('message');
      
      if (successParam === 'true') {
        setSuccess('Membership payment successful! Your card is now active.');
        // Clear the query params
        window.history.replaceState({}, '', '/user/astronaut-card');
      } else if (successParam === 'false') {
        setError(message || 'Payment failed. Please try again.');
        // Clear the query params
        window.history.replaceState({}, '', '/user/astronaut-card');
      }
      
      fetchMembershipData();
    }
  }, [status, router, searchParams]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Fetch user subscriptions
      const subscriptionsResponse = await fetch('/api/user/subscriptions');
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        const subscriptions = subscriptionsData.subscriptions || [];

        // Find active membership (can be access card or regular membership)
        // Prioritize non-access cards, but fall back to access cards
        let activeMembership = subscriptions.find(
          (sub: UserSubscription) =>
            sub.status === 'active' && !sub.isAccessCard
        );

        // If no regular membership, use the most recent active subscription (including access cards)
        if (!activeMembership) {
          activeMembership = subscriptions.find(
            (sub: UserSubscription) => sub.status === 'active'
          );
        }

        if (activeMembership) {
          setMembershipData(activeMembership);
        } else {
          setError('No active membership found. Please purchase a membership to view your card.');
        }
      } else {
        setError('Failed to fetch membership data.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching your data.');
      console.error('Error fetching membership data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <Link href="/user/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="mb-8">
            <Skeleton className="h-12 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link href="/user/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your Astronaut Card
          </h1>
          <p className="text-muted-foreground">
            Your exclusive membership card for SpaceOut experiences
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <Card className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-6 mb-8 animate-in fade-in">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-400 mb-1">Payment Successful!</h3>
                <p className="text-green-800 dark:text-green-300 text-sm">{success}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Content */}
        {error && !success ? (
          <Card className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-400 mb-1">No Active Membership</h3>
                <p className="text-red-800 dark:text-red-300 text-sm mb-4">{error}</p>
                <Link href="/user/dashboard">
                  <Button className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
                    Explore Membership Options
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : membershipData && userProfile ? (
          <>
            {/* Card Section */}
            <div className="bg-slate-800/40 dark:bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 md:p-8 mb-8">
              <MembershipCard
                userName={userProfile.name || 'SpaceOut Member'}
                membershipType={membershipData.planName}
                signature={userProfile.signatureUrl}
                membershipDate={membershipData.purchaseDate || new Date()}
              />
            </div>

            {/* Membership Info */}
            <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 transition-colors">
              <h2 className="text-lg font-semibold text-foreground mb-4">Membership Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Service</p>
                  <p className="text-foreground font-semibold">{membershipData.serviceName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Plan Type</p>
                  <p className="text-foreground font-semibold">{membershipData.planName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-foreground font-semibold capitalize">{membershipData.status}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Expires</p>
                  <p className="text-foreground font-semibold">
                    {new Date(membershipData.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>

          </>
        ) : null}
      </div>
    </div>
  );
}
