'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

interface MembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembershipModal({ open, onOpenChange }: MembershipModalProps) {
  const [services, setServices] = useState<ServiceMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchMemberships = async () => {
      try {
        setLoading(true);
        setError(null);

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

        // Filter out services without membership plans
        const servicesWithValidMemberships = servicesWithMemberships.filter(
          (s) => s.membershipPlans.length > 0
        );

        setServices(servicesWithValidMemberships);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Available Memberships</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading membership options...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No membership options available at this time</p>
          </div>
        ) : (
          <div className="space-y-8">
            {services.map((service) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-foreground">{service.name} Memberships</h3>

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
                          <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {plan.duration} days
                          </p>

                          <div className="mb-4">
                            <span className="text-3xl font-bold text-primary">
                              {formatPrice(plan.price)}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              /{plan.duration} days
                            </span>
                          </div>

                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {plan.description}
                            </p>
                          )}

                          {plan.features && plan.features.length > 0 && (
                            <ul className="space-y-2 text-sm">
                              {plan.features.map((feature, featureIdx) => (
                                <li key={featureIdx} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">✓</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <Button
                          className="w-full mt-6"
                          onClick={() => {
                            // You can add payment integration here
                            // For now, we're just closing the modal
                            // In production, this would redirect to payment or show a nested modal
                            onOpenChange(false);
                          }}
                        >
                          Subscribe Now
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
