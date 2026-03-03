'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function CheckInPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <h1 className="text-3xl font-bold mb-8">Check In</h1>
      
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Select a Service to Check In</h2>
        <p className="text-muted-foreground mb-6">
          Choose your workspace and check in to track your usage
        </p>
        <p className="text-muted-foreground text-sm">
          Check-in functionality coming soon. Services will be loaded from the database.
        </p>
      </Card>
    </motion.div>
  );
}
