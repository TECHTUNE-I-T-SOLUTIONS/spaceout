'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MembershipCard } from '@/components/membership-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
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
  const [membershipData, setMembershipData] = useState<UserSubscription | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchMembershipData();
    }
  }, [status, router]);

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

        // Find active membership (not access card)
        const activeMembership = subscriptions.find(
          (sub: UserSubscription) =>
            sub.status === 'active' && !sub.isAccessCard
        );

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/user/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link href="/user/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            🧑‍🚀 Your Astronaut Card
          </h1>
          <p className="text-slate-400">
            Your exclusive membership card for SpaceOut experiences
          </p>
        </div>

        {/* Content */}
        {error ? (
          <Card className="bg-red-950/20 border-red-900/50 p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">No Active Membership</h3>
                <p className="text-red-300 text-sm mb-4">{error}</p>
                <Link href="/user/dashboard">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Explore Membership Options
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : membershipData && userProfile ? (
          <>
            {/* Card Section */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 mb-8">
              <MembershipCard
                userName={userProfile.name || 'SpaceOut Member'}
                membershipType={membershipData.planName}
                signature={userProfile.signatureUrl}
                membershipDate={membershipData.purchaseDate || new Date()}
              />
            </div>

            {/* Membership Info */}
            <Card className="bg-slate-800/40 border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Membership Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Service</p>
                  <p className="text-white font-semibold">{membershipData.serviceName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Plan Type</p>
                  <p className="text-white font-semibold">{membershipData.planName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <p className="text-white font-semibold capitalize">{membershipData.status}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Expires</p>
                  <p className="text-white font-semibold">
                    {new Date(membershipData.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="bg-cyan-950/20 border-cyan-900/50 p-6 mt-8">
              <h3 className="font-semibold text-cyan-400 mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li>✓ Use your card during check-in at any SpaceOut location</li>
                <li>✓ Keep your signature safe - it's shown on your card back</li>
                <li>✓ Hover over the card to flip and see your signature</li>
                <li>✓ Your membership will auto-renew before expiry</li>
              </ul>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
