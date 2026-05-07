'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, Loader2, Zap, Wifi, WifiOff, CheckCircle, LogOut, List, History, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import CheckinDurationMonitor from '@/components/checkin-duration-monitor';

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
  quantity: number; // Hours for hourly plans, Days for daily/weekly/etc.
  isHourly: boolean;
  isDaily: boolean;
  appliedPlanName: string; // To track if we switched from Hourly to Daily or Daily to Weekly
  subscriptionInfo?: any; // Subscription info from API
  subscriptionCovered?: boolean; // whether the active subscription covers this selected plan
  membershipPlanName?: string; // name of the membership/access-card plan when bundled or applied
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
  const [reverifyingIds, setReverifyingIds] = useState<Set<string>>(new Set());
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(1);


  // Handle success redirect from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const subscriptionId = urlParams.get('subscriptionId');
    const selectedDays = urlParams.get('selectedDays');

    if (success === 'true') {
      if (subscriptionId) {
        const desc = selectedDays ? `Your ${selectedDays}-day subscription is now active. You can check in each day individually.` : 'Your membership/subscription is now active.';
        toast.success('Payment successful!', { description: desc });
        // Refresh subscriptions so membership card appears
        fetchActiveSubscriptions();
      } else {
        toast.success('Payment successful!', {
          description: 'Your check-in has been confirmed.',
        });
      }

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'false') {
      const message = urlParams.get('message') || 'Payment failed';
      toast.error('Payment Failed', {
        description: message,
      });
    }
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

  // Fetch active subscriptions
  const fetchActiveSubscriptions = async () => {
    if (!session?.user?.id) return;

    try {
      setSubscriptionsLoading(true);
      const response = await fetch('/api/user/subscriptions/active');
      if (response.ok) {
        const data = await response.json();
        setActiveSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  // Fetch today's check-ins to show paid badges and clean up old pending checkins
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

        // Clean up ALL pending check-ins on page load by verifying with Paystack
        const pendingCheckIns = data.checkIns.filter((checkIn: CheckInRecord) => 
          checkIn.paymentStatus === 'pending'
        );

        if (pendingCheckIns.length > 0) {
          console.log(`Found ${pendingCheckIns.length} pending check-ins, verifying with Paystack...`);
          
          // Verify payment status with Paystack for each pending check-in
          await Promise.all(
            pendingCheckIns.map(async (checkIn: CheckInRecord) => {
              try {
                // Find the associated payment record
                const paymentResponse = await fetch(`/api/payments/checkin/${checkIn._id}`);
                if (!paymentResponse.ok) {
                  console.error(`Failed to find payment for check-in ${checkIn._id}`);
                  return;
                }
                
                const paymentData = await paymentResponse.json();
                const payment = paymentData.payment;
                
                // Determine which reference to use for verification
                let referenceToUse = payment.paystackReference;
                let isLegacyPayment = false;
                
                if (!referenceToUse && payment.reference) {
                  // Try using the internal reference for older payments
                  referenceToUse = payment.reference;
                  isLegacyPayment = true;
                  console.log(`Using legacy reference for automatic verification: ${referenceToUse}`);
                }
                
                if (!referenceToUse) {
                  console.log(`Skipping verification for check-in ${checkIn._id} - no reference found`);
                  return;
                }

                // Verify payment status with Paystack
                const verifyResponse = await fetch(`/api/payments/verify-status?reference=${referenceToUse}`);
                if (!verifyResponse.ok) {
                  // If verification fails for legacy payment, treat as failed
                  if (isLegacyPayment) {
                    console.log(`Legacy payment verification failed for ${referenceToUse}, treating as failed`);
                    // Payment failed, delete the check-in record
                    await fetch(`/api/checkin/${checkIn._id}`, {
                      method: 'DELETE',
                    });
                    // Also update payment record to failed
                    await fetch(`/api/payments/${payment._id}/update-status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        status: 'failed'
                      }),
                    });
                    console.log(`Deleted failed legacy check-in ${checkIn._id} and marked payment as failed`);
                  } else {
                    console.error(`Failed to verify payment ${referenceToUse}`);
                  }
                  return;
                }

                const verifyData = await verifyResponse.json();
                
                if (verifyData.status === 'success') {
                  // Payment was successful, update check-in to completed
                  await fetch(`/api/checkin/${checkIn._id}/update-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      status: 'checked_in',
                      paymentStatus: 'completed'
                    }),
                  });
                  // Also update payment record
                  await fetch(`/api/payments/${payment._id}/update-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      status: 'completed',
                      paidAt: verifyData.paidAt,
                      amount: verifyData.amount
                    }),
                  });
                  console.log(`Updated check-in ${checkIn._id} to completed after Paystack verification`);
                } else if (verifyData.status === 'failed' || verifyData.status === 'error') {
                  // Payment failed or verification error, delete the check-in record so user can retry
                  await fetch(`/api/checkin/${checkIn._id}`, {
                    method: 'DELETE',
                  });
                  // Also update payment record to failed
                  await fetch(`/api/payments/${payment._id}/update-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      status: 'failed'
                    }),
                  });
                  console.log(`Deleted failed check-in ${checkIn._id} and marked payment as failed`);
                } else {
                  // Still pending, leave as is for now
                  console.log(`Check-in ${checkIn._id} still pending`);
                }
              } catch (error) {
                console.error(`Failed to update check-in ${checkIn._id}:`, error);
              }
            })
          );

          // Refresh history after cleanup
          if (activeTab === 'history') {
            fetchCheckInHistory();
          }
        }
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
      fetchActiveSubscriptions();
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

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const getPlanMetrics = (plan: PricingPlan) => {
    const name = plan.planName.toLowerCase();
    const isHourly = name.includes('hourly') || (plan.durationInHours === 1 && plan.durationInDays === 1);
    const isDaily = name.includes('daily') || (plan.durationInHours === 9 && plan.durationInDays === 1);
    const isWeekly = name.includes('weekly') || plan.durationInDays === 6;
    const isMonthly = name.includes('monthly') || plan.durationInDays === 30;
    const isYearly = name.includes('yearly') || plan.durationInDays === 365;

    return { isHourly, isDaily, isWeekly, isMonthly, isYearly };
  };

  const calculateBestPrice = (
    service: Service,
    basePlan: PricingPlan,
    rateType: string,
    quantity: number
  ) => {
    const { isHourly, isDaily } = getPlanMetrics(basePlan);
    let finalPlan = basePlan;
    let finalQuantity = quantity;
    let finalPrice = 0;

    if (isHourly && quantity >= 9) {
      // Switch to Daily Plan if available
      const dailyPlan = service.pricingPlans.find(p => getPlanMetrics(p).isDaily);
      if (dailyPlan) {
        finalPlan = dailyPlan;
        finalQuantity = 1; // 9 hours becomes 1 day
      }
    } else if (isDaily && quantity >= 6) {
      // Switch to Weekly Plan if available
      const weeklyPlan = service.pricingPlans.find(p => getPlanMetrics(p).isWeekly);
      if (weeklyPlan) {
        finalPlan = weeklyPlan;
        finalQuantity = 1; // 6 days becomes 1 week
      }
    }

    // Determine the price based on the rate type from the (possibly switched) plan
    const ratePrices: any = {
      flat: finalPlan.flatPrice || finalPlan.nonMemberPrice,
      member: finalPlan.memberPrice,
      nonMember: finalPlan.nonMemberPrice,
      nonWifi: finalPlan.nonWifiPrice,
      nonWifiMember: finalPlan.nonWifiPriceMember,
      nonWifiNonMember: finalPlan.nonWifiPriceNonMember
    };

    finalPrice = ratePrices[rateType] || finalPlan.flatPrice || 0;

    return { finalPlan, finalQuantity, finalPrice };
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
      setIsProcessing(true);
      let subscriptionInfo = null;

      // Per-service membership check (service-specific)
      if (session?.user?.id) {
        const response = await fetch(`/api/users/check-service-subscription?serviceId=${service._id}`);
        if (response.ok) {
          const data = await response.json();
          subscriptionInfo = {
            hasActiveSubscription: data.hasActiveSubscription,
            subscription: data.subscription
          };
        }
      }

      const { isHourly, isDaily } = getPlanMetrics(plan);
      const initialQuantity = 1;
      const { finalPlan, finalQuantity, finalPrice } = calculateBestPrice(service, plan, rateType, initialQuantity);

      // Determine if member rates are already paid for via subscription AND if the subscription actually covers this plan
      const hasMembership = subscriptionInfo?.hasActiveSubscription;
      let subscriptionCovered = false;

      if (hasMembership && subscriptionInfo.subscription) {
        const sub = subscriptionInfo.subscription;
        // Must match the service name and be an access card
        if (sub.serviceName === service.name && sub.isAccessCard) {
          // For office and conference categories, the access card usually covers all plans
          if (service.category === 'office' || service.category === 'conference') {
            subscriptionCovered = true;
          } else if (service.category === 'workspace') {
            // For workspace (General Workspace) the common access card covers hourly, daily and weekly plans
            const pname = plan.planName?.toLowerCase() || '';
            const isHourlyDailyWeekly = pname.includes('hour') || pname.includes('daily') || pname.includes('weekly') || plan.durationInDays === 1 || plan.durationInDays === 6;
            if (isHourlyDailyWeekly) subscriptionCovered = true;
            // Also if the subscription price equals the plan's access card fee, treat as covered
            if (plan.accessCardFee && sub.price === plan.accessCardFee) subscriptionCovered = true;
          } else {
            // Fallback: if subscription price equals plan accessCardFee
            if (plan.accessCardFee && sub.price === plan.accessCardFee) subscriptionCovered = true;
          }
        }
      }

      let finalMembershipFee = 0;
      let finalRequiresMembership = false;
      let appliedRate = rateType;
      let membershipPlanName: string | undefined = undefined;
      // start with the price calculated for the originally selected rate
      let appliedPrice = finalPrice;

      if (subscriptionCovered && plan.memberPrice) {
        // If subscription for this service covers this plan, auto-apply member rate
        appliedRate = 'member';
        const best = calculateBestPrice(service, plan, 'member', initialQuantity);
        appliedPrice = best.finalPrice;
        finalMembershipFee = 0;
        membershipPlanName = subscriptionInfo?.subscription?.planName || `${service.name} Card Access`;
      } else if (rateType === 'member' && !subscriptionCovered) {
        // User selected member rate but there's no covering subscription for this plan
        // Bundle the plan's access card fee so user can buy the monthly/yearly membership now
        finalMembershipFee = plan.accessCardFee || 0;
        finalRequiresMembership = finalMembershipFee > 0;
        if (finalRequiresMembership) {
          // Use explicit membership plan name for monthly/yearly plans
          const pname = (plan.planName || '').toLowerCase();
          if (pname.includes('month') || pname.includes('year') || pname.includes('membership')) {
            membershipPlanName = plan.planName;
          } else {
            membershipPlanName = `${service.name} Card Access - ${plan.planName}`;
          }
        }
      }

      const totalPrice = (appliedPrice * finalQuantity) + finalMembershipFee;

      const newPlan: SelectedPlan = {
        service,
        plan,
        selectedRate: appliedRate as any,
        price: appliedPrice,
        wifiIncluded,
        requiresMembership: finalRequiresMembership,
        membershipFee: finalMembershipFee,
        totalPrice,
        quantity: finalQuantity,
        isHourly,
        isDaily,
        appliedPlanName: finalPlan.planName,
        subscriptionInfo,
        subscriptionCovered
        ,membershipPlanName
      };

      setSelectedQuantity(finalQuantity);
      
      if (todayCheckIns[service._id]) {
        setPendingPlan(newPlan);
        setDuplicateCheckInDialog(true);
      } else {
        setSelectedPlan(newPlan);
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Error processing plan selection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionCheckIn = async (subscriptionId: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Check-in failed');
      }

      const data = await response.json();

      toast.success('Check-in successful!', {
        description: `Welcome to ${data.checkIn.serviceName}`,
      });

      // Refresh data
      await fetchTodayCheckIns();
      await fetchActiveSubscriptions();
      await fetchCheckInHistory(pagination.page);
    } catch (error: any) {
      toast.error('Check-in Failed', {
        description: error.message || 'Failed to check in',
      });
    } finally {
      setIsProcessing(false);
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
          membershipPlanName: selectedPlan.membershipPlanName,
          totalPrice: selectedPlan.totalPrice,
          // Clarify quantity semantics: send hours for hourly plans and days for day/week/month plans
          selectedHours: selectedPlan.isHourly ? selectedPlan.quantity : undefined,
          selectedDays: !selectedPlan.isHourly ? selectedPlan.quantity : undefined,
          isAccessCardBundled: selectedPlan.requiresMembership
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

  const handleReverifyPayment = async (checkInId: string) => {
    if (reverifyingIds.has(checkInId)) return;

    setReverifyingIds(prev => new Set(prev).add(checkInId));

    try {
      // Find the associated payment record
      const paymentResponse = await fetch(`/api/payments/checkin/${checkInId}`);
      if (!paymentResponse.ok) {
        toast.error('Failed to find payment record');
        return;
      }
      
      const paymentData = await paymentResponse.json();
      const payment = paymentData.payment;
      
      // Determine which reference to use for verification
      let referenceToUse = payment.paystackReference;
      let isLegacyPayment = false;
      
      if (!referenceToUse && payment.reference) {
        // Try using the internal reference for older payments
        referenceToUse = payment.reference;
        isLegacyPayment = true;
        console.log(`Using legacy reference for payment verification: ${referenceToUse}`);
      }
      
      if (!referenceToUse) {
        toast.error('No payment reference found');
        return;
      }

      // Verify payment status with Paystack
      const verifyResponse = await fetch(`/api/payments/verify-status?reference=${referenceToUse}`);
      if (!verifyResponse.ok) {
        // If verification fails for legacy payment, treat as failed
        if (isLegacyPayment) {
          console.log(`Legacy payment verification failed for ${referenceToUse}, treating as failed`);
          // Payment failed, delete the check-in record so user can retry
          await fetch(`/api/checkin/${checkInId}`, {
            method: 'DELETE',
          });
          // Also update payment record to failed
          await fetch(`/api/payments/${payment._id}/update-status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'failed'
            }),
          });
          toast.error('Payment verification failed. This payment has been marked as failed.');
          // Refresh history
          fetchCheckInHistory();
          return;
        } else {
          toast.error('Failed to verify payment status');
          return;
        }
      }

      const verifyData = await verifyResponse.json();
      
      if (verifyData.status === 'success') {
        // Payment was successful, update check-in to completed
        await fetch(`/api/checkin/${checkInId}/update-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'checked_in',
            paymentStatus: 'completed'
          }),
        });
        // Also update payment record
        await fetch(`/api/payments/${payment._id}/update-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'completed',
            paidAt: verifyData.paidAt,
            amount: verifyData.amount
          }),
        });
        toast.success('Payment verified successfully!');
        // Refresh history
        fetchCheckInHistory();
      } else if (verifyData.status === 'failed' || verifyData.status === 'error') {
        // Payment failed or verification error, delete the check-in record so user can retry
        await fetch(`/api/checkin/${checkInId}`, {
          method: 'DELETE',
        });
        // Also update payment record to failed
        await fetch(`/api/payments/${payment._id}/update-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'failed'
          }),
        });
        toast.error('Payment failed. Please try checking in again.');
        // Refresh history
        fetchCheckInHistory();
      } else {
        // Still pending
        toast.info('Payment is still processing. Please try again later.');
      }
    } catch (error) {
      console.error('Error reverifying payment:', error);
      toast.error('Failed to reverify payment');
    } finally {
      setReverifyingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(checkInId);
        return newSet;
      });
    }
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

  const handleCheckout = async (checkInId: string, checkIn: CheckInRecord) => {
    setPendingCheckoutId(checkInId);
    setCheckoutRecord(checkIn);
    setCheckoutConfirmDialog(true);
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
          {/* Background monitor for durations */}
          <CheckinDurationMonitor />
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

          {/* Active Subscriptions Section */}
          {activeSubscriptions.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Your Active Subscriptions
                </h2>
                <div className="space-y-4">
                  {activeSubscriptions.map((subscription) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    // Check if already checked in today
                    const todayCheckIn = subscription.checkIns?.find((checkIn: any) => {
                      const checkInDate = new Date(checkIn.checkedInAt);
                      checkInDate.setHours(0, 0, 0, 0);
                      return checkInDate.getTime() === today.getTime() && checkIn.status === 'checked_in';
                    });

                    // Prefer server-provided usage (usedCount/remaining/unit)
                    const usedCount = subscription.usage?.usedCount ?? (subscription.checkIns?.length || 0);
                    const isHourlySub = subscription.usage?.unit === 'hours' || !!subscription.durationInHours;
                    const remaining = typeof subscription.usage?.remaining !== 'undefined'
                      ? subscription.usage.remaining
                      : (isHourlySub ? Math.max((subscription.durationInHours || 0) - usedCount, 0) : (subscription.durationInDays ? Math.max(subscription.durationInDays - usedCount, 0) : undefined));

                    return (
                      <div key={subscription._id} className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{subscription.serviceName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {(subscription.durationLabel || (subscription.durationInDays ? `${subscription.durationInDays} Days` : ''))} • {subscription.planName} • {subscription.selectedRate}
                            </p>
                          </div>
                          <div className="text-right">
                            {/* Prefer totalAmount, fall back to amountPerDay for hourly-like subscriptions */}
                            <p className="font-semibold">{formatPrice(subscription.totalAmount || subscription.amountPerDay)}</p>
                            <p className="text-xs text-muted-foreground">
                              {isHourlySub ? `${usedCount} used • ${remaining} hrs remaining` : `${usedCount} used${typeof remaining !== 'undefined' ? ` • ${remaining} remaining` : ''}`}
                            </p>
                          </div>
                        </div>

                        {todayCheckIn ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Checked in today</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSubscriptionCheckIn(subscription._id)}
                            disabled={isProcessing || (typeof remaining === 'number' && remaining <= 0)}
                            className="w-full"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking In...
                              </>
                            ) : (
                              <>
                                <LogOut className="w-4 h-4 mr-2" />
                                Check In Today
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

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
                            ) : checkIn.paymentStatus === 'pending' ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Failed</Badge>
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

                          {!checkIn.checkedOutAt && checkIn.paymentStatus === 'completed' && (
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

                          {checkIn.paymentStatus === 'pending' && (
                            <div className="mt-3 pt-3 border-t flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReverifyPayment(checkIn._id)}
                                disabled={reverifyingIds.has(checkIn._id)}
                                className="flex items-center gap-1"
                              >
                                {reverifyingIds.has(checkIn._id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <AlertCircle className="w-4 h-4" />
                                )}
                                {reverifyingIds.has(checkIn._id) ? 'Verifying...' : 'Reverify Payment'}
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                Payment is being processed
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check In Confirmation</DialogTitle>
            <DialogDescription>
              Review your selection and proceed to payment
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 pt-4 text-white">
              {/* Service & Plan Details Card */}
              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Service</p>
                  <p className="text-lg font-bold leading-tight">{selectedPlan.service.name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Plan</p>
                  <p className="text-lg font-bold leading-tight">{selectedPlan.appliedPlanName}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Duration</p>
                  <p className="text-lg font-bold leading-tight">
                    {selectedPlan.isHourly ? `${selectedPlan.quantity} Hour${selectedPlan.quantity > 1 ? 's' : ''}` : selectedPlan.plan.durationLabel}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-400">Plan Type:</span>
                    <span className="text-sm font-bold capitalize">{selectedPlan.selectedRate}</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="text-xs">
                    {selectedPlan.wifiIncluded ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> WiFi Included
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" /> No WiFi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              {(selectedPlan.isHourly || selectedPlan.isDaily) && (
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <span className="text-sm font-bold">
                    {selectedPlan.isHourly ? 'Number of Hours:' : 'Number of Days:'}
                  </span>
                  <Select
                    value={selectedQuantity.toString()}
                    onValueChange={(value) => {
                      const qty = parseInt(value);
                      setSelectedQuantity(qty);
                      
                      const { finalPlan, finalQuantity, finalPrice } = calculateBestPrice(
                        selectedPlan.service,
                        selectedPlan.plan,
                        selectedPlan.selectedRate,
                        qty
                      );

                      const newTotal = (finalPrice * finalQuantity) + (selectedPlan.membershipFee || 0);
                      
                      setSelectedPlan({
                        ...selectedPlan,
                        quantity: finalQuantity,
                        totalPrice: newTotal,
                        price: finalPrice,
                        appliedPlanName: finalPlan.planName
                      });
                    }}
                  >
                    <SelectTrigger className="w-[120px] bg-[#222] border-white/10 text-white rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#222] border-white/10 text-white">
                      {Array.from({ length: selectedPlan.isHourly ? 9 : 6 }, (_, i) => i + 1).map((val) => (
                        <SelectItem key={val} value={val.toString()}>
                          {val} {selectedPlan.isHourly ? (val === 1 ? 'Hour' : 'Hours') : (val === 1 ? 'Day' : 'Days')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedPlan.appliedPlanName !== selectedPlan.plan.planName && (
                <div className="text-xs text-amber-300/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <p>
                    <span className="font-bold">Plan Upgrade!</span> Switched to <span className="font-bold">{selectedPlan.appliedPlanName}</span> for better value.
                  </p>
                </div>
              )}

              {/* Total Amount Box */}
              {selectedPlan.membershipFee ? (
                <div className="bg-transparent p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Base Price ({selectedPlan.quantity}x)</span>
                    <span className="font-semibold">{formatPrice((selectedPlan.price || 0) * selectedPlan.quantity)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>{selectedPlan.membershipPlanName || 'Access Card Fee'}</span>
                    <span className="font-semibold">{formatPrice(selectedPlan.membershipFee)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div>
                    <p className="text-sm text-zinc-500 font-medium">Total Amount</p>
                    <p className="text-4xl font-black tracking-tight text-white leading-none">{formatPrice(selectedPlan.totalPrice)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-transparent p-5 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-sm text-zinc-500 font-medium">Total Amount</p>
                  <p className="text-4xl font-black tracking-tight text-white leading-none">{formatPrice(selectedPlan.totalPrice)}</p>
                </div>
              )}

              {/* Membership Benefits Alert */}
              {selectedPlan.membershipFee ? (
                <div className="bg-[#0f172a] border border-blue-500/20 p-4 rounded-2xl flex gap-3 shadow-2xl">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">You'll get membership benefits!</p>
                    <p className="text-xs text-zinc-400 leading-normal">
                      {selectedPlan.membershipPlanName ? (
                        <>Your <span className="font-semibold">{selectedPlan.membershipPlanName}</span> ({formatPrice(selectedPlan.membershipFee)}) is included in the total.</>
                      ) : (
                        <>Your membership card fee ({formatPrice(selectedPlan.membershipFee)}) is included in the total.</>
                      )} After payment, you'll be able to use member rates on future check-ins.
                    </p>
                  </div>
                </div>
              ) : selectedPlan.subscriptionCovered === true && selectedPlan.selectedRate === 'member' && (
                <div className="bg-[#064e3b]/20 border border-green-500/20 p-4 rounded-2xl flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Active Membership Applied</p>
                    <p className="text-xs text-zinc-400 leading-normal">
                      You're getting member rates because you have an active membership for this service. No additional card fees!
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  disabled={isProcessing}
                  className="flex-1 h-12 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
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