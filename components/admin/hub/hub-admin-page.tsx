'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GraduationCap, Settings2, BookOpen, CalendarClock, Images, MessageSquareQuote } from 'lucide-react';
import { HubOverviewTab } from './hub-overview-tab';
import { HubProgramsTab } from './hub-programs-tab';
import { HubSessionsTab } from './hub-sessions-tab';
import { HubGalleryTab } from './hub-gallery-tab';
import { HubTestimonialsTab } from './hub-testimonials-tab';

export function HubAdminPage({ adminId }: { adminId: string }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">SpaceOut Tech</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the tech trainings page, schedules, courses, gallery and testimonials.
          </p>
        </div>
        <a
          href="/hub"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          View live page →
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Settings2 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Courses
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5">
            <CalendarClock className="h-4 w-4" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5">
            <Images className="h-4 w-4" /> Gallery
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-1.5">
            <MessageSquareQuote className="h-4 w-4" /> Testimonials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <HubOverviewTab adminId={adminId} />
        </TabsContent>
        <TabsContent value="programs">
          <HubProgramsTab adminId={adminId} />
        </TabsContent>
        <TabsContent value="sessions">
          <HubSessionsTab adminId={adminId} />
        </TabsContent>
        <TabsContent value="gallery">
          <HubGalleryTab adminId={adminId} />
        </TabsContent>
        <TabsContent value="testimonials">
          <HubTestimonialsTab adminId={adminId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}