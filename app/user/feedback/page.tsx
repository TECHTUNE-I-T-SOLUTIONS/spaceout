'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  title?: string;
  message: string;
  category: string;
  date: string;
  status: 'open' | 'resolved';
  adminReply?: string;
  adminReplyDate?: string;
}

interface Branch {
  _id: string;
  name: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    branchId: '',
    category: 'general',
    message: '',
  });

  useEffect(() => {
    fetchFeedback();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/feedback');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the feedback to include adminReply and adminReplyDate
        const transformedFeedbacks = data.map((item: any) => ({
          id: item._id?.toString() || item.id || '',
          title: item.title || '',
          message: item.message || '',
          category: item.category || 'general',
          date: new Date(item.createdAt).toLocaleDateString(),
          status: item.status || 'open',
          adminReply: item.adminReply,
          adminReplyDate: item.adminReplyDate ? new Date(item.adminReplyDate).toLocaleDateString() : undefined,
        }));
        
        setFeedbacks(transformedFeedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to Load Feedback', {
        description: 'Unable to fetch your feedback.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in all fields.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const feedbackData = data.feedback || data;
        
        // Transform the feedback to match the Feedback interface
        const formattedFeedback: Feedback = {
          id: feedbackData._id?.toString() || feedbackData.id || '',
          title: feedbackData.title || '',
          message: feedbackData.message || '',
          category: feedbackData.category || 'general',
          date: new Date(feedbackData.createdAt || Date.now()).toLocaleDateString(),
          status: feedbackData.status || 'open',
          adminReply: feedbackData.adminReply,
          adminReplyDate: feedbackData.adminReplyDate ? new Date(feedbackData.adminReplyDate).toLocaleDateString() : undefined,
        };
        
        setFeedbacks([formattedFeedback, ...feedbacks]);
        setShowDialog(false);
        setFormData({ title: '', branchId: '', category: 'general', message: '' });
        toast.success('Feedback Submitted', {
          description: 'Thank you for your feedback. We will review it shortly.',
        });
      } else {
        toast.error('Failed to Submit Feedback', {
          description: 'Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error', {
        description: 'Failed to submit feedback.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/user/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
        setShowDelete(null);
        toast.success('Feedback Deleted', {
          description: 'Your feedback has been removed.',
        });
      } else {
        toast.error('Failed to Delete Feedback', {
          description: 'Unable to delete this feedback.',
        });
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Error', {
        description: 'Failed to delete feedback.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature-request':
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
      case 'bug':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      case 'praise':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'open':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Feedback</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowDialog(true)}
        >
          <Plus size={18} />
          Send Feedback
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your feedback...</p>
        </Card>
      ) : feedbacks.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Feedback Sent Yet</h2>
          <p className="text-muted-foreground mb-6">
            Help us improve by sharing your feedback about your experience.
          </p>
          <Button onClick={() => setShowDialog(true)}>Send Feedback</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">{feedback.title || feedback.message.substring(0, 50)}</h3>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(feedback.category)}`}>
                      {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ml-auto ${getStatusColor(feedback.status)}`}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{feedback.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(feedback.date).toLocaleDateString()}</p>

                  {feedback.adminReply && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                      <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">Reply from Team ({feedback.adminReplyDate})</p>
                      <p className="text-sm text-green-800 dark:text-green-200">{feedback.adminReply}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => setShowDelete(feedback.id)}
              >
                <Trash2 size={16} />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>Help us improve your experience</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="branchId" className="mb-2 block">Select a Branch (Optional)</Label>
              <select
                id="branchId"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">-- Select a branch --</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title" className="mb-2 block">Subject *</Label>
              <Input
                id="title"
                placeholder="Brief subject of your feedback"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category" className="mb-2 block">Category *</Label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="general">General Feedback</option>
                <option value="feature-request">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="praise">Praise</option>
              </select>
            </div>

            <div>
              <Label htmlFor="message" className="mb-2 block">Message *</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitFeedback} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete !== null} onOpenChange={() => setShowDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The feedback will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isDeleting}
              onClick={() => showDelete && handleDeleteFeedback(showDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
