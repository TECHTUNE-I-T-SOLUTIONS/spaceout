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
}

interface Branch {
  _id: string;
  name: string;
  location: string;
}

export function CreatePricingModal({ open, onOpenChange, onSuccess }: CreatePricingModalProps) {
  const [formData, setFormData] = useState({
    branchId: '',
    name: '',
    description: '',
    price: '',
    billingPeriod: 'monthly',
    features: '',
    isFeatured: false,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState(true);

  const billingPeriods = ['hourly', 'daily', 'monthly', 'yearly'];

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
      if (!formData.branchId || !formData.name || !formData.description || !formData.price) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price');
        setIsLoading(false);
        return;
      }

      const featuresArray = formData.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f);

      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: formData.branchId,
          name: formData.name,
          description: formData.description,
          price: price,
          billingPeriod: formData.billingPeriod,
          features: featuresArray,
          isFeatured: formData.isFeatured,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create pricing plan');
      }

      toast.success('Pricing plan created successfully!');
      setFormData({
        branchId: '',
        name: '',
        description: '',
        price: '',
        billingPeriod: 'monthly',
        features: '',
        isFeatured: false,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create pricing plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pricing Plan</DialogTitle>
          <DialogDescription>
            Add a new pricing plan in Nigerian Naira (₦) for your branches.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                onValueChange={(value) => handleSelectChange('branchId', value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Pro Plan"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Price (₦) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 5000"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billingPeriod">Billing Period *</Label>
              <Select
                value={formData.billingPeriod}
                onValueChange={(value) => handleSelectChange('billingPeriod', value)}
              >
                <SelectTrigger id="billingPeriod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingPeriods.map(period => (
                    <SelectItem key={period} value={period}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm">Featured Plan</span>
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Perfect for growing teams"
              required
            />
          </div>

          <div>
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Input
              id="features"
              name="features"
              value={formData.features}
              onChange={handleInputChange}
              placeholder="e.g., WiFi, Coffee, Parking, Meeting Room Access"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple features with commas
            </p>
          </div>

          <Card className="bg-muted p-3 border-0">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Preview:</span><br />
              <span className="text-lg font-bold">₦{formData.price || '0'}</span> / {formData.billingPeriod}
            </p>
          </Card>

          <Card className="bg-blue-100 dark:bg-blue-900 p-3 border-0">
            <p className="text-sm">
              <span className="font-semibold">💡 Note:</span> All prices are stored in Nigerian Naira (₦). Pricing plans will be displayed across all branches.
            </p>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
