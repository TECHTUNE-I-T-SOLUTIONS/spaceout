'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  message: string;
  category: string;
  date: string;
  status: 'sent' | 'seen' | 'responded';
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
        if (data.length > 0) {
          toast.success('Feedback Loaded', {
            description: `You have ${data.length} feedback message(s).`,
          });
        }
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

  const deleteFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/user/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
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
    }
  };

  const handleSendFeedback = () => {
    toast.success('Feedback Form Opened', {
      description: 'Please share your feedback with us.',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'suggestion':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'complaint':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      case 'praise':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'seen':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'sent':
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
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
          onClick={handleSendFeedback}
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
          <Button onClick={handleSendFeedback}>Send Feedback</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(feedback.category)}`}>
                      {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ml-auto ${getStatusColor(feedback.status)}`}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{feedback.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(feedback.date).toLocaleDateString()}</p>
                </div>
              </div>

              {feedback.status === 'responded' && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded mb-4 text-sm">
                  <p className="text-blue-900 dark:text-blue-100"><strong>Admin Response:</strong> Thank you for your feedback! We appreciate your input and will work on improvements.</p>
                </div>
              )}

              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => deleteFeedback(feedback.id)}
              >
                <Trash2 size={16} />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
