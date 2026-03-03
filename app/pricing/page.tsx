'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sunrise, Moon, Clock, Hourglass, Sun, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  requiresMembershipCard: boolean;
  accessCardFee?: number;
}

interface MembershipPlan {
  _id?: string;
  name: string;
  duration: number; // in days
  price: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

interface Service {
  _id: string;
  name: string;
  category: string;
  pricingPlans: PricingPlan[];
  membershipPlans?: MembershipPlan[];
}

export default function Pricing() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services?includeInactive=false');
        if (response.ok) {
          const data: Service[] = await response.json();
          
          // Fetch membership plans for each service
          const servicesWithMembership = await Promise.all(
            data.map(async (service) => {
              try {
                const membershipResponse = await fetch(
                  `/api/services/${service._id}/membership-plans`
                );
                if (membershipResponse.ok) {
                  const membershipPlans: MembershipPlan[] = await membershipResponse.json();
                  return { ...service, membershipPlans };
                }
              } catch (error) {
                console.error(`Error fetching membership plans for ${service.name}:`, error);
              }
              return service;
            })
          );
          
          setServices(servicesWithMembership);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load pricing information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const membershipTier = {
    name: 'Annual Membership',
    price: '₦2,500',
    period: '/year',
    description: 'Perfect for regular users who want consistent access',
    features: [
      'Priority access to workspaces',
      'Member-exclusive pricing rates',
      'Community benefits',
      '365 days validity',
      'Discount on all plans',
    ],
    cta: 'Become a Member',
    highlighted: false,
  };

  const planTypes = [
    {
      title: 'Day Plans',
      description: 'Morning to evening workspace access',
      icon: Sunrise,
    },
    {
      title: 'Night Plans',
      description: 'Evening to late night access',
      icon: Moon,
    },
    {
      title: '24-Hour Plans',
      description: 'Round-the-clock access',
      icon: Clock,
    },
    {
      title: 'Hourly Plans',
      description: 'Pay per hour of usage',
      icon: Hourglass,
    },
    {
      title: 'Half-Day Plans',
      description: '4-hour focused work session',
      icon: Sun,
    },
    {
      title: 'Weekly & Monthly',
      description: 'Extended access plans',
      icon: Calendar,
    },
  ];

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return '₦' + price.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Flexible Pricing</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Choose the plan that fits your schedule and budget
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading pricing plans...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No services available at the moment</p>
            </div>
          ) : (
            <>
              {/* Service Membership Cards */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center">Annual Memberships</h2>
                <motion.div
                  className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  {services.flatMap((service) =>
                    (service.membershipPlans || []).filter(plan => plan.isActive !== false).map((plan, planIdx) => (
                      <motion.div
                        key={`${service._id}-membership-${planIdx}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: planIdx * 0.1 }}
                      >
                        <Card className="p-8 h-full transition-all border-primary bg-primary/5 ring-2 ring-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                          <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{service.name}</p>
                          <div className="mb-6">
                            <span className="text-4xl font-bold">₦{plan.price?.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-2">/{plan.duration} days</span>
                          </div>
                          {plan.description && (
                            <p className="text-muted-foreground mb-6">{plan.description}</p>
                          )}
                          {plan.features && plan.features.length > 0 && (
                            <ul className="space-y-3 mb-8">
                              {plan.features.map((feature, featureIdx) => (
                                <li key={featureIdx} className="flex items-center gap-2 text-sm">
                                  <span className="text-primary">✓</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                          <Link href="/auth/register">
                            <Button className="w-full">Become a Member</Button>
                          </Link>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>

              {/* Service Pricing Plans */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-center">Service Pricing</h2>
                <motion.div
                  className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  {services.map((service, serviceIdx) =>
                    service.pricingPlans.map((plan, planIdx) => (
                      <motion.div
                        key={`${service._id}-${planIdx}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (serviceIdx + planIdx) * 0.1 }}
                      >
                        <Card className="p-8 h-full transition-all border-border hover:shadow-lg hover:-translate-y-1">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{plan.planName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {service.name} • {plan.durationLabel}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">Type: {plan.planType}</p>
                            </div>

                            {/* Pricing Grid */}
                            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                              {plan.flatPrice && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Flat Rate:</span>
                                  <span className="font-bold text-lg">{formatPrice(plan.flatPrice)}</span>
                                </div>
                              )}
                              {plan.memberPrice && (
                                <div className="flex justify-between items-center border-t pt-2">
                                  <span className="text-sm font-medium">Member Rate:</span>
                                  <span className="font-bold text-lg text-green-600">{formatPrice(plan.memberPrice)}</span>
                                </div>
                              )}
                              {plan.nonMemberPrice && (
                                <div className="flex justify-between items-center border-t pt-2">
                                  <span className="text-sm font-medium">Non-Member Rate:</span>
                                  <span className="font-bold text-lg">{formatPrice(plan.nonMemberPrice)}</span>
                                </div>
                              )}
                              {plan.nonWifiPrice && (
                                <div className="flex justify-between items-center border-t pt-2">
                                  <span className="text-sm font-medium">Non-WiFi Rate:</span>
                                  <span className="font-bold text-lg">{formatPrice(plan.nonWifiPrice)}</span>
                                </div>
                              )}
                              {plan.nonWifiPriceMember && (
                                <div className="flex justify-between items-center border-t pt-2">
                                  <span className="text-sm font-medium">Non-WiFi Member:</span>
                                  <span className="font-bold text-lg text-green-600">{formatPrice(plan.nonWifiPriceMember)}</span>
                                </div>
                              )}
                              {plan.nonWifiPriceNonMember && (
                                <div className="flex justify-between items-center border-t pt-2">
                                  <span className="text-sm font-medium">Non-WiFi Non-Member:</span>
                                  <span className="font-bold text-lg">{formatPrice(plan.nonWifiPriceNonMember)}</span>
                                </div>
                              )}
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-2 text-sm">
                              {plan.isPerHead && (
                                <p className="flex items-center gap-2">
                                  <span className="text-primary">✓</span>
                                  Per-head pricing
                                </p>
                              )}
                              {plan.requiresMembershipCard && (
                                <p className="flex items-center gap-2">
                                  <span className="text-primary">✓</span>
                                  Requires membership card
                                </p>
                              )}
                              {plan.accessCardFee && (
                                <p className="flex items-center gap-2">
                                  <span className="text-amber-600">•</span>
                                  Access card fee: {formatPrice(plan.accessCardFee)}
                                </p>
                              )}
                            </div>

                            <Link href="/user/bookings">
                              <Button className="w-full" variant="default">
                                Book Now
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Plan Types Grid */}
      <section className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Plan Types</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Multiple options to match your work style
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {planTypes.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 text-center h-full hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-2 group cursor-pointer">
                  <plan.icon className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-125 transition-transform duration-300" />
                  <h3 className="font-semibold mb-2">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Custom Pricing?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Contact us for group bookings, corporate packages, or special arrangements
            </p>
            <Link href="/contact">
              <Button size="lg">Get in Touch</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
