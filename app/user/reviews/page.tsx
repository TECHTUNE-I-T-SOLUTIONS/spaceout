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
import { Plus, Loader2, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  spaceName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'draft' | 'published' | 'rejected';
}

interface Branch {
  _id: string;
  name: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    spaceName: '',
    branchId: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    fetchReviews();
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

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
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

  const handleSubmitReview = async () => {
    if (!formData.spaceName.trim() || !formData.comment.trim()) {
      toast.error('Validation Error', {
        description: 'Please fill in all fields.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/user/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const reviewData = data.review || data;
        
        // Transform the review to match the Review interface
        const formattedReview: Review = {
          id: reviewData._id?.toString() || reviewData.id || '',
          spaceName: reviewData.spaceName || formData.spaceName,
          rating: reviewData.rating || 0,
          comment: reviewData.comment || '',
          date: new Date(reviewData.createdAt).toLocaleDateString(),
          status: reviewData.approved ? 'published' : 'draft',
        };
        
        setReviews([formattedReview, ...reviews]);
        setShowDialog(false);
        setFormData({ spaceName: '', branchId: '', rating: 5, comment: '' });
        toast.success('Review Submitted', {
          description: 'Awaiting admin approval.',
        });
      } else {
        toast.error('Failed to Submit Review', {
          description: 'Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error', {
        description: 'Failed to submit review.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/user/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        setShowDelete(null);
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
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
    }
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
          onClick={() => setShowDialog(true)}
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
          <Button onClick={() => setShowDialog(true)}>Write a Review</Button>
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => setShowDelete(review.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your experience with this space</DialogDescription>
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
              <Label htmlFor="spaceName" className="mb-2 block">Space Name *</Label>
              <Input
                id="spaceName"
                placeholder="e.g., Main Office, Meeting Room 1"
                value={formData.spaceName}
                onChange={(e) => setFormData({ ...formData, spaceName: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-3 block">Rating *</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment" className="mb-2 block">Your Review *</Label>
              <Textarea
                id="comment"
                placeholder="Tell us what you think..."
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDelete !== null} onOpenChange={() => setShowDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The review will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isDeleting}
              onClick={() => showDelete && handleDeleteReview(showDelete)}
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
