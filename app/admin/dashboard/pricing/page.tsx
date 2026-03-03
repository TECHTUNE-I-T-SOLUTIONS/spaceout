'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CreatePricingModal } from '@/components/modals/create-pricing-modal';
import { Edit2, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Pricing {
  _id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: string;
  features: string[];
  branchId: { _id: string; name: string };
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<Pricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricingPlans(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) return;

    try {
      const response = await fetch(`/api/pricing/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Pricing plan deleted successfully');
        fetchPricingPlans();
      } else {
        toast.error('Failed to delete pricing plan');
      }
    } catch (error) {
      toast.error('Error deleting pricing plan');
    }
  };

  const formatBillingPeriod = (period: string) => {
    const map: { [key: string]: string } = {
      hourly: 'per hour',
      daily: 'per day',
      monthly: 'per month',
      yearly: 'per year',
    };
    return map[period] || period;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground mt-1">All prices are in Nigerian Naira (₦)</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Pricing Plan</Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading pricing plans...</p>
        </Card>
      ) : pricingPlans.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Pricing Plans Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first pricing plan to allow bookings and payments.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Plan</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`p-6 transition-all ${plan.isFeatured ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-lg'}`}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>
                    {plan.isFeatured && (
                      <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 px-2 py-1 rounded text-xs font-semibold">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-3xl font-bold">
                      ₦{plan.price.toLocaleString()}
                      <span className="text-lg font-normal text-muted-foreground">
                        {' '}/{formatBillingPeriod(plan.billingPeriod)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted p-2 rounded text-sm">
                    <p className="font-semibold text-xs mb-2">Branch:</p>
                    <p className="text-muted-foreground">{plan.branchId?.name}</p>
                  </div>

                  {plan.features.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-xs">Features:</p>
                      <ul className="text-xs space-y-1">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            ✓ {feature}
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-muted-foreground">
                            +{plan.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(plan._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreatePricingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchPricingPlans}
      />
    </motion.div>
  );
}
