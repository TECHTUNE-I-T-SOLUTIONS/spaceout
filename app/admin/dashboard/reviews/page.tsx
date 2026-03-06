'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Trash2, Check, X, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  userId: any;
  spaceName?: string;
  rating: number;
  comment: string;
  approved: boolean;
  date: string;
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
      const response = await fetch('/api/reviews');
      if (response.ok) {
        const data = await response.json();
        
        // Transform API response to match Review interface
        const transformedReviews = data.map((item: any) => ({
          id: item._id?.toString() || item.id || '',
          userId: item.userId?.name || item.userId || 'Unknown',
          spaceName: item.branchId?.name || 'Unknown Space',
          rating: item.rating || 0,
          comment: item.comment || '',
          approved: item.approved || false,
          date: new Date(item.createdAt).toLocaleDateString(),
        }));
        
        setReviews(transformedReviews);
        toast.success('Reviews Loaded', {
          description: `Found ${transformedReviews.length} reviews.`,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to Load Reviews', {
        description: 'Unable to fetch reviews.',
      });
      // Mock data for demo
      setReviews([
        { id: '1', userId: 'user1', spaceName: 'Main Office', rating: 5, comment: 'Excellent workspace!', approved: false, date: '2026-03-01' },
        { id: '2', userId: 'user2', spaceName: 'Meeting Room', rating: 4, comment: 'Great service', approved: true, date: '2026-02-28' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (reviewId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, approved: true }),
      });

      if (response.ok) {
        setReviews(reviews.map(r => 
          r.id === reviewId ? { ...r, approved: true } : r
        ));
        toast.success('Review Approved', {
          description: 'Review has been published.',
        });
      }
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to Approve Review', {
        description: 'Unable to approve review.',
      });
    }
  };

  const rejectReview = async (reviewId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, approved: false }),
      });

      if (response.ok) {
        setReviews(reviews.map(r => 
          r.id === reviewId ? { ...r, approved: false } : r
        ));
        toast.success('Review Rejected', {
          description: 'Review has been rejected.',
        });
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to Reject Review', {
        description: 'Unable to reject review.',
      });
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        toast.success('Review Deleted', {
          description: 'Review has been removed.',
        });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to Delete Review', {
        description: 'Unable to delete review.',
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold mb-8">Reviews</h1>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reviews...</p>
        </Card>
      ) : reviews.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Reviews</h2>
          <p className="text-muted-foreground">Reviews will appear here once users submit feedback.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{review.rating}/5</span>
                    <span className="font-semibold">{review.spaceName}</span>
                    <span className={`text-xs px-2 py-1 rounded ${review.approved ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                      {review.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">By {review.userId} • {review.date}</p>
                  <p className="text-sm">{review.comment}</p>
                </div>
              </div>

              {!review.approved && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => approveReview(review.id)}
                  >
                    <Check size={16} />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-2 text-red-600"
                    onClick={() => rejectReview(review.id)}
                  >
                    <X size={16} />
                    Reject
                  </Button>
                </div>
              )}

              <Button 
                size="sm" 
                variant="ghost"
                className="text-red-500 hover:text-red-600 ml-auto mt-4"
                onClick={() => deleteReview(review.id)}
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
