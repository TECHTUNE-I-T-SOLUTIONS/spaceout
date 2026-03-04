'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, Loader2, Zap, Wifi, WifiOff, CheckCircle, LogOut, List, History } from 'lucide-react';
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

interface CheckInRecord {
  _id: string;
  serviceId: string;
  serviceName: string;
  planName: string;
  planType: string;
  durationLabel: string;
  amount: number;
  selectedRate: string;
  status: string;
  paymentStatus: string;
  checkedInAt: string;
  checkedOutAt?: string;
}

export default function CheckInPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [activeTab, setActiveTab] = useState('check-in');
  const [checkInHistory, setCheckInHistory] = useState<CheckInRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [todayCheckIns, setTodayCheckIns] = useState<{ [serviceId: string]: boolean }>({});
  const [duplicateCheckInDialog, setDuplicateCheckInDialog] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<SelectedPlan | null>(null);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [checkoutConfirmDialog, setCheckoutConfirmDialog] = useState(false);
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(null);
  const [checkoutRecord, setCheckoutRecord] = useState<CheckInRecord | null>(null);


  // Fetch server time on mount
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await fetch('/api/server-time');
        if (response.ok) {
          const data = await response.json();
          setServerTime(new Date(data.timestamp));
        }
      } catch (error) {
        console.error('Error fetching server time:', error);
      }
    };

    fetchServerTime();
  }, []);

  // Fetch check-in history
  const fetchCheckInHistory = async (page = 1) => {
    if (!session?.user?.id) return;

    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/checkin/history?page=${page}&limit=${pagination.limit}`);
      if (response.ok) {
        const data = await response.json();
        setCheckInHistory(data.checkIns);
        setPagination({
          page,
          limit: pagination.limit,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      toast.error('Failed to load check-in history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch today's check-ins to show paid badges
  const fetchTodayCheckIns = async () => {
    if (!session?.user?.id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch(`/api/checkin/history?limit=100`);
      if (response.ok) {
        const data = await response.json();
        const todayMap: { [serviceId: string]: boolean } = {};
        
        // Check which services have successful check-ins today
        data.checkIns.forEach((checkIn: CheckInRecord) => {
          const checkedInDate = new Date(checkIn.checkedInAt);
          checkedInDate.setHours(0, 0, 0, 0);
          
          if (checkedInDate.getTime() === today.getTime() && checkIn.paymentStatus === 'completed') {
            todayMap[checkIn.serviceId] = true;
          }
        });
        
        setTodayCheckIns(todayMap);
      }
    } catch (error) {
      console.error('Error fetching today check-ins:', error);
    }
  };

  // Fetch history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchCheckInHistory();
    }
  }, [activeTab, session?.user?.id]);

  // Fetch today's check-ins on component update
  useEffect(() => {
    if (session?.user?.id && activeTab === 'check-in') {
      fetchTodayCheckIns();
    }
  }, [session?.user?.id, activeTab]);

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

  const handlePlanSelection = async (
    service: Service,
    plan: PricingPlan,
    rateType: string,
    price: number,
    wifiIncluded: boolean,
    requiresMembership: boolean = false
  ) => {
    try {
      // Check if user has active subscription for this specific service
      let hasServiceSubscription = false;
      let subscriptionData = null;

      if (session?.user?.id) {
        const response = await fetch(`/api/users/check-service-subscription?serviceId=${service._id}`);
        if (response.ok) {
          const data = await response.json();
          hasServiceSubscription = data.hasActiveSubscription;
          subscriptionData = data.subscription;
        }
      }

      // If user has active subscription, use member pricing automatically
      let finalPrice = price;
      let finalWifiIncluded = wifiIncluded;
      let finalMembershipFee = 0;
      let finalRequiresMembership = false;
      let appliedRate = rateType;

      if (hasServiceSubscription && plan.memberPrice) {
        // User has active subscription - use member price automatically
        finalPrice = plan.memberPrice;
        finalWifiIncluded = true;
        appliedRate = 'member';
        finalMembershipFee = 0; // No card fee for active subscribers
        finalRequiresMembership = false;
      } else {
        // Original logic for non-subscribers
        let membershipFee = 0;
        if (requiresMembership && !userMembership?.hasMembership) {
          membershipFee = plan.accessCardFee || 0;
        }
        finalMembershipFee = membershipFee;
        finalRequiresMembership = requiresMembership && !userMembership?.hasMembership;
      }

      const totalPrice = finalPrice + finalMembershipFee;

      const newPlan: SelectedPlan = {
        service,
        plan,
        selectedRate: appliedRate as any,
        price: finalPrice,
        wifiIncluded: finalWifiIncluded,
        requiresMembership: finalRequiresMembership,
        membershipFee: finalMembershipFee,
        totalPrice,
      };

      // Check if they already paid for this service today
      if (todayCheckIns[service._id]) {
        setPendingPlan(newPlan);
        setDuplicateCheckInDialog(true);
      } else {
        setSelectedPlan(newPlan);
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Error processing plan selection');
    }
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

  const handleCheckout = (checkInId: string, record: CheckInRecord) => {
    setPendingCheckoutId(checkInId);
    setCheckoutRecord(record);
    setCheckoutConfirmDialog(true);
  };

  const confirmCheckout = async () => {
    if (!pendingCheckoutId) {
      toast.error('Error: Check-in ID not found');
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(`/api/checkin/${pendingCheckoutId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to checkout');
      }

      const data = await response.json();

      toast.success('Checked out successfully', {
        description: `${data.checkIn.serviceName} - ${data.checkIn.planName}`,
      });

      // Reset dialog states
      setCheckoutConfirmDialog(false);
      setPendingCheckoutId(null);
      setCheckoutRecord(null);

      // Refresh check-in history
      await fetchCheckInHistory(pagination.page);
    } catch (error: any) {
      toast.error('Checkout Error', {
        description: error.message || 'Failed to complete checkout',
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
        <h1 className="text-3xl font-bold mb-2">Check In & History</h1>
        <p className="text-muted-foreground">
          Check in to services or view your check-in history
          {userMembership?.hasMembership && (
            <span className="ml-2 text-green-600 font-semibold">• ⭐ Member rates available (get better prices!)</span>
          )}
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in" className="flex items-center justify-center gap-2">
            <List className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">Check In</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center justify-center gap-2">
            <History className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">Check-In History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check-in" className="mt-6">
          {/* Timezone Note */}
          <Card className="mb-6 p-4 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Server Time (Nigeria, WAT)</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                  Current Server Time: <span className="font-mono font-bold">{serverTime.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</span>
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  📱 Note: Check-in times are based on our server time (Nigeria timezone). If your device time differs from the server time, it may affect your check-in timestamp. Please ensure your device time is accurate for proper check-in records.
                </p>
              </div>
            </div>
          </Card>

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No services available at the moment</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {services.map((service) => (
            <motion.div key={service._id} variants={itemVariants}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{service.name}</h2>
                  {todayCheckIns[service._id] && (
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Paid Today
                    </Badge>
                  )}
                </div>
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
        </TabsContent>

        {/* Check-In History Tab */}
        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading check-in history...</p>
              </div>
            </div>
          ) : checkInHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Check-Ins Yet</h3>
              <p className="text-muted-foreground">
                You haven't checked in to any services yet. Head to the Check In tab to get started!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {checkInHistory.map((checkIn) => {
                const checkedInDate = new Date(checkIn.checkedInAt);
                const today = new Date();
                const isToday = checkedInDate.toDateString() === today.toDateString();

                return (
                  <motion.div
                    key={checkIn._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-4 border-l-4 border-l-green-500">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{checkIn.serviceName}</h3>
                            {isToday && !checkIn.checkedOutAt && (
                              <Badge className="bg-green-500 text-white flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Checked In Today
                              </Badge>
                            )}
                            {checkIn.paymentStatus === 'completed' ? (
                              <Badge className="bg-gray-500 text-white">Paid</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            {checkIn.checkedOutAt && (
                              <Badge className="bg-blue-500 text-white flex items-center gap-1">
                                <LogOut className="w-3 h-3" />
                                Checked Out
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Plan</p>
                              <p className="font-medium">{checkIn.planName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Duration</p>
                              <p className="font-medium">{checkIn.durationLabel}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Checked In</p>
                              <p className="font-medium">{checkedInDate.toLocaleDateString()} {checkedInDate.toLocaleTimeString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Amount</p>
                              <p className="font-medium text-primary">₦{checkIn.amount?.toLocaleString() || '0'}</p>
                            </div>
                          </div>

                          {checkIn.checkedOutAt && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <LogOut className="w-3 h-3" />
                                Checked out: {new Date(checkIn.checkedOutAt).toLocaleString()}
                              </p>
                            </div>
                          )}

                          {!checkIn.checkedOutAt && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleCheckout(checkIn._id, checkIn)}
                                className="flex items-center gap-1"
                              >
                                <LogOut className="w-4 h-4" />
                                Check Out
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                Checked in for {Math.floor((new Date().getTime() - checkedInDate.getTime()) / (1000 * 60))} minutes
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchCheckInHistory(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    onClick={() => fetchCheckInHistory(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
                  <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                      ✨ You'll get membership benefits!
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      Your membership card fee is included in the total. After payment, you'll be able to use member rates on future check-ins.
                    </p>
                  </div>
                )}

              {selectedPlan.selectedRate === 'member' && !selectedPlan.requiresMembership && !selectedPlan.membershipFee && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                    ✅ Active Membership
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    You're getting member rates because you have an active membership for this service. No additional card fees!
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

      {/* Duplicate Check-In Confirmation Dialog */}
      <Dialog open={duplicateCheckInDialog} onOpenChange={setDuplicateCheckInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Confirm Duplicate Check-In
            </DialogTitle>
            <DialogDescription>
              You've already checked in to this service today
            </DialogDescription>
          </DialogHeader>

          {pendingPlan && (
            <div className="space-y-4">
              <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Service</p>
                    <p className="font-semibold">{pendingPlan.service.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Plan</p>
                    <p className="font-semibold">{pendingPlan.plan.planName}</p>
                  </div>
                </div>
              </Card>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Warning:</strong> You already have a successful check-in for {pendingPlan.service.name} today ({new Date().toLocaleDateString()}). 
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  If you continue, you will be charged again for another check-in session. This is useful if you're leaving and want to check back in later.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold mb-1">Server Time (Nigeria, WAT)</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Current: {new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDuplicateCheckInDialog(false);
                    setPendingPlan(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (pendingPlan) {
                      setSelectedPlan(pendingPlan);
                    }
                    setDuplicateCheckInDialog(false);
                    setPendingPlan(null);
                  }}
                  className="flex-1"
                >
                  Yes, Check In Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkoutConfirmDialog} onOpenChange={setCheckoutConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Check-Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to check out now?
            </DialogDescription>
          </DialogHeader>

          {checkoutRecord && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-semibold">{checkoutRecord.serviceName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold">{checkoutRecord.planName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Checked In</p>
                  <p className="font-semibold text-sm">
                    {new Date(checkoutRecord.checkedInAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <LogOut className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Session Duration</p>
                    <p className="font-semibold">
                      {Math.floor((new Date().getTime() - new Date(checkoutRecord.checkedInAt).getTime()) / (1000 * 60))} minutes
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                You will be checked out from {checkoutRecord.serviceName} and your session will be recorded.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => {
                setCheckoutConfirmDialog(false);
                setPendingCheckoutId(null);
                setCheckoutRecord(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckout}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Check-Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
