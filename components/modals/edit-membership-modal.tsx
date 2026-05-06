'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type MembershipPlan = {
  _id: string;
  name: string;
  duration: number;
  price: number;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  card: any | null;
  services: any[];
  refresh: () => void;
}

export default function EditMembershipModal({ open, onOpenChange, card, services, refresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({});
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    if (!card) return;
    setForm({
      userId: card.userId?._id || card.userId,
      serviceId: card.serviceId?._id || card.serviceId,
      planName: card.planName,
      price: card.price,
      duration: card.duration,
      startDate: card.purchaseDate ? new Date(card.purchaseDate).toISOString().slice(0,10) : '',
      status: card.status || 'active',
      expiryDate: card.expiryDate ? new Date(card.expiryDate).toISOString().slice(0,10) : '',
      subscriptionId: card._id,
      paymentReference: card.paymentReference || (card.payment?._id),
    });
  }, [card]);

  useEffect(() => {
    const load = async () => {
      if (!form.serviceId) { setPlans([]); return; }
      try {
        const res = await fetch(`/api/services/${form.serviceId}`);
        if (!res.ok) { setPlans([]); return; }
        const data = await res.json();
        const pricingPlans = Array.isArray(data?.pricingPlans) ? data.pricingPlans : [];
        const serviceMembershipPlans = Array.isArray(data?.membershipPlans) ? data.membershipPlans : [];
        const derived = pricingPlans
          .filter((p: any) => p.requiresMembershipCard || p.accessCardFee)
          .map((p: any) => ({ _id: p._id || `${p.planName}-${p.durationLabel}`, name: p.planName, duration: p.accessCardFee ? 365 : (p.durationInDays || 365), price: p.accessCardFee ?? p.memberPrice ?? p.nonMemberPrice ?? 0 }));
        const derivedFromMembership = serviceMembershipPlans.map((p: any) => ({ _id: p._id, name: p.name, duration: p.duration, price: p.price }));
        setPlans([...derived, ...derivedFromMembership]);
      } catch (e) { setPlans([]); }
    };
    load();
  }, [form.serviceId]);

  const handleSubmit = async () => {
    if (!form.subscriptionId) return toast.error('Missing subscription id');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/membership-cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to update');
      }
      toast.success('Membership updated');
      onOpenChange(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Membership</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Service</label>
            <Select value={form.serviceId || ''} onValueChange={(v) => setForm((p:any)=>({...p, serviceId: v, planName: '', price: '', duration: ''}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s:any) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Plan</label>
            <Select value={form.planName || ''} onValueChange={(v) => {
              const p = plans.find(pl => pl._id === v) || plans.find(pl => pl.name === v);
              setForm((prev:any) => ({ ...prev, planName: p?.name || v, price: p?.price ?? prev.price, duration: p?.duration ?? prev.duration }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name} - ₦{p.price.toLocaleString()} / {p.duration} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Price</label>
              <Input value={form.price ?? ''} onChange={(e)=>setForm((p:any)=>({...p, price: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Duration (days)</label>
              <Input value={form.duration ?? ''} onChange={(e)=>setForm((p:any)=>({...p, duration: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Payment / Start Date</label>
              <Input type="date" value={form.startDate || ''} onChange={(e)=>setForm((p:any)=>({...p, startDate: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expiry Date (optional)</label>
              <Input type="date" value={form.expiryDate || ''} onChange={(e)=>setForm((p:any)=>({...p, expiryDate: e.target.value}))} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={form.status || 'active'} onValueChange={(v)=>setForm((p:any)=>({...p, status: v}))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="inactive">inactive</SelectItem>
                <SelectItem value="expired">expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
