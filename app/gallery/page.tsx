'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Building2, Users, Presentation, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function Gallery() {
  const galleryItems = [
    {
      id: 1,
      title: 'General Workspace',
      description: 'Open-plan area with natural lighting',
      category: 'workspace',
      icon: Building2,
    },
    {
      id: 2,
      title: 'Meeting Room',
      description: 'Private meeting space with conference table',
      category: 'office',
      icon: Users,
    },
    {
      id: 3,
      title: 'Conference Hall',
      description: 'Large space for presentations',
      category: 'conference',
      icon: Presentation,
    },
    {
      id: 4,
      title: 'Collaborative Area',
      description: 'Team workspace with high-speed WiFi',
      category: 'workspace',
      icon: Users,
    },
    {
      id: 5,
      title: 'Content Studio',
      description: 'Professional setup for creators',
      category: 'content',
      icon: Lightbulb,
    },
    {
      id: 6,
      title: 'Quiet Zone',
      description: 'Soundproofed individual work station',
      category: 'workspace',
      icon: Building2,
    },
  ];

  const handleViewDetails = (itemTitle: string) => {
    toast.success('Details Opened', {
      description: `Viewing details for ${itemTitle}.`,
    });
  };

  const handleScheduleTour = () => {
    toast.success('Tour Scheduled', {
      description: 'Our team will contact you to confirm your tour date and time.',
    });
  };

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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Gallery</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Explore our premium workspaces and facilities
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {galleryItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden h-full hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group cursor-pointer flex flex-col">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300">
                    <item.icon className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2 flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="px-2 py-1 bg-muted text-xs rounded text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewDetails(item.title)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Experience SpaceOut in Person</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Schedule a tour of our facilities to see where your next great work happens. 
              Contact us to arrange a visit at your convenience.
            </p>
            <Button size="lg" onClick={handleScheduleTour}>Schedule a Tour</Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
