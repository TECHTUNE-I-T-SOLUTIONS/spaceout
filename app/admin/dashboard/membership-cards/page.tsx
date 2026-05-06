'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type MembershipPlan = {
  _id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  features?: string[];
  isActive: boolean;
};

type Service = {
  _id: string;
  name: string;
  category?: string;
  branchId?: { name: string };
  isActive: boolean;
  membershipPlans?: MembershipPlan[];
};

export default function MembershipCardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicePlans, setServicePlans] = useState<MembershipPlan[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [form, setForm] = useState({
    userId: '',
    serviceId: '',
    planId: '',
  });

  useEffect(() => {
    fetchCards();
    fetchServices();
    fetchUsers();
  }, []);

  const fetchCards = async () => {
    setLoadingCards(true);
    try {
      const res = await fetch('/api/admin/membership-cards');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCards(data.cards || []);
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchUsers = async (term = '') => {
    const res = await fetch(`/api/admin/search-users?search=${encodeURIComponent(term)}&limit=50`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const fetchServices = async () => {
    const res = await fetch('/api/services?includeInactive=true');
    if (res.ok) {
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data.data || []);
    }
  };

  const selectedService = useMemo(
    () => services.find((service) => service._id === form.serviceId),
    [services, form.serviceId]
  );

  const availablePlans = useMemo(() => servicePlans.filter((plan) => plan.isActive), [servicePlans]);

  const selectedPlan = useMemo(
    () => availablePlans.find((plan) => plan._id === form.planId),
    [availablePlans, form.planId]
  );

  useEffect(() => {
    if (availablePlans.length && !availablePlans.some((p) => p._id === form.planId)) {
      setForm((prev) => ({ ...prev, planId: availablePlans[0]._id }));
    }
    if (!availablePlans.length && form.planId) {
      setForm((prev) => ({ ...prev, planId: '' }));
    }
  }, [availablePlans, form.planId]);

  useEffect(() => {
    const loadPlans = async () => {
      if (!form.serviceId) {
        setServicePlans([]);
        return;
      }

      const res = await fetch(`/api/services/${form.serviceId}`);
      if (res.ok) {
        const data = await res.json();
        const pricingPlans = Array.isArray(data?.pricingPlans) ? data.pricingPlans : [];
        const serviceMembershipPlans = Array.isArray(data?.membershipPlans) ? data.membershipPlans : [];

        const derivedFromPricing = pricingPlans
          .filter((plan: any) => plan.requiresMembershipCard || plan.accessCardFee)
          .map((plan: any) => ({
            _id: plan._id || `${plan.planName}-${plan.durationLabel}`,
            name: plan.planName,
            // Access card fees are annual by design — show 365 days for accessCardFee
            duration: plan.accessCardFee ? 365 : (plan.durationInDays || 365),
            price: plan.accessCardFee ?? plan.memberPrice ?? plan.nonMemberPrice ?? 0,
            description: plan.durationLabel,
            features: [],
            isActive: true,
          }));

        const derivedFromMembershipPlans = serviceMembershipPlans.map((plan: any) => ({
          _id: plan._id,
          name: plan.name,
          duration: plan.duration,
          price: plan.price,
          description: plan.description,
          features: plan.features || [],
          isActive: plan.isActive !== false,
        }));

        setServicePlans([...derivedFromPricing, ...derivedFromMembershipPlans]);
      } else {
        setServicePlans([]);
      }
    };

    loadPlans();
  }, [form.serviceId]);

  const filteredCards = useMemo(() => {
    return cards
      .filter((card) => {
        if (statusFilter === 'all') return true;
        return statusFilter === 'active' ? card.status === 'active' : card.status !== 'active';
      })
      .filter((card) => {
        if (!search) return true;
        const text = `${card.userId?.firstName || ''} ${card.userId?.lastName || ''} ${card.userId?.email || ''} ${card.serviceName || ''} ${card.planName || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const dir = sortOrder === 'asc' ? 1 : -1;
        const left = sortBy === 'expiryDate' ? new Date(a.expiryDate).getTime() : new Date(a.createdAt).getTime();
        const right = sortBy === 'expiryDate' ? new Date(b.expiryDate).getTime() : new Date(b.createdAt).getTime();
        return (left - right) * dir;
      });
  }, [cards, search, statusFilter, sortBy, sortOrder]);

  const handleCreate = async () => {
    if (!form.userId || !form.serviceId || !form.planId) {
      toast.error('Select a user, service, and plan');
      return;
    }

    if (!selectedPlan || !selectedService) {
      toast.error('Plan data not available');
      return;
    }

    setLoadingCreate(true);
    try {
      const res = await fetch('/api/admin/membership-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: form.userId,
          serviceId: form.serviceId,
          planName: selectedPlan.name,
          price: selectedPlan.price,
          duration: selectedPlan.duration,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('Membership created and marked as paid');
      setForm({ userId: '', serviceId: '', planId: '' });
      fetchCards();
    } catch {
      toast.error('Failed to create membership');
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Membership Cards</h1>
          <p className="text-muted-foreground">Manage issued cards and create paid memberships manually.</p>
        </div>
        <Button variant="outline" onClick={fetchCards} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loadingCards ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Membership Cards</TabsTrigger>
          <TabsTrigger value="create">Create Membership</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="User, service, plan..." className="pl-10" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="expiryDate">Expiry Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest</SelectItem>
                    <SelectItem value="asc">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {loadingCards ? (
            <Card className="p-6 flex items-center gap-2 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-muted-foreground">Loading membership cards...</span>
            </Card>
          ) : filteredCards.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No membership cards found</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCards.map((card) => (
                <Card key={card._id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{card.userId?.firstName} {card.userId?.lastName}</div>
                      <div className="text-sm text-muted-foreground">{card.userId?.email}</div>
                    </div>
                    <Badge>{card.status || 'active'}</Badge>
                  </div>
                  <div className="text-sm">
                    <div><span className="text-muted-foreground">Service:</span> {card.serviceName}</div>
                    <div><span className="text-muted-foreground">Plan:</span> {card.planName}</div>
                    <div><span className="text-muted-foreground">Price:</span> ₦{Number(card.price || 0).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Expires:</span> {new Date(card.expiryDate).toLocaleDateString()}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="p-5 space-y-4 max-w-2xl">
            <div>
              <label className="text-sm font-medium mb-2 block">Search User</label>
              <Input
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  fetchUsers(e.target.value);
                }}
                placeholder="Search by name or email"
              />
              <Select value={form.userId} onValueChange={(value) => setForm((prev) => ({ ...prev, userId: value }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Service</label>
              <Input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search service"
              />
              <Select
                value={form.serviceId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, serviceId: value, planId: '' }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services
                    .filter((service) =>
                      `${service.name} ${service.category || ''}`.toLowerCase().includes(serviceSearch.toLowerCase())
                    )
                    .map((service) => (
                      <SelectItem key={service._id} value={service._id}>
                        {service.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Plan Price</div>
                <div className="text-xl font-bold">{selectedPlan ? `₦${selectedPlan.price.toLocaleString()}` : 'Select a plan'}</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Duration</div>
                <div className="text-xl font-bold">{selectedPlan ? `${selectedPlan.duration} days` : 'Select a plan'}</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Membership Plan</label>
              <Select
                value={form.planId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, planId: value }))}
                disabled={!selectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedService ? 'Select membership plan' : 'Choose a service first'} />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans
                    .filter((plan) => `${plan.name} ${plan.description || ''}`.toLowerCase().includes(serviceSearch.toLowerCase()))
                    .map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name} - ₦{plan.price.toLocaleString()} / {plan.duration} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                Selected service: {selectedService.name}. The membership plan, price, and duration are pulled from this service’s linked plans.
              </div>
            )}

            {selectedPlan && (
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <div className="text-sm font-medium">Selected Plan Summary</div>
                <div className="text-sm text-muted-foreground">Service: {selectedService?.name}</div>
                <div className="text-sm text-muted-foreground">Plan: {selectedPlan.name}</div>
                <div className="text-sm text-muted-foreground">Duration: {selectedPlan.duration} days</div>
                <div className="text-sm font-semibold">Card Price: ₦{selectedPlan.price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  This will be saved as a completed paid membership and reflected on the user dashboard.
                </div>
              </div>
            )}

            <Button onClick={handleCreate} disabled={loadingCreate} className="w-full">
              {loadingCreate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Paid Membership
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
