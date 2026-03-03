'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function UserDashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to SpaceOut</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          {
            icon: CreditCard,
            label: 'Membership Status',
            value: 'Inactive',
            color: 'text-amber-500',
          },
          {
            icon: Clock,
            label: 'Hours Used',
            value: '0 hours',
            color: 'text-blue-500',
          },
          {
            icon: Calendar,
            label: 'Active Bookings',
            value: '0',
            color: 'text-green-500',
          },
          {
            icon: CheckCircle,
            label: 'Check-Ins Today',
            value: '0',
            color: 'text-purple-500',
          },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/user/check-in">
            <Button className="w-full justify-start" variant="outline" size="lg">
              Check In Now
            </Button>
          </Link>
          <Link href="/user/bookings">
            <Button className="w-full justify-start" variant="outline" size="lg">
              Make a Booking
            </Button>
          </Link>
          <Link href="/user/payments">
            <Button className="w-full justify-start" variant="outline" size="lg">
              View Payments
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Membership CTA */}
      <motion.div variants={itemVariants}>
        <Card className="p-8 bg-primary text-primary-foreground border-primary">
          <h3 className="text-xl font-bold mb-2">Upgrade Your Membership</h3>
          <p className="mb-6 opacity-90">
            Get priority access and special rates with an annual membership for just ₦2,500/year
          </p>
          <Button variant="secondary">
            Become a Member
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
}
