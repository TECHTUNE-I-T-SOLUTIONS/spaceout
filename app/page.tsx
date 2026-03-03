'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedHeading } from '@/components/animated-heading';
import { ParticleGlassBackground } from '@/components/particle-glass-background';
import Link from 'next/link';
import { Zap, Lightbulb, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
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

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="max-w-full mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatedHeading text="Cool Spaces for Everyone" />

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-8 text-balance mt-8">
              Spaces, Coworking and office solutions in Tanke, Ilorin. Experience stable power, professional lighting, and environments designed for focus.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
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
                title: 'Professional Lighting',
                description: 'Carefully designed lighting that reduces eye strain and enhances focus',
              },
              {
                icon: Shield,
                title: 'Quiet Environment',
                description: 'Sound-proofed areas designed for deep work and concentration',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Network with like-minded professionals and small teams',
              },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="p-6 h-full backdrop-blur-sm bg-muted/40 border-muted/60 hover:border-primary hover:bg-muted/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 group cursor-pointer">
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
            className="grid md:grid-cols-3 gap-6"
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
                description: 'Private spaces for team meetings, client calls, and focused work',
              },
              {
                title: 'Conference Rooms',
                description: 'Fully equipped rooms for presentations, workshops, and large meetings',
              },
            ].map((space, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="p-8 h-full border-border hover:border-primary transition-all duration-300 backdrop-blur-sm bg-background/40 hover:bg-background/60 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-2 group cursor-pointer">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{space.title}</h3>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">{space.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Pricing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Pay as you go or invest in a membership for exclusive benefits
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Card className="p-8 border border-border backdrop-blur-sm bg-background/40 hover:bg-background/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group cursor-pointer">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">Annual Membership</h3>
                <p className="text-muted-foreground mb-6">₦2,500/year</p>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">✓ Priority access</li>
                  <li className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">✓ Special rates</li>
                  <li className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">✓ Community benefits</li>
                </ul>
                <Button className="w-full group-hover:shadow-lg transition-all duration-300">Become a Member</Button>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-8 border-2 border-primary bg-primary/5 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-2 group cursor-pointer ring-2 ring-primary/20">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">Pay Per Use</h3>
                <p className="text-muted-foreground mb-6">Flexible hourly & daily rates</p>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">✓ No commitments</li>
                  <li className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">✓ Full access</li>
                  <li className="flex items-center gap-2 group-hover:text-foreground transition-colors duration-300">✓ Easy booking</li>
                </ul>
                <Button className="w-full group-hover:shadow-lg transition-all duration-300" variant="default">
                  Check Rates
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prime Location</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Located in Tanke, Ilorin - easy access, excellent connectivity, and professional surroundings
            </p>
            <Card className="p-8 bg-card border border-border backdrop-blur-sm hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4">SpaceOut - Tanke Branch</h3>
              <p className="text-muted-foreground mb-6">Tanke, Ilorin, Nigeria</p>
              <Button asChild variant="default" className="hover:shadow-lg transition-all duration-300">
                <a href="/location">View Location</a>
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden border-t border-border">
        <ParticleGlassBackground />
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Ready to Level Up Your Workspace?</h2>
            <p className="text-lg mb-8 text-foreground/80 max-w-2xl mx-auto">
              Join professionals who have found their perfect work environment at SpaceOut
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="default" className="hover:shadow-lg transition-all duration-300">
                Get Started Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
