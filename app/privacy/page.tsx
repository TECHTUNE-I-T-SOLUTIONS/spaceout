'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

export default function Privacy() {
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            className="prose prose-sm dark:prose-invert max-w-none space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground">
                SpaceOut ("we", "us", "our", or "Company") operates the SpaceOut website and app. This page 
                informs you of our policies regarding the collection, use, and disclosure of personal data when 
                you use our Service and the choices you have associated with that data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Information Collection and Use</h2>
              <p className="text-muted-foreground mb-3">
                We collect several different types of information for various purposes to provide and improve our Service.
              </p>
              <h3 className="text-lg font-semibold mb-2">Types of Data Collected:</h3>
              <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                <li>Personal Data (name, email, phone number, location, payment information)</li>
                <li>Usage Data (log data, analytics, device information)</li>
                <li>Location Data (if you grant permission)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Use of Data</h2>
              <p className="text-muted-foreground mb-3">SpaceOut uses the collected data for various purposes:</p>
              <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
                <li>To provide and maintain our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address fraud and security issues</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Security of Data</h2>
              <p className="text-muted-foreground">
                The security of your data is important to us but remember that no method of transmission over 
                the Internet or method of electronic storage is 100% secure. While we strive to use commercially 
                acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at info@spaceout.com
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
