'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Zap, Lightbulb, Shield, Users, Volume2, Wifi } from 'lucide-react';

export default function Services() {
  const services = [
    {
      id: 1,
      title: 'General Workspace',
      description: 'Open-plan professional workspace perfect for flexible work schedules and collaborative projects.',
      features: ['Fast WiFi', 'Stable Power', 'Natural Lighting', 'Community Space'],
      icon: Users,
    },
    {
      id: 2,
      title: 'Office/Meeting Rooms',
      description: 'Private spaces designed for team meetings, client calls, and focused individual work.',
      features: ['Conference Table', 'Privacy', 'WiFi & Power', 'Soundproofed'],
      icon: Shield,
    },
    {
      id: 3,
      title: 'Conference Rooms',
      description: 'Fully equipped spaces for presentations, workshops, training sessions, and large meetings.',
      features: ['Projector Ready', 'Whiteboard', 'Seating for 20+', 'WiFi & Audio'],
      icon: Lightbulb,
    },
    {
      id: 4,
      title: 'Content Space',
      description: 'Specialized environment for content creators with enhanced lighting and acoustics.',
      features: ['Professional Lighting', 'Acoustic Treatment', 'Green Screen Ready', 'Editing Suite'],
      icon: Zap,
    },
  ];

  const amenities = [
    { icon: Zap, name: 'Stable Power', description: '24/7 consistent electricity supply' },
    { icon: Wifi, name: 'High-Speed WiFi', description: 'Reliable and fast internet connectivity' },
    { icon: Lightbulb, name: 'Professional Lighting', description: 'Reduces eye strain and enhances focus' },
    { icon: Volume2, name: 'Quiet Environment', description: 'Soundproofed areas for deep work' },
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Our Services</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Flexible workspace solutions tailored to your professional needs
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-8 h-full hover:border-primary transition-colors">
                  <service.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6">{service.description}</p>
                  <div className="space-y-2">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Premium Amenities</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for productive work
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {amenities.map((amenity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 text-center h-full">
                  <amenity.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{amenity.name}</h3>
                  <p className="text-sm text-muted-foreground">{amenity.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
