'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreatePricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingPlan?: {
    serviceId: string;
    planIndex: number;
    plan: any;
  } | null;
}

interface Branch {
  _id: string;
  name: string;
  location: string;
}

interface Service {
  _id: string;
  name: string;
  category: string;
}

export function CreatePricingModal({ open, onOpenChange, onSuccess, editingPlan }: CreatePricingModalProps) {
  const [formData, setFormData] = useState({
    branchId: '',
    serviceId: '',
    planName: '',
    planType: 'workspace',
    durationInHours: '',
    durationInDays: '',
    durationLabel: '',
    flatPrice: '',
    memberPrice: '',
    nonMemberPrice: '',
    nonWifiPrice: '',
    nonWifiPriceMember: '',
    nonWifiPriceNonMember: '',
    isPerHead: false,
    requiresMembershipCard: false,
    accessCardFee: '',
    features: '',
    isFeatured: false,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState(true);
  const [isFetchingServices, setIsFetchingServices] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (editingPlan) {
      const plan = editingPlan.plan;
      setFormData({
        branchId: '',
        serviceId: editingPlan.serviceId,
        planName: plan.planName || '',
        planType: plan.planType || 'workspace',
        durationInHours: plan.durationInHours?.toString() || '',
        durationInDays: plan.durationInDays?.toString() || '',
        durationLabel: plan.durationLabel || '',
        flatPrice: plan.flatPrice?.toString() || '',
        memberPrice: plan.memberPrice?.toString() || '',
        nonMemberPrice: plan.nonMemberPrice?.toString() || '',
        nonWifiPrice: plan.nonWifiPrice?.toString() || '',
        nonWifiPriceMember: plan.nonWifiPriceMember?.toString() || '',
        nonWifiPriceNonMember: plan.nonWifiPriceNonMember?.toString() || '',
        isPerHead: plan.isPerHead || false,
        requiresMembershipCard: plan.requiresMembershipCard || false,
        accessCardFee: plan.accessCardFee?.toString() || '',
        features: '',
        isFeatured: false,
      });
    } else {
      setFormData({
        branchId: '',
        serviceId: '',
        planName: '',
        planType: 'workspace',
        durationInHours: '',
        durationInDays: '',
        durationLabel: '',
        flatPrice: '',
        memberPrice: '',
        nonMemberPrice: '',
        nonWifiPrice: '',
        nonWifiPriceMember: '',
        nonWifiPriceNonMember: '',
        isPerHead: false,
        requiresMembershipCard: false,
        accessCardFee: '',
        features: '',
        isFeatured: false,
      });
    }
  }, [editingPlan]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsFetchingBranches(true);
        const response = await fetch('/api/branches');
        if (response.ok) {
          const data = await response.json();
          setBranches(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        toast.error('Failed to load branches');
      } finally {
        setIsFetchingBranches(false);
      }
    };

    if (open) {
      fetchBranches();
    }
  }, [open]);

  // Fetch services when branchId changes
  useEffect(() => {
    const fetchServices = async () => {
      if (!formData.branchId) {
        setServices([]);
        return;
      }
      
      try {
        setIsFetchingServices(true);
        const response = await fetch(`/api/services?branchId=${formData.branchId}`);
        if (response.ok) {
          const data = await response.json();
          setServices(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      } finally {
        setIsFetchingServices(false);
      }
    };

    fetchServices();
  }, [formData.branchId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.serviceId || !formData.planName) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Validate at least one price is set
      const flatPrice = formData.flatPrice ? parseFloat(formData.flatPrice) : 0;
      const memberPrice = formData.memberPrice ? parseFloat(formData.memberPrice) : 0;
      const nonMemberPrice = formData.nonMemberPrice ? parseFloat(formData.nonMemberPrice) : 0;
      const nonWifiPrice = formData.nonWifiPrice ? parseFloat(formData.nonWifiPrice) : 0;
      const nonWifiPriceMember = formData.nonWifiPriceMember ? parseFloat(formData.nonWifiPriceMember) : 0;
      const nonWifiPriceNonMember = formData.nonWifiPriceNonMember ? parseFloat(formData.nonWifiPriceNonMember) : 0;

      if (flatPrice === 0 && memberPrice === 0 && nonMemberPrice === 0 && nonWifiPrice === 0 && nonWifiPriceMember === 0 && nonWifiPriceNonMember === 0) {
        toast.error('Please set at least one price');
        setIsLoading(false);
        return;
      }

      // Validate duration
      const durationHours = formData.durationInHours ? parseInt(formData.durationInHours) : 0;
      const durationDays = formData.durationInDays ? parseInt(formData.durationInDays) : 0;

      if (durationHours === 0 && durationDays === 0) {
        toast.error('Please set either duration in hours or days');
        setIsLoading(false);
        return;
      }

      const accessCardFee = formData.accessCardFee ? parseFloat(formData.accessCardFee) : 0;

      const pricingPlanData = {
        planName: formData.planName,
        planType: formData.planType,
        durationLabel: formData.durationLabel || `${durationHours > 0 ? durationHours + 'h' : durationDays + 'd'}`,
        durationInHours: durationHours > 0 ? durationHours : undefined,
        durationInDays: durationDays > 0 ? durationDays : undefined,
        flatPrice: flatPrice > 0 ? flatPrice : undefined,
        memberPrice: memberPrice > 0 ? memberPrice : undefined,
        nonMemberPrice: nonMemberPrice > 0 ? nonMemberPrice : undefined,
        nonWifiPrice: nonWifiPrice > 0 ? nonWifiPrice : undefined,
        nonWifiPriceMember: nonWifiPriceMember > 0 ? nonWifiPriceMember : undefined,
        nonWifiPriceNonMember: nonWifiPriceNonMember > 0 ? nonWifiPriceNonMember : undefined,
        isPerHead: formData.isPerHead,
        requiresMembershipCard: formData.requiresMembershipCard,
        accessCardFee: formData.requiresMembershipCard && accessCardFee > 0 ? accessCardFee : undefined,
      };

      if (editingPlan) {
        // Update existing pricing plan
        const response = await fetch(`/api/services/${formData.serviceId}/pricing`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planIndex: editingPlan.planIndex,
            planData: pricingPlanData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update pricing plan');
        }

        toast.success('Pricing plan updated successfully!');
      } else {
        // Create new pricing plan
        const response = await fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: formData.serviceId,
            branchId: formData.branchId,
            ...pricingPlanData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create pricing plan');
        }

        toast.success('Pricing plan created and linked to service successfully!');
      }

      setFormData({
        branchId: editingPlan ? formData.branchId : '',
        serviceId: editingPlan ? formData.serviceId : '',
        planName: '',
        planType: 'workspace',
        durationInHours: '',
        durationInDays: '',
        durationLabel: '',
        flatPrice: '',
        memberPrice: '',
        nonMemberPrice: '',
        nonWifiPrice: '',
        nonWifiPriceMember: '',
        nonWifiPriceNonMember: '',
        isPerHead: false,
        requiresMembershipCard: false,
        accessCardFee: '',
        features: '',
        isFeatured: false,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process pricing plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}</DialogTitle>
          <DialogDescription>
            {editingPlan 
              ? 'Update the pricing plan details for the service.'
              : 'Create and link a new pricing plan to a service. All prices are in Nigerian Naira (₦).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch Selection - Only show when creating */}
          {!editingPlan && (
            <div>
              <Label htmlFor="branchId">Branch *</Label>
            {isFetchingBranches ? (
              <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading branches...</span>
              </div>
            ) : (
              <Select
                value={formData.branchId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, branchId: value, serviceId: '' }));
                }}
              >
                <SelectTrigger id="branchId">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name} - {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            </div>
          )}

          {/* Service Selection - Only show when creating */}
          {!editingPlan && (
            <div>
              <Label htmlFor="serviceId">Service *</Label>
              {formData.branchId ? (
                isFetchingServices ? (
                  <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading services...</span>
                  </div>
                ) : services.length === 0 ? (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      No services found for this branch. Please create a service first.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
                  >
                    <SelectTrigger id="serviceId">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name} ({service.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              ) : (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Select a branch first</p>
                </div>
              )}
            </div>
          )}

          {/* Plan Name */}
          <div>
            <Label htmlFor="planName">Plan Name *</Label>
            <Input
              id="planName"
              name="planName"
              value={formData.planName}
              onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
              placeholder="e.g., Hourly Rate, Daily Pass, Monthly Membership"
              required
            />
          </div>

          {/* Plan Type */}
          <div>
            <Label htmlFor="planType">Plan Type *</Label>
            <Select
              value={formData.planType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, planType: value }))}
            >
              <SelectTrigger id="planType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="conference">Conference Room</SelectItem>
                <SelectItem value="content">Content Creator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="durationInHours">Duration (Hours)</Label>
              <Input
                id="durationInHours"
                type="number"
                min="0"
                value={formData.durationInHours}
                onChange={(e) => setFormData(prev => ({ ...prev, durationInHours: e.target.value }))}
                placeholder="e.g., 1, 2, 8"
              />
            </div>
            <div>
              <Label htmlFor="durationInDays">Duration (Days)</Label>
              <Input
                id="durationInDays"
                type="number"
                min="0"
                value={formData.durationInDays}
                onChange={(e) => setFormData(prev => ({ ...prev, durationInDays: e.target.value }))}
                placeholder="e.g., 1, 7, 30"
              />
            </div>
            <div>
              <Label htmlFor="durationLabel">Duration Label</Label>
              <Input
                id="durationLabel"
                value={formData.durationLabel}
                onChange={(e) => setFormData(prev => ({ ...prev, durationLabel: e.target.value }))}
                placeholder="e.g., 1 Hour, 1 Day"
              />
            </div>
          </div>

          {/* Pricing Options */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">Pricing Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flatPrice">Flat Price (₦)</Label>
                <Input
                  id="flatPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.flatPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, flatPrice: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="memberPrice">Member Price (₦)</Label>
                <Input
                  id="memberPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.memberPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, memberPrice: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="nonMemberPrice">Non-Member Price (₦)</Label>
                <Input
                  id="nonMemberPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.nonMemberPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, nonMemberPrice: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="nonWifiPrice">Non-WiFi Price (₦)</Label>
                <Input
                  id="nonWifiPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.nonWifiPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, nonWifiPrice: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="nonWifiPriceMember">Non-WiFi Member Price (₦)</Label>
                <Input
                  id="nonWifiPriceMember"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.nonWifiPriceMember}
                  onChange={(e) => setFormData(prev => ({ ...prev, nonWifiPriceMember: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="nonWifiPriceNonMember">Non-WiFi Non-Member Price (₦)</Label>
                <Input
                  id="nonWifiPriceNonMember"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.nonWifiPriceNonMember}
                  onChange={(e) => setFormData(prev => ({ ...prev, nonWifiPriceNonMember: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Membership Options */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Membership Options</h4>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPerHead}
                onChange={(e) => setFormData(prev => ({ ...prev, isPerHead: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Per Head Pricing</span>
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresMembershipCard}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresMembershipCard: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Requires Membership Card</span>
            </Label>
            {formData.requiresMembershipCard && (
              <div>
                <Label htmlFor="accessCardFee">Access Card Fee (₦)</Label>
                <Input
                  id="accessCardFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.accessCardFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessCardFee: e.target.value }))}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (!editingPlan && !formData.serviceId)}>
              {isLoading ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? 'Update Plan' : 'Create Plan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
