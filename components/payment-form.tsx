'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface MembershipPlan {
  days: number;
  amount: number;
  label: string;
  savings?: number;
}

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    days: 30,
    amount: 5000,
    label: '1 Month',
  },
  {
    days: 90,
    amount: 13500,
    label: '3 Months',
    savings: 1500,
  },
  {
    days: 365,
    amount: 50000,
    label: '1 Year',
    savings: 10000,
  },
];

export default function PaymentForm() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(MEMBERSHIP_PLANS[0]);
  const [loading, setLoading] = useState(false);

  const handleInitiatePayment = async () => {
    if (!selectedPlan) {
      toast.error('Please select a membership plan');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentType: 'membership',
          amount: selectedPlan.amount,
          membershipDays: selectedPlan.days,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to initialize payment');
      }

      const data = await response.json();

      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error('Failed to get payment URL');
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Membership Plan</CardTitle>
          <CardDescription>
            Get unlimited access to all our services. Cancel anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MEMBERSHIP_PLANS.map((plan) => (
              <div
                key={plan.days}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlan?.days === plan.days
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-lg">{plan.label}</h3>
                <p className="text-3xl font-bold text-blue-600 my-2">
                  ₦{plan.amount.toLocaleString()}
                </p>
                {plan.savings && (
                  <p className="text-sm text-green-600 font-medium">
                    Save ₦{plan.savings.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  ₦{(plan.amount / plan.days).toFixed(2)}/day
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {selectedPlan && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Duration:</span>
                  <span className="font-semibold">{selectedPlan.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-lg">
                    ₦{selectedPlan.amount.toLocaleString()}
                  </span>
                </div>
                {selectedPlan.savings && (
                  <div className="flex justify-between text-green-600">
                    <span>You Save:</span>
                    <span className="font-semibold">
                      ₦{selectedPlan.savings.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* What's Included */}
          <div>
            <h4 className="font-semibold mb-3">Membership Benefits Include:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Unlimited access to all services</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Priority customer support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Exclusive member-only features</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Early access to new features</span>
              </li>
            </ul>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handleInitiatePayment}
            disabled={loading || !selectedPlan}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Continue to Payment - ₦${selectedPlan?.amount.toLocaleString()}`
            )}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-gray-500 text-center">
            🔒 Secure payment powered by Paystack. Your payment information is encrypted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
