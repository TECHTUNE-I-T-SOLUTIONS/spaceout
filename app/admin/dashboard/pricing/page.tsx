'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CreatePricingModal } from '@/components/modals/create-pricing-modal';
import { DeleteConfirmModal } from '@/components/modals/delete-confirm-modal';
import { Edit2, Trash2 } from 'lucide-react';
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
  isPerHead: boolean;
  requiresMembershipCard: boolean;
  accessCardFee?: number;
}

interface Service {
  _id: string;
  name: string;
  category: string;
  branchId: { _id: string; name: string };
  pricingPlans: PricingPlan[];
}

interface PricingPlanWithService extends PricingPlan {
  serviceId: string;
  serviceName: string;
  planIndex: number;
  branchName: string;
}

type AllPricingPlans = PricingPlanWithService;

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<AllPricingPlans[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<{
    serviceId: string;
    planIndex: number;
    plan: PricingPlan;
  } | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ 
    serviceId: string; 
    planIndex: number; 
    planName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pricing plans from services (all pricing is now stored in services)
      const servicesResponse = await fetch('/api/services?includeInactive=true');
      const allPlans: AllPricingPlans[] = [];
      
      if (servicesResponse.ok) {
        const services: Service[] = await servicesResponse.json();
        
        // Add pricing plans from services
        services.forEach(service => {
          service.pricingPlans.forEach((plan, index) => {
            allPlans.push({
              ...plan,
              serviceId: service._id,
              serviceName: service.name,
              planIndex: index,
              branchName: service.branchId?.name || 'Unknown Branch',
            });
          });
        });
      }

      // Sort by creation date (newest first)
      allPlans.sort((a, b) => {
        const dateA = new Date((a as any).createdAt || 0).getTime();
        const dateB = new Date((b as any).createdAt || 0).getTime();
        return dateB - dateA;
      });

      setPricingPlans(allPlans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan: AllPricingPlans) => {
    const newPlan = plan as PricingPlanWithService;
    setEditingPlan({
      serviceId: newPlan.serviceId,
      planIndex: newPlan.planIndex,
      plan: {
        planName: newPlan.planName,
        planType: newPlan.planType,
        durationLabel: newPlan.durationLabel,
        durationInHours: newPlan.durationInHours,
        durationInDays: newPlan.durationInDays,
        flatPrice: newPlan.flatPrice,
        memberPrice: newPlan.memberPrice,
        nonMemberPrice: newPlan.nonMemberPrice,
        isPerHead: newPlan.isPerHead,
        requiresMembershipCard: newPlan.requiresMembershipCard,
        accessCardFee: newPlan.accessCardFee,
      },
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (plan: AllPricingPlans) => {
    const newPlan = plan as PricingPlanWithService;
    setPlanToDelete({
      serviceId: newPlan.serviceId,
      planIndex: newPlan.planIndex,
      planName: newPlan.planName,
    });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      // Delete pricing plan from service
      const response = await fetch(
        `/api/services/${planToDelete.serviceId}/pricing`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planIndex: planToDelete.planIndex }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete pricing plan');
      } else {
        toast.success('Pricing plan deleted successfully');
        fetchPricingPlans();
      }
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      toast.error('Error deleting pricing plan');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
    }
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
          {pricingPlans.map((plan) => {
            const newPlan = plan as PricingPlanWithService;

            return (
              <motion.div
                key={`${newPlan.serviceId}-${newPlan.planIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold">{newPlan.planName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {newPlan.serviceName} • {newPlan.durationLabel}
                      </p>
                    </div>

                    <div className="bg-muted p-2 rounded text-sm space-y-1">
                      <p className="font-semibold text-xs">Branch: {newPlan.branchName}</p>
                      <p className="text-xs text-muted-foreground">Type: {newPlan.planType}</p>
                    </div>

                    <div className="border-t pt-2">
                      <p className="font-semibold text-xs mb-2">Pricing:</p>
                      <div className="space-y-1 text-sm">
                        {newPlan.flatPrice && (
                          <p className="text-muted-foreground">
                            Flat: <span className="font-semibold">₦{newPlan.flatPrice.toLocaleString()}</span>
                          </p>
                        )}
                        {newPlan.memberPrice && (
                          <p className="text-muted-foreground">
                            Member: <span className="font-semibold">₦{newPlan.memberPrice.toLocaleString()}</span>
                          </p>
                        )}
                        {newPlan.nonMemberPrice && (
                          <p className="text-muted-foreground">
                            Non-Member: <span className="font-semibold">₦{newPlan.nonMemberPrice.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {newPlan.requiresMembershipCard && (
                      <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded text-xs text-amber-800 dark:text-amber-200">
                        ✓ Requires Membership Card
                        {newPlan.accessCardFee && (
                          <>
                            <br />
                            Card Fee: ₦{newPlan.accessCardFee.toLocaleString()}
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteClick(plan)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreatePricingModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingPlan(null);
        }}
        onSuccess={fetchPricingPlans}
        editingPlan={editingPlan}
      />

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Pricing Plan"
        description="Are you sure you want to delete this pricing plan? This action cannot be undone."
        itemName={planToDelete?.planName}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
}
