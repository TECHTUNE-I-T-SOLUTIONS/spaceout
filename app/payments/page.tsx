'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Gift } from 'lucide-react';
import { toast } from 'sonner';
import PaymentForm from '@/components/payment-form';

interface MembershipPlan {
  id: string;
  name: string;
  days: number;
  price: number;
  features: string[];
  icon: React.ReactNode;
  featured?: boolean;
}

const plans: MembershipPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    days: 30,
    price: 4999,
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Access to basic services',
      'Standard customer support',
      'Monthly billing',
      'Cancel anytime',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    days: 90,
    price: 12999,
    featured: true,
    icon: <Crown className="w-6 h-6" />,
    features: [
      'All Starter features',
      'Priority customer support',
      '3-month access',
      'Early access to new features',
      'Quarterly billing (save 13%)',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    days: 365,
    price: 39999,
    icon: <Gift className="w-6 h-6" />,
    features: [
      'All Pro features',
      '24/7 premium support',
      'Full year access',
      'Exclusive member events',
      'Annual billing (save 33%)',
      'Dedicated account manager',
    ],
  },
];

export default function PaymentsPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentForm(true);
  };

  const handlePaymentClose = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-600 mt-2">
            Choose the perfect plan for your needs and unlock premium features
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative transition-all duration-300 ${
                plan.featured ? 'md:scale-105 md:shadow-2xl' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular ⭐
                  </span>
                </div>
              )}

              <Card
                className={`h-full flex flex-col ${
                  plan.featured
                    ? 'border-2 border-yellow-400 bg-gradient-to-br from-white to-yellow-50'
                    : 'border border-gray-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        plan.featured
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {plan.icon}
                    </div>
                    {plan.featured && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                        SAVE 13%
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.days} days of premium access
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-gray-900">
                      ₦{(plan.price / 100).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">
                      One-time payment for {plan.days} days
                    </p>
                  </div>

                  {/* Daily Rate */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-blue-600">
                        ₦{Math.round(plan.price / plan.days / 100)}/day
                      </span>
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full mt-6 ${
                      plan.featured
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Get {plan.name}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I upgrade my plan?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade to a higher tier plan at any time. Contact support for details on pro-rata adjustments.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Currently, we don't offer a free trial, but our Starter plan provides excellent value at just ₦4,999 for 30 days.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major payment methods through Paystack, including debit cards, bank transfers, and mobile money.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel my membership?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel anytime. Refunds are provided on a pro-rata basis if you cancel before your membership expires.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens when my membership expires?
              </h3>
              <p className="text-gray-600">
                You'll receive reminders before expiration. Your access will be limited after expiration, but you can renew anytime.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="text-2xl">🔒</div>
              <div>
                <p className="font-semibold text-gray-900">Secure Payments</p>
                <p className="text-sm text-gray-600">Powered by Paystack</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="text-2xl">📞</div>
              <div>
                <p className="font-semibold text-gray-900">24/7 Support</p>
                <p className="text-sm text-gray-600">Always here to help</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="text-2xl">⚡</div>
              <div>
                <p className="font-semibold text-gray-900">Instant Access</p>
                <p className="text-sm text-gray-600">Start using immediately</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedPlan && (
        <PaymentForm
          planId={selectedPlan}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
}
