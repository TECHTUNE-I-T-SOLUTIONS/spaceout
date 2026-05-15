'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Cake, CalendarDays, Mail, Phone, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';

interface BirthdayUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  nextBirthday: string;
  daysUntilBirthday: number;
  ageTurning: number;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  membershipType?: 'annual' | 'monthly' | 'lifetime';
  hasMembership?: boolean;
  isActive?: boolean;
  isTodayBirthday?: boolean;
  isReminderDue?: boolean;
}

interface BirthdayResponse {
  today: string;
  windowDays: number;
  allBirthdays: BirthdayUser[];
  activeBirthdays: BirthdayUser[];
  reminderDueBirthdays: BirthdayUser[];
  upcomingBirthdays: BirthdayUser[];
  totalBirthdayUsers: number;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMonthDay(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

function getFullName(user: BirthdayUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'Unnamed User';
}

export default function BirthdaysPage() {
  const [data, setData] = useState<BirthdayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<BirthdayUser | null>(null);
  const [windowDays, setWindowDays] = useState(30);
  const [activeFilter, setActiveFilter] = useState<'today' | 'reminders' | 'upcoming' | 'all'>('all');

  useEffect(() => {
    fetchBirthdays();
  }, [windowDays]);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/birthdays?days=${windowDays}`);
      if (!response.ok) {
        throw new Error('Unable to load birthdays');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
      toast.error('Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return [
      {
        label: 'Today',
        value: data?.activeBirthdays.length || 0,
        helper: 'Birthdays happening right now',
        icon: Cake,
      },
      {
        label: 'Reminder Due',
        value: data?.reminderDueBirthdays.length || 0,
        helper: 'Automatic email goes out in 7 days',
        icon: Mail,
      },
      {
        label: `Upcoming (${windowDays}d)`,
        value: data?.upcomingBirthdays.length || 0,
        helper: 'Birthdays in the next booking window',
        icon: CalendarDays,
      },
      {
        label: 'Total Birthday Profiles',
        value: data?.totalBirthdayUsers || 0,
        helper: 'Users with a saved date of birth',
        icon: Users,
      },
    ];
  }, [data, windowDays]);

  const cardTone = (user: BirthdayUser) => {
    if (user.isTodayBirthday) return 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30';
    if (user.isReminderDue) return 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/30';
    return 'border-border bg-card';
  };

  const activeList = useMemo(() => {
    if (!data) return [];

    if (activeFilter === 'today') return data.activeBirthdays;
    if (activeFilter === 'reminders') return data.reminderDueBirthdays;
    if (activeFilter === 'upcoming') return data.upcomingBirthdays.filter((user) => !user.isTodayBirthday);
    return data.allBirthdays;
  }, [activeFilter, data]);

  const activeListTitle =
    activeFilter === 'today'
      ? 'Active Birthdays Today'
      : activeFilter === 'reminders'
        ? 'Reminder Due Birthdays'
        : activeFilter === 'upcoming'
          ? 'Upcoming Birthdays'
          : 'All Birthdays';

  const activeListDescription =
    activeFilter === 'today'
      ? 'These users are celebrating today.'
      : activeFilter === 'reminders'
        ? 'These users will receive their reminder email in 7 days.'
        : activeFilter === 'upcoming'
          ? `Birthdays within the next ${windowDays} days, sorted by the nearest date.`
          : 'Every user who has a saved date of birth appears here.';

  const userGrid = (users: BirthdayUser[], emptyMessage: string) => {
    if (users.length === 0) {
      return (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <motion.div key={user._id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`p-5 hover:shadow-lg transition-shadow ${cardTone(user)}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{getFullName(user)}</h3>
                    <p className="text-sm text-muted-foreground">{formatMonthDay(user.dateOfBirth)}</p>
                  </div>
                  <Badge variant={user.isTodayBirthday ? 'default' : 'secondary'}>
                    {user.isTodayBirthday ? 'Today' : `${user.daysUntilBirthday} days`}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.phone || 'No phone number saved'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <span>Next birthday: {formatDate(user.nextBirthday)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Turns {user.ageTurning}</Badge>
                  <Badge variant="outline">{user.membershipStatus || 'inactive'}</Badge>
                  <Badge variant="outline">{user.hasMembership ? 'Member' : 'Non-member'}</Badge>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedUser(user)}>
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Birthday Manager</h1>
          <p className="text-muted-foreground mt-1">
            Track upcoming birthdays and birthdays happening today. Birthday emails are automatically sent 1 week before and on the birthday itself.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={windowDays === 30 ? 'default' : 'outline'} size="sm" onClick={() => setWindowDays(30)}>
            30 Days
          </Button>
          <Button variant={windowDays === 60 ? 'default' : 'outline'} size="sm" onClick={() => setWindowDays(60)}>
            60 Days
          </Button>
          <Button variant="outline" size="sm" onClick={fetchBirthdays} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4 border-sky-200 bg-sky-50/70 dark:bg-sky-950/25">
        <p className="text-sm text-sky-900 dark:text-sky-100">
          Birthday automation note: reminders are sent 7 days before the birthday, and a second email is sent on the birthday.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{loading ? '—' : stat.value}</p>
                <p className="text-xs text-muted-foreground mt-2">{stat.helper}</p>
              </div>
              <stat.icon className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="all">All Birthdays</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="reminders">Reminder Due</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-4 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{activeListTitle}</h2>
              <p className="text-sm text-muted-foreground">{activeListDescription}</p>
            </div>

            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading birthdays...</p>
              </Card>
            ) : data ? (
              userGrid(
                activeList,
                activeFilter === 'all'
                  ? 'No users with birthdays found.'
                  : activeFilter === 'today'
                    ? 'No birthdays are happening today.'
                    : activeFilter === 'reminders'
                      ? 'No reminder emails are due right now.'
                      : `No birthdays found in the next ${windowDays} days.`
              )
            ) : null}
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedUser ? getFullName(selectedUser) : 'Birthday Details'}</DialogTitle>
            <DialogDescription>
              User details for birthday communication and admin review.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">Email</p>
                  <p className="font-medium break-all">{selectedUser.email}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">Phone</p>
                  <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">Date of Birth</p>
                  <p className="font-medium">{formatDate(selectedUser.dateOfBirth)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">Next Birthday</p>
                  <p className="font-medium">{formatDate(selectedUser.nextBirthday)}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs mb-1">Birthday Email Policy</p>
                <p className="font-medium leading-6">
                  Emails are sent automatically 1 week before the birthday and again on the birthday itself.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Turns {selectedUser.ageTurning}</Badge>
                <Badge variant="outline">{selectedUser.membershipStatus || 'inactive'}</Badge>
                <Badge variant="outline">{selectedUser.hasMembership ? 'Member' : 'Non-member'}</Badge>
                {selectedUser.isTodayBirthday && <Badge>Today</Badge>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}