'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MembershipPlan {
  _id?: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

interface ServiceMembership {
  _id: string;
  name: string;
  membershipPlans: MembershipPlan[];
}

interface ServiceWithAccessFee {
  _id: string;
  name: string;
  pricingPlans: Array<{
    planName: string;
    accessCardFee?: number;
  }>;
}

interface UserSubscription {
  serviceName: string;
  planName: string;
  status: string;
}

interface MembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembershipModal({ open, onOpenChange }: MembershipModalProps) {
  const [services, setServices] = useState<ServiceMembership[]>([]);
  const [servicesWithAccessFees, setServicesWithAccessFees] = useState<ServiceWithAccessFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ service: string; plan: MembershipPlan } | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);

  useEffect(() => {
    if (!open) return;

    const fetchMemberships = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user subscriptions
        const subscriptionsResponse = await fetch('/api/user/subscriptions');
        if (subscriptionsResponse.ok) {
          const subscriptionsData = await subscriptionsResponse.json();
          setUserSubscriptions(subscriptionsData.subscriptions || []);
        }

        // Fetch all services
        const servicesResponse = await fetch('/api/services?includeInactive=false');
        if (!servicesResponse.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesResponse.json();

        // Fetch membership plans for each service
        const servicesWithMemberships = await Promise.all(
          servicesData.map(async (service: any) => {
            try {
              const membershipResponse = await fetch(
                `/api/services/${service._id}/membership-plans`
              );
              if (membershipResponse.ok) {
                const membershipPlans = await membershipResponse.json();
                return {
                  _id: service._id,
                  name: service.name,
                  membershipPlans: membershipPlans.filter((plan: any) => plan.isActive !== false),
                };
              }
              return {
                _id: service._id,
                name: service.name,
                membershipPlans: [],
              };
            } catch (err) {
              return {
                _id: service._id,
                name: service.name,
                membershipPlans: [],
              };
            }
          })
        );

        // Filter services with membership plans
        const servicesWithValidMemberships = servicesWithMemberships.filter(
          (s) => s.membershipPlans.length > 0
        );

        // Find services that have plans with access card fees
        const servicesWithAccessFeesList = servicesData
          .map((service: any) => ({
            _id: service._id,
            name: service.name,
            pricingPlans: service.pricingPlans || [],
          }))
          .filter((service: ServiceWithAccessFee) =>
            service.pricingPlans.some((plan) => plan.accessCardFee && plan.accessCardFee > 0)
          );

        setServices(servicesWithValidMemberships);
        setServicesWithAccessFees(servicesWithAccessFeesList);
      } catch (err: any) {
        setError(err.message || 'Failed to load membership options');
        console.error('Error fetching memberships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [open]);

  const formatPrice = (price: number) => {
    return '₦' + price.toLocaleString();
  };

  const hasPurchasedPlan = (serviceName: string, planName: string): boolean => {
    return userSubscriptions.some(
      (sub) => 
        sub.serviceName === serviceName && 
        sub.planName === planName && 
        sub.status === 'active'
    );
  };

  const handleUpgradePayment = async (service: ServiceMembership, plan: MembershipPlan) => {
    try {
      setProcessingPayment(true);
      setSelectedPlan({ service: service.name, plan });

      // Initiate payment
      const response = await fetch('/api/payments/initialize-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan._id,
          planName: plan.name,
          serviceName: service.name,
          serviceId: service._id,
          amount: plan.price,
          duration: plan.duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initialize payment');
      }

      const { authorization_url } = await response.json();
      
      // Redirect to Paystack payment page
      if (authorization_url) {
        window.location.href = authorization_url;
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error('Payment Error', {
        description: err.message || 'Failed to process payment',
      });
    } finally {
      setProcessingPayment(false);
      setSelectedPlan(null);
    }
  };

  const handleAccessCardPayment = async (service: ServiceWithAccessFee) => {
    try {
      setProcessingPayment(true);

      const accessFees = service.pricingPlans
        .filter((plan) => plan.accessCardFee && plan.accessCardFee > 0)
        .map((plan) => plan.accessCardFee);
      const uniqueFees = [...new Set(accessFees)];
      const accessFee = uniqueFees[0] || 0;

      // Initiate payment for access card
      const response = await fetch('/api/payments/initialize-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: `${service.name} Card Access`,
          serviceName: service.name,
          serviceId: service._id,
          amount: accessFee,
          duration: 365, // 1 year for access card
          isAccessCard: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initialize payment');
      }

      const { authorization_url } = await response.json();
      
      // Redirect to Paystack payment page
      if (authorization_url) {
        window.location.href = authorization_url;
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error('Payment Error', {
        description: err.message || 'Failed to process payment',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Become an Astronaut</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading options...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : services.length === 0 && servicesWithAccessFees.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No options available at this time</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Membership Plans Section */}
            {services.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">📅 Subscription Plans</h3>
                <div className="space-y-6">
                  {services.map((service) => (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <h4 className="text-base font-semibold text-foreground">{service.name}</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {service.membershipPlans.map((plan, idx) => (
                          <motion.div
                            key={plan._id || idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <Card className="p-6 h-full flex flex-col justify-between hover:border-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                              <div>
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h5 className="font-bold">{plan.name}</h5>
                                    <p className="text-sm text-muted-foreground">{plan.duration} days</p>
                                  </div>
                                  {hasPurchasedPlan(service.name, plan.name) && (
                                    <Badge variant="default" className="bg-green-600 whitespace-nowrap">
                                      Owned
                                    </Badge>
                                  )}
                                </div>

                                <div className="mb-4">
                                  <span className="text-2xl font-bold text-primary">{formatPrice(plan.price)}</span>
                                  <span className="text-muted-foreground ml-2 text-sm">/{plan.duration} days</span>
                                </div>

                                {plan.description && <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>}
                                {plan.features && plan.features.length > 0 && (
                                  <ul className="space-y-2 text-sm">
                                    {plan.features.map((feature, featureIdx) => (
                                      <li key={featureIdx} className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <Button 
                                className="w-full mt-6"
                                disabled={processingPayment && selectedPlan?.plan._id === plan._id}
                                onClick={() => handleUpgradePayment(service, plan)}
                              >
                                {processingPayment && selectedPlan?.plan._id === plan._id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Upgrade Now'
                                )}
                              </Button>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Access Card Section */}
            {servicesWithAccessFees.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t border-border"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">🎫 SpaceOut Card (Become an Astronaut)</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Unlock exclusive member benefits and access these premium services with a SpaceOut Card. Each service has its own access fee:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {servicesWithAccessFees.map((service) => {
                    const accessFees = service.pricingPlans
                      .filter((plan) => plan.accessCardFee && plan.accessCardFee > 0)
                      .map((plan) => plan.accessCardFee);
                    const uniqueFees = [...new Set(accessFees)];

                    return (
                      <motion.div
                        key={service._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="p-5 hover:border-primary hover:shadow-lg transition-all duration-300">
                          <div className="flex items-start justify-between mb-4">
                            <h5 className="font-semibold">{service.name}</h5>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">Card</Badge>
                              {userSubscriptions.some(
                                (sub) => sub.serviceName === service.name && sub.status === 'active' && sub.planName.includes('Card')
                              ) && (
                                <Badge variant="default" className="bg-green-600 text-xs">Owned</Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3 mb-4">
                            {service.pricingPlans
                              .filter((plan) => plan.accessCardFee && plan.accessCardFee > 0)
                              .map((plan, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded">
                                  <span className="text-muted-foreground">Access Fee:</span>
                                  <span className="font-bold text-primary">{formatPrice(plan.accessCardFee || 0)}</span>
                                </div>
                              ))}
                          </div>
                          <p className="text-xs text-muted-foreground mb-4">
                            Covers {service.pricingPlans.filter(p => p.accessCardFee && p.accessCardFee > 0).length} service plans
                          </p>
                          <Button
                            className="w-full"
                            disabled={processingPayment}
                            onClick={() => handleAccessCardPayment(service)}
                          >
                            {processingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Get Card Access'
                            )}
                          </Button>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
