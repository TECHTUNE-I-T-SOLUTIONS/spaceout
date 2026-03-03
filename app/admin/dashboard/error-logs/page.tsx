'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function ErrorLogsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold mb-8">Error Logs</h1>
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">System Error Logs</h2>
        <p className="text-muted-foreground">View all system errors and debug information.</p>
      </Card>
    </motion.div>
  );
}
