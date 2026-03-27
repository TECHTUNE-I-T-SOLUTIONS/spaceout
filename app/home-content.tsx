'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

import { useState, useEffect } from 'react';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedHeading } from '@/components/animated-heading';
import { ParticleGlassBackground } from '@/components/particle-glass-background';
import Link from 'next/link';
import { Zap, Lightbulb, Shield, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const heroImages = [
  '/assets/IMG_8850.jpg',
  '/assets/IMG_8851.jpg',
  '/assets/IMG_8852.jpg',
  '/assets/IMG_8853.jpg',
  '/assets/IMG_8854.jpg',
  '/assets/IMG_8855.jpg',
  '/assets/IMG_8856.jpg',
  '/assets/IMG_8857.jpg',
  '/assets/IMG_8858.jpg',
  '/assets/IMG_8859.jpg',
  '/assets/IMG_8862.jpg',
  '/assets/IMG_8863.jpg',
  '/assets/IMG_8864.jpg',
  '/assets/IMG_8865.jpg',
  '/assets/IMG_8866.jpg',
  '/assets/IMG_8867.jpg',
  '/assets/IMG_8868.jpg',
  '/assets/IMG_8869.jpg',
  '/assets/IMG_8870.jpg',
  '/assets/IMG_8871.jpg',
  '/assets/IMG_8872.jpg',
  '/assets/inside (2).jpeg',
  '/assets/inside (4).jpeg',
];

export function HomeContent() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  // Rotate background images every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

    const [qrOpen, setQrOpen] = useState(false);

  // Get app URL from environment
  const appUrl = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl || '')}`;

  return (
    <>
      {/* QR Code Sharing Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="fixed bottom-6 right-6 z-50 bg-white/80 text-black shadow-lg hover:bg-white"
            aria-label="Share SpaceOut via QR"
            style={{ borderRadius: 999 }}
          >
            <span className="hidden md:inline">Share</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="inline-block md:ml-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M7 7h.01M17 7h.01M7 17h.01M14 14h2v2m-2-6V7m0 10v-2m6-2h-2m-6 0H7"/></svg>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xs w-full p-4 rounded-xl text-center">
          <DialogHeader>
            <DialogTitle>Share SpaceOut</DialogTitle>
            <DialogDescription>Scan or share this QR code to invite others to SpaceOut!</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <img
              src={qrCodeUrl}
              alt="SpaceOut QR Code"
              className="rounded-lg border bg-white mx-auto"
              width={220}
              height={220}
            />
            <div className="flex gap-2 w-full justify-center">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => {
                  // Download QR code image
                  const link = document.createElement('a');
                  link.href = qrCodeUrl;
                  link.download = 'spaceout-qr.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download
              </Button>
              <Button
                variant="default"
                className="w-1/2"
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({
                      title: 'SpaceOut - Premium Workspace Solutions',
                      text: 'Check out SpaceOut for premium coworking and office spaces!',
                      url: appUrl,
                    });
                  } else {
                    await navigator.clipboard.writeText(appUrl || '');
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                Share
              </Button>
            </div>
          </div>
          <DialogFooter>
            <p className="text-xs text-muted-foreground mt-2">Or just copy the link: <span className="font-mono select-all">{appUrl}</span></p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hero Section with Background Images (Space Particles are global) */}
      <section className="relative overflow-hidden py-20 md:py-32 min-h-[600px] flex items-center justify-center">
        {/* Background Image Carousel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src={heroImages[currentImageIndex]}
              alt="SpaceOut Office Space"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 85vw"
              onError={(e) => {
                // Fallback if image fails to load
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = '/assets/IMG_8850.jpg';
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/20" />

        {/* Hero Content */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="max-w-full mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatedHeading text="Cool Spaces for Everyone" />

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-white mb-8 text-balance mt-8 drop-shadow-lg">
              Spaces, Coworking and office solutions. Experience stable power, professional lighting, and environments designed for focus.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white/20">
                  View Pricing
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white/20" onClick={() => setQrOpen(true)}>
                Share
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="services" className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SpaceOut?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Designed for professionals who demand more from their workspace
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Zap,
                title: 'Stable Power',
                description: 'Consistent, reliable electricity so you stay productive all day',
              },
              {
                icon: Lightbulb,
                title: 'Fast Internet',
                description: 'High-speed WiFi and stable connectivity for seamless work',
              },
              {
                icon: Shield,
                title: 'Fair Pricing',
                description: 'Transparent, competitive rates with flexible plans for everyone',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Network with like-minded professionals and small teams',
              },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="flex flex-col items-center p-6 h-full backdrop-blur-sm bg-muted/40 border-muted/60 hover:border-primary hover:bg-muted/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 group cursor-pointer">
                  <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Spaces</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Flexible options tailored to your work style and needs
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-5 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                title: 'General Workspace',
                description: 'Open-plan professional workspace perfect for flexible work schedules',
              },
              {
                title: 'Office/Meeting Rooms',
                description: 'Private spaces for confidential meetings and focused team collaboration',
              },
              {
                title: 'Conference Room',
                description: 'Professional conference facilities for large meetings, presentations, and team workshops',
              },
              {
                title: 'Event Space',
                description: 'Unique venue perfect for workshops, seminars, and networking events',
              },
              {
                title: 'Content Creation Spaces',
                description: 'Specialized areas with professional lighting and soundproofing for creators and streamers',
              },
            ].map((space, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="flex flex-col justify-between p-6 h-full hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{space.title}</h3>
                    <p className="text-muted-foreground text-sm">{space.description}</p>
                  </div>
                  <Link href="/services" className="mt-4">
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Find Your Perfect Space?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of professionals who trust SpaceOut for their workspace needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg">Get Started Now</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
