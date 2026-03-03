'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { HelpCircle, BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function Help() {
  const helpCategories = [
    {
      icon: HelpCircle,
      title: 'Getting Started',
      description: 'Learn how to book and access our workspaces',
      topics: ['Registration', 'Booking a Space', 'Payment Methods', 'Membership'],
    },
    {
      icon: BookOpen,
      title: 'Services & Facilities',
      description: 'Information about our various workspace options',
      topics: ['Workspace Types', 'Amenities', 'Pricing Plans', 'Access & Hours'],
    },
    {
      icon: MessageSquare,
      title: 'Account & Support',
      description: 'Manage your account and get support',
      topics: ['Profile Settings', 'Payment History', 'Cancellation', 'Contact Support'],
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Help Center</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Find answers to your questions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {helpCategories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full hover:border-primary transition-colors">
                  <category.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                  <p className="text-muted-foreground mb-6">{category.description}</p>
                  <ul className="space-y-2">
                    {category.topics.map((topic, topicIdx) => (
                      <li
                        key={topicIdx}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        • {topic}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Can't find what you're looking for?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Our support team is here to help. Contact us anytime.
            </p>
            <Link href="/contact" className="inline-block">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Contact Support
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
