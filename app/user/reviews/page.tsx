'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Edit2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  spaceName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved';
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
        if (data.length > 0) {
          toast.success('Reviews Loaded', {
            description: `You have ${data.length} review(s).`,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to Load Reviews', {
        description: 'Unable to fetch your reviews.',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/user/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        toast.success('Review Deleted', {
          description: 'Your review has been removed.',
        });
      } else {
        toast.error('Failed to Delete Review', {
          description: 'Unable to delete this review.',
        });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Error', {
        description: 'Failed to delete review.',
      });
    }
  };

  const handleWriteReview = () => {
    toast.success('Review Form Opened', {
      description: 'Please fill in your review details.',
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'approved' 
      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Reviews</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={handleWriteReview}
        >
          <Plus size={18} />
          Write a Review
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your reviews...</p>
        </Card>
      ) : reviews.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Reviews Yet</h2>
          <p className="text-muted-foreground mb-6">
            Share your experience by writing a review of our spaces.
          </p>
          <Button onClick={handleWriteReview}>Write a Review</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">{review.spaceName}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(review.status)}`}>
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        size={16} 
                        className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
                      />
                    ))}
                    <span className="text-sm font-semibold ml-2">{review.rating}/5</span>
                  </div>
                  <p className="text-sm mb-3">{review.comment}</p>
                  <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Edit2 size={16} />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => deleteReview(review.id)}
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
