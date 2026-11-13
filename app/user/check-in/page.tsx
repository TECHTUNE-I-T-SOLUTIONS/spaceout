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
  quantity: number;
  isHourly: boolean;
  isDaily: boolean;
  appliedPlanName: string;
  subscriptionInfo?: any;
  subscriptionCovered?: boolean;
  membershipPlanName?: string;
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const subscriptionId = urlParams.get('subscriptionId');
    const selectedDays = urlParams.get('selectedDays');
    if (success === 'true') {
      if (subscriptionId) {
        const desc = selectedDays ? `Your ${selectedDays}-day subscription is now active. You can check in each day individually.` : 'Your membership/subscription is now active.';
        toast.success('Payment successful!', { description: desc });
        fetchActiveSubscriptions();
      } else {
        toast.success('Payment successful!', { description: 'Your check-in has been confirmed.' });
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'false') {
      const message = urlParams.get('message') || 'Payment failed';
      toast.error('Payment Failed', { description: message });
    }
  }, []);

  const fetchCheckInHistory = async (page = 1) => {
    if (!session?.user?.id) return;
    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/checkin/history?page=${page}&limit=${pagination.limit}`);
      if (response.ok) {
        const data = await response.json();
        setCheckInHistory(data.checkIns);
        setPagination({ page, limit: pagination.limit, total: data.pagination.total });
      }
    } catch (error) { console.error('Error fetching check-in history:', error); toast.error('Failed to load check-in history'); }
    finally { setHistoryLoading(false); }
  };

  const fetchActiveSubscriptions = async () => {
    if (!session?.user?.id) return;
    try {
      setSubscriptionsLoading(true);
      const response = await fetch('/api/user/subscriptions/active');
      if (response.ok) setActiveSubscriptions((await response.json()).subscriptions);
    } catch (error) { console.error('Error fetching subscriptions:', error); }
    finally { setSubscriptionsLoading(false); }
  };

  const fetchTodayCheckIns = async () => {
    if (!session?.user?.id) return;
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const response = await fetch(`/api/checkin/history?limit=100`);
      if (response.ok) {
        const data = await response.json();
        const todayMap: { [serviceId: string]: boolean } = {};
        data.checkIns.forEach((checkIn: CheckInRecord) => {
          const checkedInDate = new Date(checkIn.checkedInAt); checkedInDate.setHours(0, 0, 0, 0);
          if (checkedInDate.getTime() === today.getTime() && checkIn.paymentStatus === 'completed') todayMap[checkIn.serviceId] = true;
        });
        setTodayCheckIns(todayMap);
        const pendingCheckIns = data.checkIns.filter((checkIn: CheckInRecord) => checkIn.paymentStatus === 'pending');
        if (pendingCheckIns.length > 0) {
          await Promise.all(pendingCheckIns.map(async (checkIn: CheckInRecord) => {
            try {
              const paymentResponse = await fetch(`/api/payments/checkin/${checkIn._id}`);
              if (!paymentResponse.ok) return;
              const paymentData = await paymentResponse.json();
              const payment = paymentData.payment;
              let referenceToUse = payment.paystackReference;
              let isLegacyPayment = false;
              if (!referenceToUse && payment.reference) { referenceToUse = payment.reference; isLegacyPayment = true; }
              if (!referenceToUse) return;
              const verifyResponse = await fetch(`/api/payments/verify-status?reference=${referenceToUse}`);
              if (!verifyResponse.ok) {
                if (isLegacyPayment) {
                  await fetch(`/api/checkin/${checkIn._id}`, { method: 'DELETE' });
                  await fetch(`/api/payments/${payment._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed' }) });
                }
                return;
              }
              const verifyData = await verifyResponse.json();
              if (verifyData.status === 'success') {
                await fetch(`/api/checkin/${checkIn._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'checked_in', paymentStatus: 'completed' }) });
                await fetch(`/api/payments/${payment._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed', paidAt: verifyData.paidAt, amount: verifyData.amount }) });
              } else if (verifyData.status === 'failed' || verifyData.status === 'error') {
                await fetch(`/api/checkin/${checkIn._id}`, { method: 'DELETE' });
                await fetch(`/api/payments/${payment._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed' }) });
              }
            } catch (error) { console.error(`Failed to update check-in ${checkIn._id}:`, error); }
          }));
          if (activeTab === 'history') fetchCheckInHistory();
        }
      }
    } catch (error) { console.error('Error fetching today check-ins:', error); }
  };

  useEffect(() => { if (activeTab === 'history') fetchCheckInHistory(); }, [activeTab, session?.user?.id]);
  useEffect(() => { if (session?.user?.id && activeTab === 'check-in') { fetchTodayCheckIns(); fetchActiveSubscriptions(); } }, [session?.user?.id, activeTab]);

  useEffect(() => {
    const checkMembership = async () => {
      if (!session?.user?.email) { setCheckingMembership(false); return; }
      try {
        const response = await fetch('/api/users/membership-status');
        if (response.ok) setUserMembership(await response.json());
      } catch (error) { console.error('Error checking membership:', error); }
      finally { setCheckingMembership(false); }
    };
    checkMembership();
  }, [session]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/services?includeInactive=false');
        if (response.ok) {
          const data: Service[] = await response.json();
          setServices(data.filter(s => s.pricingPlans?.length > 0));
        }
      } catch (error) { console.error('Error fetching services:', error); toast.error('Failed to load services'); }
      finally { setLoading(false); }
    };
    fetchServices();
  }, []);

  const formatPrice = (price: number | undefined) => { if (!price) return 'N/A'; return '₦' + price.toLocaleString(); };

  const getAvailableRates = (plan: PricingPlan) => {
    const isMember = userMembership?.hasMembership;
    const rates = [];
    if (plan.memberPrice) rates.push({ type: 'member', label: 'Member Rate', price: plan.memberPrice, description: 'WiFi included', wifiIncluded: true, badge: isMember ? '⭐ Best' : '💳 Members Only', requiresMembership: !isMember });
    if (plan.nonWifiPriceMember) rates.push({ type: 'nonWifiMember', label: 'Non-WiFi Member', price: plan.nonWifiPriceMember, description: 'No WiFi access', wifiIncluded: false, badge: !isMember ? '💳 Members Only' : undefined, requiresMembership: !isMember });
    if (plan.nonMemberPrice) rates.push({ type: 'nonMember', label: 'Non-Member Rate', price: plan.nonMemberPrice, description: 'WiFi included', wifiIncluded: true });
    if (plan.flatPrice && plan.flatPrice !== plan.nonMemberPrice) rates.push({ type: 'flat', label: 'Standard Rate', price: plan.flatPrice, description: 'WiFi included', wifiIncluded: true });
    if (plan.nonWifiPrice) rates.push({ type: 'nonWifi', label: 'Non-WiFi Rate', price: plan.nonWifiPrice, description: 'No WiFi access', wifiIncluded: false });
    if (plan.nonWifiPriceNonMember && plan.nonWifiPriceNonMember !== plan.nonWifiPrice) rates.push({ type: 'nonWifiNonMember', label: 'Non-WiFi (Non-Member)', price: plan.nonWifiPriceNonMember, description: 'No WiFi access', wifiIncluded: false });
    return rates;
  };

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const getPlanMetrics = (plan: PricingPlan) => {
    const name = plan.planName.toLowerCase();
    return { isHourly: name.includes('hourly') || (plan.durationInHours === 1 && plan.durationInDays === 1), isDaily: name.includes('daily') || (plan.durationInHours === 9 && plan.durationInDays === 1), isWeekly: name.includes('weekly') || plan.durationInDays === 6, isMonthly: name.includes('monthly') || plan.durationInDays === 30, isYearly: name.includes('yearly') || plan.durationInDays === 365 };
  };

  const calculateBestPrice = (service: Service, basePlan: PricingPlan, rateType: string, quantity: number) => {
    const { isHourly, isDaily } = getPlanMetrics(basePlan);
    let finalPlan = basePlan, finalQuantity = quantity, finalPrice = 0;
    if (isHourly && quantity >= 9) { const dailyPlan = service.pricingPlans.find(p => getPlanMetrics(p).isDaily); if (dailyPlan) { finalPlan = dailyPlan; finalQuantity = 1; } }
    else if (isDaily && quantity >= 6) { const weeklyPlan = service.pricingPlans.find(p => getPlanMetrics(p).isWeekly); if (weeklyPlan) { finalPlan = weeklyPlan; finalQuantity = 1; } }
    const ratePrices: any = { flat: finalPlan.flatPrice || finalPlan.nonMemberPrice, member: finalPlan.memberPrice, nonMember: finalPlan.nonMemberPrice, nonWifi: finalPlan.nonWifiPrice, nonWifiMember: finalPlan.nonWifiPriceMember, nonWifiNonMember: finalPlan.nonWifiPriceNonMember };
    finalPrice = ratePrices[rateType] || finalPlan.flatPrice || 0;
    return { finalPlan, finalQuantity, finalPrice };
  };

  const handlePlanSelection = async (service: Service, plan: PricingPlan, rateType: string, price: number, wifiIncluded: boolean, requiresMembership: boolean = false) => {
    try {
      setIsProcessing(true);
      let subscriptionInfo: { hasActiveSubscription: boolean; subscription?: any } | null = null;
      if (session?.user?.id) {
        const response = await fetch(`/api/users/check-service-subscription?serviceId=${service._id}`);
        if (response.ok) {
          const data = await response.json();
          subscriptionInfo = data.subscription ? { hasActiveSubscription: true, subscription: data.subscription } : { hasActiveSubscription: false };
        }
      }
      const { isHourly, isDaily } = getPlanMetrics(plan);
      const { finalPlan, finalQuantity, finalPrice } = calculateBestPrice(service, plan, rateType, 1);
      const hasMembership = subscriptionInfo?.hasActiveSubscription;
      let subscriptionCovered = false;
      if (hasMembership && subscriptionInfo !== null && subscriptionInfo.subscription) {
        const sub = subscriptionInfo.subscription;
        if (sub.serviceName === service.name && sub.isAccessCard) {
          if (service.category === 'office' || service.category === 'conference') subscriptionCovered = true;
          else if (service.category === 'workspace') { const pname = plan.planName?.toLowerCase() || ''; if (pname.includes('hour') || pname.includes('daily') || pname.includes('weekly') || plan.durationInDays === 1 || plan.durationInDays === 6) subscriptionCovered = true; if (plan.accessCardFee && sub.price === plan.accessCardFee) subscriptionCovered = true; }
          else if (plan.accessCardFee && sub.price === plan.accessCardFee) subscriptionCovered = true;
        }
      }
      let finalMembershipFee = 0, finalRequiresMembership = false, appliedRate = rateType, membershipPlanName: string | undefined;
      let appliedPrice = finalPrice;
      if (subscriptionCovered && plan.memberPrice) {
        appliedRate = 'member'; const best = calculateBestPrice(service, plan, 'member', 1); appliedPrice = best.finalPrice; finalMembershipFee = 0; membershipPlanName = subscriptionInfo?.subscription?.planName || `${service.name} Card Access`;
      } else if (rateType === 'member' && !subscriptionCovered) {
        finalMembershipFee = plan.accessCardFee || 0; finalRequiresMembership = finalMembershipFee > 0;
        if (finalRequiresMembership) { const pname = (plan.planName || '').toLowerCase(); membershipPlanName = pname.includes('month') || pname.includes('year') || pname.includes('membership') ? plan.planName : `${service.name} Card Access - ${plan.planName}`; }
      }
      const totalPrice = (appliedPrice * finalQuantity) + finalMembershipFee;
      const newPlan: SelectedPlan = { service, plan, selectedRate: appliedRate as any, price: appliedPrice, wifiIncluded, requiresMembership: finalRequiresMembership, membershipFee: finalMembershipFee, totalPrice, quantity: finalQuantity, isHourly, isDaily, appliedPlanName: finalPlan.planName, subscriptionInfo, subscriptionCovered, membershipPlanName };
      setSelectedQuantity(finalQuantity);
      if (todayCheckIns[service._id]) { setPendingPlan(newPlan); setDuplicateCheckInDialog(true); } else { setSelectedPlan(newPlan); }
    } catch (error) { console.error('Error selecting plan:', error); toast.error('Error processing plan selection'); }
    finally { setIsProcessing(false); }
  };

  const handleSubscriptionCheckIn = async (subscriptionId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId }) });
      if (!response.ok) throw new Error((await response.json()).message || 'Check-in failed');
      const data = await response.json();
      toast.success('Check-in successful!', { description: `Welcome to ${data.checkIn.serviceName}` });
      await fetchTodayCheckIns(); fetchActiveSubscriptions(); fetchCheckInHistory(pagination.page);
    } catch (error: any) { toast.error('Check-in Failed', { description: error.message || 'Failed to check in' }); }
    finally { setIsProcessing(false); }
  };

  const handleCheckIn = async () => {
    if (!selectedPlan || !session?.user?.id) { toast.error('Please select a plan'); return; }
    try {
      setIsProcessing(true);
      const response = await fetch('/api/payments/initialize-checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(selectedPlan.totalPrice * 100), email: session.user.email, userId: session.user.id, serviceId: selectedPlan.service._id, serviceName: selectedPlan.service.name, planName: selectedPlan.plan.planName, planType: selectedPlan.plan.planType, durationLabel: selectedPlan.plan.durationLabel, durationInHours: selectedPlan.plan.durationInHours, durationInDays: selectedPlan.plan.durationInDays, selectedRate: selectedPlan.selectedRate, price: selectedPlan.price, wifiIncluded: selectedPlan.wifiIncluded, requiresMembership: selectedPlan.requiresMembership, membershipFee: selectedPlan.membershipFee, membershipPlanName: selectedPlan.membershipPlanName, totalPrice: selectedPlan.totalPrice, selectedHours: selectedPlan.isHourly ? selectedPlan.quantity : undefined, selectedDays: !selectedPlan.isHourly ? selectedPlan.quantity : undefined, isAccessCardBundled: selectedPlan.requiresMembership }) });
      if (!response.ok) throw new Error('Failed to initialize payment');
      const data = await response.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
    } catch (error: any) { toast.error('Payment Error', { description: error.message || 'Failed to process check-in' }); }
    finally { setIsProcessing(false); }
  };

  const handleReverifyPayment = async (checkInId: string) => {
    if (reverifyingIds.has(checkInId)) return;
    setReverifyingIds(prev => new Set(prev).add(checkInId));
    try {
      const paymentResponse = await fetch(`/api/payments/checkin/${checkInId}`);
      if (!paymentResponse.ok) { toast.error('Failed to find payment record'); return; }
      const paymentData = await paymentResponse.json();
      const payment = paymentData.payment;
      let referenceToUse = payment.paystackReference;
      let isLegacyPayment = false;
      if (!referenceToUse && payment.reference) { referenceToUse = payment.reference; isLegacyPayment = true; }
      if (!referenceToUse) { toast.error('No payment reference found'); return; }
      const verifyResponse = await fetch(`/api/payments/verify-status?reference=${referenceToUse}`);
      if (!verifyResponse.ok) {
        if (isLegacyPayment) {
          toast.error('Payment verification failed. This payment has been marked as failed.');
          await fetch(`/api/checkin/${checkInId}`, { method: 'DELETE' });
          await fetch(`/api/payments/${payment._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed' }) });
          fetchCheckInHistory();
        } else { toast.error('Failed to verify payment status'); }
        return;
      }
      const verifyData = await verifyResponse.json();
      if (verifyData.status === 'success') {
        await fetch(`/api/checkin/${checkInId}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'checked_in', paymentStatus: 'completed' }) });
        await fetch(`/api/payments/${payment._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed', paidAt: verifyData.paidAt, amount: verifyData.amount }) });
        toast.success('Payment verified successfully!'); fetchCheckInHistory();
      } else if (verifyData.status === 'failed' || verifyData.status === 'error') {
        await fetch(`/api/checkin/${checkInId}`, { method: 'DELETE' });
        await fetch(`/api/payments/${payment._id}/update-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed' }) });
        toast.error('Payment failed. Please try checking in again.'); fetchCheckInHistory();
      } else { toast.info('Payment is still processing. Please try again later.'); }
    } catch (error) { console.error('Error reverifying payment:', error); toast.error('Failed to reverify payment'); }
    finally { setReverifyingIds(prev => { const newSet = new Set(prev); newSet.delete(checkInId); return newSet; }); }
  };

  const confirmCheckout = async () => {
    if (!pendingCheckoutId) { toast.error('Error: Check-in ID not found'); return; }
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/checkin/${pendingCheckoutId}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to checkout');
      const data = await response.json();
      toast.success('Checked out successfully', { description: `${data.checkIn.serviceName} - ${data.checkIn.planName}` });
      setCheckoutConfirmDialog(false); setPendingCheckoutId(null); setCheckoutRecord(null); fetchCheckInHistory(pagination.page);
    } catch (error: any) { toast.error('Checkout Error', { description: error.message || 'Failed to complete checkout' }); }
    finally { setIsProcessing(false); }
  };

  const handleCheckout = async (checkInId: string, checkIn: CheckInRecord) => { setPendingCheckoutId(checkInId); setCheckoutRecord(checkIn); setCheckoutConfirmDialog(true); };

  if (!session) {
    return <div className="flex items-center justify-center py-12"><Card className="p-6 text-center max-w-sm"><AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" /><h2 className="text-lg font-bold mb-1">Sign In Required</h2><p className="text-sm text-muted-foreground mb-3">Sign in to check in to a service.</p><Button asChild><a href="/auth/login">Sign In</a></Button></Card></div>;
  }

  if (checkingMembership || loading) {
    return <div className="flex items-center justify-center py-12"><div className="text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" /><p className="text-sm text-muted-foreground">Loading services...</p></div></div>;
  }

  return (
    <motion.div className="px-3 py-3 max-w-[1400px] mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-3">
        <h1 className="text-lg font-bold mb-0.5">Check In & History</h1>
        <p className="text-xs text-muted-foreground">
          Check in to services or view history
          {userMembership?.hasMembership && <span className="ml-2 text-green-600 font-semibold">• ⭐ Member rates available</span>}
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="check-in" className="text-xs"><List className="w-3.5 h-3.5 md:hidden mr-1" />Check In</TabsTrigger><TabsTrigger value="history" className="text-xs"><History className="w-3.5 h-3.5 md:hidden mr-1" />History</TabsTrigger></TabsList>

        {/* Check In Tab */}
        <TabsContent value="check-in" className="mt-3">
          <CheckinDurationMonitor />
          {/* Server time — compact inline */}
          <Card className="mb-3 p-2.5 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
            <div className="flex gap-2 items-center">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Server Time (WAT):</span> <span className="font-mono font-bold">{serverTime.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</span> — Check-in times use server timezone.
              </p>
            </div>
          </Card>

          {/* Active Subscriptions — compact */}
          {activeSubscriptions.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="p-3 mb-3">
                <h2 className="text-base font-bold mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Active Subscriptions</h2>
                <div className="space-y-2">
                  {activeSubscriptions.map((subscription) => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const todayCheckIn = subscription.checkIns?.find((checkIn: any) => { const d = new Date(checkIn.checkedInAt); d.setHours(0,0,0,0); return d.getTime() === today.getTime() && checkIn.status === 'checked_in'; });
                    const usedCount = subscription.usage?.usedCount ?? (subscription.checkIns?.length || 0);
                    const isHourlySub = subscription.usage?.unit === 'hours' || !!subscription.durationInHours;
                    const remaining = typeof subscription.usage?.remaining !== 'undefined' ? subscription.usage.remaining : (isHourlySub ? Math.max((subscription.durationInHours || 0) - usedCount, 0) : (subscription.durationInDays ? Math.max(subscription.durationInDays - usedCount, 0) : undefined));
                    return (
                      <div key={subscription._id} className="border rounded-lg p-2.5 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0"><h3 className="font-semibold text-sm">{subscription.serviceName}</h3><p className="text-[11px] text-muted-foreground truncate">{(subscription.durationLabel || (subscription.durationInDays ? `${subscription.durationInDays} Days` : ''))} • {subscription.planName} • {subscription.selectedRate}</p></div>
                          <div className="text-right flex-shrink-0"><p className="font-semibold text-sm">{formatPrice(subscription.totalAmount || subscription.amountPerDay)}</p><p className="text-[10px] text-muted-foreground">{isHourlySub ? `${usedCount} used • ${remaining} hrs left` : `${usedCount} used${typeof remaining !== 'undefined' ? ` • ${remaining} left` : ''}`}</p></div>
                        </div>
                        {todayCheckIn ? (
                          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Checked in today</div>
                        ) : (
                          <Button onClick={() => handleSubscriptionCheckIn(subscription._id)} disabled={isProcessing || (typeof remaining === 'number' && remaining <= 0)} className="w-full h-8 text-xs"><LogOut className="w-3.5 h-3.5 mr-1" />Check In Today</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {services.length === 0 ? (
            <Card className="p-6 text-center"><p className="text-sm text-muted-foreground">No services available</p></Card>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <motion.div key={service._id} variants={itemVariants}>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold">{service.name}</h2>
                      {todayCheckIns[service._id] && <Badge className="bg-green-500 text-white text-[10px] py-0.5 px-1.5 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Paid Today</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3">{service.description || service.category || 'Premium workspace'}</p>
                    <div className="space-y-3">
                      {service.pricingPlans.map((plan, idx) => {
                        const availableRates = getAvailableRates(plan);
                        return (
                          <motion.div key={idx} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.04 }}>
                            <div className="border rounded-lg p-2.5 space-y-2">
                              <div className="flex items-start justify-between">
                                <div><h3 className="font-bold text-sm">{plan.planName}</h3><p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.durationLabel}</p><p className="text-[10px] text-muted-foreground">Type: {plan.planType}</p></div>
                                {availableRates.length > 0 && (
                                  <div className="text-right flex-shrink-0"><p className="text-[10px] text-muted-foreground">From</p><p className="text-sm font-bold">{formatPrice(Math.min(...availableRates.map(r => r.price)))}</p></div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {availableRates.map((rate, rateIdx) => {
                                  const membershipFee = rate.requiresMembership ? plan.accessCardFee || 0 : 0;
                                  const displayPrice = rate.price + membershipFee;
                                  return (
                                    <motion.button key={rate.type} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rateIdx * 0.04 }} onClick={() => handlePlanSelection(service, plan, rate.type, rate.price, rate.wifiIncluded, rate.requiresMembership)} className={`p-2.5 rounded-lg border text-left transition-all ${selectedPlan?.service._id === service._id && selectedPlan?.plan.planName === plan.planName && selectedPlan?.selectedRate === rate.type ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0"><div className="flex items-baseline gap-1.5 flex-wrap"><p className="font-semibold text-xs">{formatPrice(displayPrice)}</p>{membershipFee > 0 && <p className="text-[10px] text-amber-600">({formatPrice(rate.price)} + {formatPrice(membershipFee)})</p>}</div><p className="text-[10px] text-muted-foreground truncate">{rate.label}</p>{rate.description && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">{rate.wifiIncluded ? <><Wifi className="w-2.5 h-2.5" /> {rate.description}</> : <><WifiOff className="w-2.5 h-2.5" /> {rate.description}</>}</p>}{rate.requiresMembership && !userMembership?.hasMembership && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">+ Get membership card</p>}</div>
                                        {rate.badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${rate.badge.includes('⭐') ? 'text-green-600 bg-green-50 dark:bg-green-950' : 'text-amber-600 bg-amber-50 dark:bg-amber-950'}`}>{rate.badge}</span>}
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                              {plan.accessCardFee && <p className="text-[10px] text-amber-600 italic">*Access card fee: {formatPrice(plan.accessCardFee)}</p>}
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

        {/* History Tab */}
        <TabsContent value="history" className="mt-3">
          {historyLoading ? (
            <div className="flex items-center justify-center py-10"><div className="text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-primary" /><p className="text-sm text-muted-foreground">Loading check-in history...</p></div></div>
          ) : checkInHistory.length === 0 ? (
            <Card className="p-6 text-center"><Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><h3 className="text-sm font-semibold mb-1">No Check-Ins Yet</h3><p className="text-xs text-muted-foreground">Head to the Check In tab to get started!</p></Card>
          ) : (
            <div className="space-y-2">
              {checkInHistory.map((checkIn) => {
                const checkedInDate = new Date(checkIn.checkedInAt);
                const today = new Date();
                const isToday = checkedInDate.toDateString() === today.toDateString();
                return (
                  <motion.div key={checkIn._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Card className="p-2.5 border-l-4 border-l-green-500">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm">{checkIn.serviceName}</h3>
                            {isToday && !checkIn.checkedOutAt && <Badge className="bg-green-500 text-white text-[10px] py-0 px-1.5"><CheckCircle className="w-2.5 h-2.5" /> Today</Badge>}
                            {checkIn.paymentStatus === 'completed' ? <Badge className="bg-gray-500 text-white text-[10px] py-0 px-1.5">Paid</Badge> : checkIn.paymentStatus === 'pending' ? <Badge variant="outline" className="text-[10px] py-0 px-1.5"><Clock className="w-2.5 h-2.5 mr-0.5" />Pending</Badge> : <Badge variant="destructive" className="text-[10px] py-0 px-1.5">Failed</Badge>}
                            {checkIn.checkedOutAt && <Badge className="bg-blue-500 text-white text-[10px] py-0 px-1.5"><LogOut className="w-2.5 h-2.5" />Out</Badge>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div><p className="text-muted-foreground">Plan</p><p className="font-medium">{checkIn.planName}</p></div>
                            <div><p className="text-muted-foreground">Duration</p><p className="font-medium">{checkIn.durationLabel}</p></div>
                            <div><p className="text-muted-foreground">Check-In</p><p className="font-medium">{checkedInDate.toLocaleDateString()} {checkedInDate.toLocaleTimeString()}</p></div>
                            <div><p className="text-muted-foreground">Amount</p><p className="font-medium text-primary">₦{checkIn.amount?.toLocaleString() || '0'}</p></div>
                          </div>
                          {checkIn.checkedOutAt && <p className="text-[10px] text-muted-foreground mt-1"><LogOut className="w-2.5 h-2.5 inline mr-0.5" />Checked out: {new Date(checkIn.checkedOutAt).toLocaleString()}</p>}
                          {!checkIn.checkedOutAt && checkIn.paymentStatus === 'completed' && <div className="mt-1.5 pt-1.5 border-t flex items-center gap-2"><Button size="sm" variant="default" onClick={() => handleCheckout(checkIn._id, checkIn)} className="h-6 px-2 text-[11px]"><LogOut className="w-3 h-3 mr-1" />Check Out</Button><span className="text-[10px] text-muted-foreground">{Math.floor((new Date().getTime() - checkedInDate.getTime()) / (1000 * 60))} min ago</span></div>}
                          {checkIn.paymentStatus === 'pending' && <div className="mt-1.5 pt-1.5 border-t flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => handleReverifyPayment(checkIn._id)} disabled={reverifyingIds.has(checkIn._id)} className="h-6 px-2 text-[11px]">{reverifyingIds.has(checkIn._id) ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying</> : <><AlertCircle className="w-3 h-3 mr-1" />Reverify</>}</Button><span className="text-[10px] text-muted-foreground">Processing</span></div>}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              {pagination.total > pagination.limit && (
                <div className="flex justify-center gap-2 mt-3">
                  <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => fetchCheckInHistory(pagination.page - 1)}>Previous</Button>
                  <span className="flex items-center text-xs text-muted-foreground">Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
                  <Button variant="outline" size="sm" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => fetchCheckInHistory(pagination.page + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Check In Confirmation Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check In Confirmation</DialogTitle>
            <DialogDescription>Review and proceed to payment</DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-3 pt-3 text-white">
              <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Service</p>
                  <p className="text-sm font-bold">{selectedPlan.service.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Plan</p>
                  <p className="text-sm font-bold">{selectedPlan.appliedPlanName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-bold">
                    {selectedPlan.isHourly
                      ? `${selectedPlan.quantity} Hour${selectedPlan.quantity > 1 ? 's' : ''}`
                      : selectedPlan.plan.durationLabel
                  }
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-zinc-400">Type:</span>
                  <span className="text-xs font-bold capitalize">{selectedPlan.selectedRate}</span>
                  <div className="h-3 w-px bg-white/10" />
                  {selectedPlan.wifiIncluded ? (
                    <span className="text-green-500 text-xs flex items-center gap-0.5">
                      <Wifi className="w-3 h-3" /> WiFi
                    </span>
                  ) : (
                    <span className="text-amber-500 text-xs flex items-center gap-0.5">
                      <WifiOff className="w-3 h-3" /> No WiFi
                    </span>
                  )}
                </div>
              </div>
              {selectedPlan.isHourly || selectedPlan.isDaily ? (
                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold">{selectedPlan.isHourly ? 'Hours:' : 'Days:'}</span>
                  <Select
                    value={selectedQuantity.toString()}
                    onValueChange={(value) => {
                      const qty = parseInt(value)
                      setSelectedQuantity(qty)
                      const { finalPlan, finalQuantity, finalPrice } = calculateBestPrice(
                        selectedPlan.service,
                        selectedPlan.plan,
                        selectedPlan.selectedRate,
                        qty
                      )
                      const newTotal = (finalPrice * finalQuantity) + (selectedPlan.membershipFee || 0)
                      setSelectedPlan({
                        ...selectedPlan,
                        quantity: finalQuantity,
                        totalPrice: newTotal,
                        price: finalPrice,
                        appliedPlanName: finalPlan.planName,
                      })
                    }}
                  >
                    <SelectTrigger className="w-[100px] bg-[#222] border-white/10 text-white rounded-lg h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#222] border-white/10 text-white">
                      {Array.from({ length: 9 }, (_, i) => i + 1).map((val) => (
                        <SelectItem key={val} value={val.toString()}>
                          {val} {selectedPlan.isHourly ? (val === 1 ? 'Hour' : 'Hours') : (val === 1 ? 'Day' : 'Days')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {selectedPlan.appliedPlanName !== selectedPlan.plan.planName && (
                <div className="text-[10px] text-amber-300/80 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 shrink-0" />
                  <p>
                    <span className="font-bold">Plan Upgrade!</span> Switched to{' '}
                    <span className="font-bold">{selectedPlan.appliedPlanName}</span>.
                  </p>
                </div>
              )}
              {selectedPlan.membershipFee ? (
                <div className="p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Base ({selectedPlan.quantity}x)</span>
                    <span className="font-semibold">{formatPrice((selectedPlan.price || 0) * selectedPlan.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>{selectedPlan.membershipPlanName || 'Access Card'}</span>
                    <span className="font-semibold">{formatPrice(selectedPlan.membershipFee)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-1" />
                  <p className="text-xs text-zinc-500 font-medium">Total</p>
                  <p className="text-2xl font-black tracking-tight text-white">
                    {formatPrice(selectedPlan.totalPrice)}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-white/10">
                  <p className="text-xs text-zinc-500 font-medium">Total</p>
                  <p className="text-2xl font-black tracking-tight text-white">
                    {formatPrice(selectedPlan.totalPrice)}
                  </p>
                </div>
              )}
              {selectedPlan.membershipFee ? (
                <div className="bg-[#0f172a] border border-blue-500/20 p-3 rounded-xl flex gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400 leading-normal">
                    {selectedPlan.membershipPlanName ? (
                      <>
                        Your <span className="font-semibold">{selectedPlan.membershipPlanName}</span> (
                        {formatPrice(selectedPlan.membershipFee)}) is included.
                      </>
                    ) : (
                      `Your membership card fee (${formatPrice(selectedPlan.membershipFee)}) is included.`
                    )}
                    After payment, you'll use member rates.
                  </p>
                </div>
              ) : (
                selectedPlan.subscriptionCovered && selectedPlan.selectedRate === 'member' && (
                  <div className="bg-[#064e3b]/20 border border-green-500/20 p-3 rounded-xl flex gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400">
                      Active Membership Applied — member rates applied, no extra fees!
                    </p>
                  </div>
                )
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlan(null)}
                  disabled={isProcessing}
                  className="flex-1 h-10 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                  className="flex-1 h-10 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" /> Pay & Check In
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicateCheckInDialog} onOpenChange={() => { setDuplicateCheckInDialog(false); setPendingPlan(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-1.5 text-sm"><AlertCircle className="w-4 h-4 text-amber-600" />Duplicate Check-In</DialogTitle><DialogDescription>You've already checked in to this service today</DialogDescription></DialogHeader>
          {pendingPlan && (
            <div className="space-y-2.5 pt-3">
              <Card className="p-3 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-600 font-semibold">Service</p><p className="font-semibold text-sm">{pendingPlan.service.name}</p>
                <p className="text-xs text-amber-600 font-semibold mt-1">Plan</p><p className="font-semibold text-sm">{pendingPlan.plan.planName}</p>
              </Card>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-2.5 rounded-lg"><p className="text-xs text-yellow-800 dark:text-yellow-200"><strong>Warning:</strong> Already checked in today ({new Date().toLocaleDateString()}). Continuing charges again.</p></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setDuplicateCheckInDialog(false); setPendingPlan(null); }} className="flex-1 h-8 text-xs">Cancel</Button>
                <Button onClick={() => { if (pendingPlan) setSelectedPlan(pendingPlan); setDuplicateCheckInDialog(false); setPendingPlan(null); }} className="flex-1 h-8 text-xs">Yes, Check In Again</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={!!checkoutConfirmDialog} onOpenChange={() => { setCheckoutConfirmDialog(false); setPendingCheckoutId(null); setCheckoutRecord(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Confirm Check-Out</DialogTitle><DialogDescription>Are you sure?</DialogDescription></DialogHeader>
          {checkoutRecord && (
            <div className="space-y-2.5 pt-3">
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div><p className="text-xs text-muted-foreground">Service</p><p className="font-semibold text-sm">{checkoutRecord.serviceName}</p></div>
                <div><p className="text-xs text-muted-foreground">Plan</p><p className="font-semibold text-sm">{checkoutRecord.planName}</p></div>
                <div className="flex items-center gap-1.5 pt-1.5 border-t"><LogOut className="w-3.5 h-3.5 text-blue-500" /><div><p className="text-xs text-muted-foreground">Session Duration</p><p className="font-semibold text-xs">{Math.floor((new Date().getTime() - new Date(checkoutRecord.checkedInAt).getTime()) / (1000 * 60))} min</p></div></div>
              </div>
              <p className="text-xs text-muted-foreground">You'll be checked out and session recorded.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setCheckoutConfirmDialog(false); setPendingCheckoutId(null); setCheckoutRecord(null); }} className="flex-1 h-8 text-xs">Cancel</Button>
                <Button onClick={confirmCheckout} disabled={isProcessing} className="flex-1 h-8 text-xs flex items-center justify-center gap-1">{isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}Confirm</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
