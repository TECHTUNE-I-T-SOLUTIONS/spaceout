'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Trash2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  userId: any;
  title: string;
  message: string;
  category?: string;
  status: string;
  date: string;
  adminReply?: string;
  adminReplyDate?: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback');
      if (response.ok) {
        const data = await response.json();
        
        // Transform API response to match Feedback interface
        const transformedFeedbacks = data.map((item: any) => ({
          id: item._id?.toString() || item.id || '',
          userId: item.userId?.name || item.userId || 'Unknown',
          title: item.title || 'Feedback',
          message: item.message || '',
          category: item.category || 'general',
          status: item.status || 'open',
          date: new Date(item.createdAt).toLocaleDateString(),
          adminReply: item.adminReply,
          adminReplyDate: item.adminReplyDate ? new Date(item.adminReplyDate).toLocaleDateString() : undefined,
        }));
        
        setFeedbacks(transformedFeedbacks);
        toast.success('Feedback Loaded', {
          description: `Found ${transformedFeedbacks.length} feedback messages.`,
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to Load Feedback', {
        description: 'Unable to fetch feedback.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      toast.error('Reply is empty', {
        description: 'Please enter a reply message.',
      });
      return;
    }

    try {
      setIsSubmittingReply(true);
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId: replyingId,
          adminReply: replyText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setFeedbacks(feedbacks.map(f => {
          if (f.id === replyingId) {
            return {
              ...f,
              adminReply: replyText,
              adminReplyDate: new Date().toLocaleDateString(),
            };
          }
          return f;
        }));

        toast.success('Reply Sent', {
          description: 'User will see your reply on their feedback page.',
        });

        // Close dialog
        setReplyingId(null);
        setReplyText('');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to Send Reply', {
        description: 'Unable to send reply.',
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId }),
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
        toast.success('Feedback Deleted', {
          description: 'Feedback has been removed.',
        });
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to Delete Feedback', {
        description: 'Unable to delete feedback.',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'praise':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'complaint':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      case 'suggestion':
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold mb-8">Feedback</h1>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feedback...</p>
        </Card>
      ) : feedbacks.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Feedback</h2>
          <p className="text-muted-foreground">User feedback will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-semibold">{feedback.userId}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(feedback.category || 'general')}`}>
                      {(feedback.category || 'general').charAt(0).toUpperCase() + (feedback.category || 'general').slice(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${feedback.status === 'resolved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{feedback.date}</p>
                  <p className="text-sm font-semibold mb-2">{feedback.title}</p>
                  <p className="text-sm">{feedback.message}</p>

                  {feedback.adminReply && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Admin Reply ({feedback.adminReplyDate})</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.adminReply}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setReplyingId(feedback.id);
                    setReplyText(feedback.adminReply || '');
                  }}
                >
                  <MessageSquare size={16} />
                  {feedback.adminReply ? 'Update Reply' : 'Reply'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 ml-auto"
                  onClick={() => deleteFeedback(feedback.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyingId !== null} onOpenChange={(open) => {
        if (!open) {
          setReplyingId(null);
          setReplyText('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Feedback</DialogTitle>
            <DialogDescription>
              Send a response to the user about their feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[120px]"
              disabled={isSubmittingReply}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setReplyingId(null);
                  setReplyText('');
                }}
                disabled={isSubmittingReply}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReplySubmit}
                disabled={isSubmittingReply || !replyText.trim()}
                className="flex items-center gap-2"
              >
                {isSubmittingReply ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
