'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Newspaper,
  Megaphone,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Event {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  eventType: 'event' | 'news' | 'announcement';
  status: 'draft' | 'published';
  featured: boolean;
  tags: string[];
  eventDate?: string;
  location?: string;
  views: number;
  likes: number;
  createdAt: string;
  publishedAt?: string;
}

export default function EventsClientPage({ adminId }: { adminId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Event deleted successfully');
        fetchEvents();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          updatedBy: adminId,
        }),
      });

      if (response.ok) {
        toast.success(`Event ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
        fetchEvents();
      } else {
        toast.error('Failed to update event status');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event status');
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          featured: !currentFeatured,
          updatedBy: adminId,
        }),
      });

      if (response.ok) {
        toast.success(`Event ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
        fetchEvents();
      } else {
        toast.error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'news':
        return <Newspaper className="h-4 w-4" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'news':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'announcement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || event.eventType === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events & News</h1>
          <p className="text-muted-foreground">Create and manage events, news, and announcements</p>
        </div>
        <Link href="/admin/dashboard/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="announcement">Announcements</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Events List */}
      {loading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first event or news article.</p>
            <Link href="/admin/dashboard/events/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getEventTypeColor(event.eventType)}>
                      {getEventTypeIcon(event.eventType)}
                      <span className="ml-1 capitalize">{event.eventType}</span>
                    </Badge>
                    {event.featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                    <Badge variant={event.status === 'published' ? 'default' : 'outline'}>
                      {event.status}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{event.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {event.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.eventDate).toLocaleDateString()}
                      </span>
                    )}
                    {event.location && <span>📍 {event.location}</span>}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {event.views} views
                    </span>
                    <span>Tags: {event.tags.slice(0, 3).join(', ')}{event.tags.length > 3 ? '...' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFeatured(event._id, event.featured)}
                    title={event.featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Eye className={`h-4 w-4 ${event.featured ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(event._id, event.status)}
                    title={event.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {event.status === 'published' ? '👁️' : '👁️‍🗨️'}
                  </Button>
                  <Link href={`/admin/dashboard/events/${event._id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(event._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
