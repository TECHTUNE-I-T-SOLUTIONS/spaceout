'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, Loader2, Zap, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface PricingPlan {
  planName: string;
  planType: string;
  durationLabel: string;
  durationInHours?: number;
  durationInDays?: number;
  flatPrice?: number;
  memberPrice?: number;
  nonMemberPrice?: number;
  nonWifiPrice?: number;
  nonWifiPriceMember?: number;
  nonWifiPriceNonMember?: number;
  isPerHead: boolean;
  requiresMembershipCard?: boolean;
  accessCardFee?: number;
}

interface Service {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  pricingPlans: PricingPlan[];
}

interface SelectedPlan {
  service: Service;
  plan: PricingPlan;
  selectedRate: 'flat' | 'member' | 'nonMember' | 'nonWifi' | 'nonWifiMember' | 'nonWifiNonMember';
  price: number;
  wifiIncluded: boolean;
  requiresMembership: boolean;
  membershipFee?: number;
  totalPrice: number;
}

export default function CheckInPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);


  // Check user's membership status
  useEffect(() => {
    const checkMembership = async () => {
      if (!session?.user?.email) {
        setCheckingMembership(false);
        return;
      }

      try {
        const response = await fetch('/api/users/membership-status');
        if (response.ok) {
          const data = await response.json();
          setUserMembership(data);
        }
      } catch (error) {
        console.error('Error checking membership:', error);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkMembership();
  }, [session]);

  // Load services and pricing plans
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/services?includeInactive=false');
        if (response.ok) {
          const data: Service[] = await response.json();
          // Filter services that have pricing plans
          const servicesWithPlans = data.filter(s => s.pricingPlans?.length > 0);
          setServices(servicesWithPlans);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return '₦' + price.toLocaleString();
  };

  const getAvailableRates = (plan: PricingPlan) => {
    const isMember = userMembership?.hasMembership;
    const rates = [];

    // MEMBER RATES (show to everyone, but with note for non-members)
    if (plan.memberPrice) {
      rates.push({
        type: 'member',
        label: 'Member Rate',
        price: plan.memberPrice,
        description: 'WiFi included',
        wifiIncluded: true,
        badge: isMember ? '⭐ Best' : '💳 Members Only',
        requiresMembership: !isMember,
      });
    }

    if (plan.nonWifiPriceMember) {
      rates.push({
        type: 'nonWifiMember',
        label: 'Non-WiFi Member',
        price: plan.nonWifiPriceMember,
        description: 'No WiFi access',
        wifiIncluded: false,
        badge: !isMember ? '💳 Members Only' : undefined,
        requiresMembership: !isMember,
      });
    }

    // NON-MEMBER RATES (always available)
    if (plan.nonMemberPrice) {
      rates.push({
        type: 'nonMember',
        label: 'Non-Member Rate',
        price: plan.nonMemberPrice,
        description: 'WiFi included',
        wifiIncluded: true,
      });
    }

    if (plan.flatPrice && plan.flatPrice !== plan.nonMemberPrice) {
      rates.push({
        type: 'flat',
        label: 'Standard Rate',
        price: plan.flatPrice,
        description: 'WiFi included',
        wifiIncluded: true,
      });
    }

    if (plan.nonWifiPrice) {
      rates.push({
        type: 'nonWifi',
        label: 'Non-WiFi Rate',
        price: plan.nonWifiPrice,
        description: 'No WiFi access',
        wifiIncluded: false,
      });
    }

    if (plan.nonWifiPriceNonMember && plan.nonWifiPriceNonMember !== plan.nonWifiPrice) {
      rates.push({
        type: 'nonWifiNonMember',
        label: 'Non-WiFi (Non-Member)',
        price: plan.nonWifiPriceNonMember,
        description: 'No WiFi access',
        wifiIncluded: false,
      });
    }

    return rates;
  };

  const handlePlanSelection = (
    service: Service,
    plan: PricingPlan,
    rateType: string,
    price: number,
    wifiIncluded: boolean,
    requiresMembership: boolean = false
  ) => {
    // If non-member selecting member rate, add membership fee
    let membershipFee = 0;
    if (requiresMembership && !userMembership?.hasMembership) {
      membershipFee = plan.accessCardFee || 0;
    }

    const totalPrice = price + membershipFee;

    setSelectedPlan({
      service,
      plan,
      selectedRate: rateType as any,
      price,
      wifiIncluded,
      requiresMembership: requiresMembership && !userMembership?.hasMembership,
      membershipFee,
      totalPrice,
    });
  };

  const handleCheckIn = async () => {
    if (!selectedPlan || !session?.user?.id) {
      toast.error('Please select a plan');
      return;
    }

    try {
      setIsProcessing(true);

      // Initialize payment with Paystack
      const response = await fetch('/api/payments/initialize-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(selectedPlan.totalPrice * 100), // Convert to kobo
          email: session.user.email,
          userId: session.user.id,
          serviceId: selectedPlan.service._id,
          serviceName: selectedPlan.service.name,
          planName: selectedPlan.plan.planName,
          planType: selectedPlan.plan.planType,
          durationLabel: selectedPlan.plan.durationLabel,
          durationInHours: selectedPlan.plan.durationInHours,
          durationInDays: selectedPlan.plan.durationInDays,
          selectedRate: selectedPlan.selectedRate,
          price: selectedPlan.price,
          wifiIncluded: selectedPlan.wifiIncluded,
          requiresMembership: selectedPlan.requiresMembership,
          membershipFee: selectedPlan.membershipFee,
          totalPrice: selectedPlan.totalPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await response.json();

      // Redirect to Paystack
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error: any) {
      toast.error('Payment Error', {
        description: error.message || 'Failed to process check-in',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to check in to a service.
          </p>
          <Button asChild>
            <a href="/auth/login">Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (checkingMembership || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Check In</h1>
        <p className="text-muted-foreground">
          Select a service and plan to check in
          {userMembership?.hasMembership && (
            <span className="ml-2 text-green-600 font-semibold">• ⭐ Member rates available (get better prices!)</span>
          )}
        </p>
      </motion.div>

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No services available at the moment</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {services.map((service) => (
            <motion.div key={service._id} variants={itemVariants}>
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-2">{service.name}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {service.description || service.category || 'Premium workspace'}
                </p>

                <div className="space-y-6">
                  {service.pricingPlans.map((plan, idx) => {
                    const availableRates = getAvailableRates(plan);

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-lg">{plan.planName}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4" />
                                {plan.durationLabel}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Type: {plan.planType}
                              </p>
                            </div>
                            {availableRates.length > 0 && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Starting from</p>
                                <p className="text-xl font-bold">
                                  {formatPrice(Math.min(...availableRates.map(r => r.price)))}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {availableRates.map((rate, rateIdx) => {
                              const membershipFee = rate.requiresMembership ? plan.accessCardFee || 0 : 0;
                              const displayPrice = rate.price + membershipFee;

                              return (
                                <motion.button
                                  key={rate.type}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: rateIdx * 0.05 }}
                                  onClick={() =>
                                    handlePlanSelection(
                                      service,
                                      plan,
                                      rate.type,
                                      rate.price,
                                      rate.wifiIncluded,
                                      rate.requiresMembership
                                    )
                                  }
                                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    selectedPlan?.service._id === service._id &&
                                    selectedPlan?.plan.planName === plan.planName &&
                                    selectedPlan?.selectedRate === rate.type
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-baseline gap-2">
                                        <p className="font-semibold text-sm">
                                          {formatPrice(displayPrice)}
                                        </p>
                                        {membershipFee > 0 && (
                                          <p className="text-xs text-amber-600">
                                            ({formatPrice(rate.price)} + {formatPrice(membershipFee)} fee)
                                          </p>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {rate.label}
                                      </p>
                                      {rate.description && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          {rate.wifiIncluded ? (
                                            <>
                                              <Wifi className="w-3 h-3" /> {rate.description}
                                            </>
                                          ) : (
                                            <>
                                              <WifiOff className="w-3 h-3" /> {rate.description}
                                            </>
                                          )}
                                        </p>
                                      )}
                                      {rate.requiresMembership && !userMembership?.hasMembership && (
                                        <p className="text-xs text-amber-600 font-semibold mt-1">
                                          + Get membership card
                                        </p>
                                      )}
                                    </div>
                                    {rate.badge && (
                                      <span
                                        className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                                          rate.badge.includes('⭐')
                                            ? 'text-green-600 bg-green-50 dark:bg-green-950'
                                            : 'text-amber-600 bg-amber-50 dark:bg-amber-950'
                                        }`}
                                      >
                                        {rate.badge}
                                      </span>
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>

                          {plan.accessCardFee && (
                            <p className="text-xs text-amber-600 italic">
                              *Access card fee: {formatPrice(plan.accessCardFee)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check In Confirmation</DialogTitle>
            <DialogDescription>
              Review your selection and proceed to payment
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-semibold text-base">{selectedPlan.service.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold text-base">{selectedPlan.plan.planName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold text-base">{selectedPlan.plan.durationLabel}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Plan Type:</span>
                  <span className="font-semibold capitalize">{selectedPlan.selectedRate}</span>
                  <span className="text-xs">
                    {selectedPlan.wifiIncluded ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> WiFi Included
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <WifiOff className="w-3 h-3" /> No WiFi
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 space-y-3">
                {selectedPlan.requiresMembership && selectedPlan.membershipFee ? (
                  <>
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Check-In Rate</p>
                      <p className="font-semibold">{formatPrice(selectedPlan.price)}</p>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <p className="text-sm text-amber-600 font-semibold">Membership Card Fee</p>
                      <p className="font-semibold text-amber-600">{formatPrice(selectedPlan.membershipFee)}</p>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total Amount</span>
                      <span className="text-primary">{formatPrice(selectedPlan.totalPrice)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(selectedPlan.totalPrice)}
                    </p>
                  </>
                )}
              </div>

              {!userMembership?.hasMembership &&
                selectedPlan.selectedRate.includes('Member') && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                      ✨ You'll get membership benefits!
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Your membership card fee is included in the total. After payment, you'll be able to use member rates on future check-ins.
                    </p>
                  </div>
                )}

              {selectedPlan.plan.accessCardFee && selectedPlan.requiresMembership && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    * Membership card fee ({formatPrice(selectedPlan.membershipFee)}) is one-time only and grants you permanent access to member rates
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Pay & Check In
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
