'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sunrise, Moon, Clock, Hourglass, Sun, Calendar } from 'lucide-react';

export default function Pricing() {
  const pricingTiers = [
    {
      name: 'Annual Membership',
      price: '₦2,500',
      period: '/year',
      description: 'Perfect for regular users who want consistent access',
      features: [
        'Priority access to workspaces',
        'Member-exclusive pricing rates',
        'Community benefits',
        '365 days validity',
        'Discount on all plans',
      ],
      cta: 'Become a Member',
      highlighted: false,
    },
    {
      name: 'Pay Per Use',
      price: 'Flexible',
      period: 'Hourly & Daily',
      description: 'Great for casual users or first-time visitors',
      features: [
        'No long-term commitment',
        'Full access to all spaces',
        'Easy and quick booking',
        'Hourly, daily, weekly options',
        'Pay only for what you use',
      ],
      cta: 'Book Now',
      highlighted: true,
    },
  ];

  const planTypes = [
    {
      title: 'Day Plans',
      description: 'Morning to evening workspace access',
      icon: Sunrise,
    },
    {
      title: 'Night Plans',
      description: 'Evening to late night access',
      icon: Moon,
    },
    {
      title: '24-Hour Plans',
      description: 'Round-the-clock access',
      icon: Clock,
    },
    {
      title: 'Hourly Plans',
      description: 'Pay per hour of usage',
      icon: Hourglass,
    },
    {
      title: 'Half-Day Plans',
      description: '4-hour focused work session',
      icon: Sun,
    },
    {
      title: 'Weekly & Monthly',
      description: 'Extended access plans',
      icon: Calendar,
    },
  ];

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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Flexible Pricing</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Choose the plan that fits your schedule and budget
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {pricingTiers.map((tier, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className={`p-8 h-full transition-all ${
                    tier.highlighted
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border'
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground ml-2">{tier.period}</span>
                  </div>
                  <p className="text-muted-foreground mb-6">{tier.description}</p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register">
                    <Button className="w-full" variant={tier.highlighted ? 'default' : 'outline'}>
                      {tier.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Plan Types Grid */}
      <section className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Plan Types</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Multiple options to match your work style
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {planTypes.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 text-center h-full hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-2 group cursor-pointer">
                  <plan.icon className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-125 transition-transform duration-300" />
                  <h3 className="font-semibold mb-2">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Custom Pricing?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Contact us for group bookings, corporate packages, or special arrangements
            </p>
            <Link href="/contact">
              <Button size="lg">Get in Touch</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
