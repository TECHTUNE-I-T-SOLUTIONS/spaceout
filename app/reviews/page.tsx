'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
}

const GRADIENT_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-red-400 to-red-600',
  'from-cyan-400 to-cyan-600',
  'from-indigo-400 to-indigo-600',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getGradientColor(index: number): string {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/public/reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-primary text-primary' : 'text-muted'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Community Reviews</h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                What professionals are saying about SpaceOut
              </p>
            </motion.div>
          </div>
        </section>
        <section className="py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="text-center text-muted-foreground">Loading reviews...</div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (error || reviews.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Community Reviews</h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                What professionals are saying about SpaceOut
              </p>
            </motion.div>
          </div>
        </section>
        <section className="py-20">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="text-center text-muted-foreground">
              {error || 'No reviews available yet. Be the first to share your experience!'}
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Community Reviews</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              What professionals are saying about SpaceOut
            </p>
          </motion.div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientColor(
                          idx
                        )} flex items-center justify-center text-white font-semibold text-sm`}
                      >
                        {getInitials(review.author)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{review.author}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-muted-foreground italic">"{review.content}"</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="grid md:grid-cols-3 gap-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {[
              {
                number: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0',
                label: 'Average Rating',
              },
              { number: reviews.length.toString(), label: 'Verified Reviews' },
              { number: '98%', label: 'Satisfaction Rate' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
