'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  userId: string;
  message: string;
  category: string;
  date: string;
  replied: boolean;
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
      const response = await fetch('/api/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
        toast.success('Feedback Loaded', {
          description: `Found ${data.length} feedback messages.`,
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to Load Feedback', {
        description: 'Unable to fetch feedback.',
      });
      // Mock data for demo
      setFeedbacks([
        { id: '1', userId: 'user1', message: 'Great service!', category: 'praise', date: '2024-03-01', replied: false },
        { id: '2', userId: 'user2', message: 'WiFi speed is slow', category: 'complaint', date: '2024-02-28', replied: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const replyToFeedback = (feedbackId: string) => {
    toast.success('Reply Started', {
      description: 'Reply compose window will open.',
    });
  };

  const deleteFeedback = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE',
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
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
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
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(feedback.category)}`}>
                      {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                    </span>
                    {feedback.replied && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                        Replied
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{new Date(feedback.date).toLocaleDateString()}</p>
                  <p className="text-sm">{feedback.message}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => replyToFeedback(feedback.id)}
                >
                  <MessageSquare size={16} />
                  {feedback.replied ? 'Update Reply' : 'Reply'}
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
    </motion.div>
  );
}
