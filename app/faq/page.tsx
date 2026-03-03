'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is SpaceOut?',
          a: 'SpaceOut is a premium workspace provider in Tanke, Ilorin, offering flexible workspace solutions for professionals, entrepreneurs, and teams.',
        },
        {
          q: 'Where is SpaceOut located?',
          a: 'SpaceOut is located in Tanke, Ilorin, Nigeria. Easy access and excellent connectivity are guaranteed.',
        },
        {
          q: 'What are your operating hours?',
          a: 'We are open Monday-Friday 6:00 AM - 10:00 PM and Saturday-Sunday 8:00 AM - 8:00 PM.',
        },
      ],
    },
    {
      category: 'Membership & Pricing',
      questions: [
        {
          q: 'How much does membership cost?',
          a: 'Annual membership is ₦2,500 and is valid for 365 days. Members enjoy special pricing rates on all workspace plans.',
        },
        {
          q: 'Can I pay per use?',
          a: 'Yes! We offer flexible hourly, daily, weekly, and monthly plans. Pay only for what you use.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major payment methods including Paystack, bank transfers, and card payments.',
        },
      ],
    },
    {
      category: 'Workspaces',
      questions: [
        {
          q: 'What types of workspaces do you offer?',
          a: 'We offer General Workspace, Office/Meeting Rooms, Conference Rooms, and Content Spaces.',
        },
        {
          q: 'What amenities are included?',
          a: 'All spaces include stable power, high-speed WiFi, professional lighting, quiet environment, and a supportive community.',
        },
        {
          q: 'Do you offer 24-hour access?',
          a: 'Yes, 24-hour plans are available for members who need round-the-clock access.',
        },
      ],
    },
    {
      category: 'Bookings & Access',
      questions: [
        {
          q: 'How do I book a workspace?',
          a: 'Register on our platform, select your desired space and time slot, make payment, and you\'re all set!',
        },
        {
          q: 'Can I cancel my booking?',
          a: 'Yes, cancellations are allowed up to 24 hours before your booking time for a full refund.',
        },
        {
          q: 'Do you have parking facilities?',
          a: 'Yes, convenient parking is available for all members.',
        },
      ],
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Frequently Asked Questions</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Find answers to common questions about SpaceOut
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {faqs.map((section, sectionIdx) => (
              <motion.div
                key={sectionIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIdx * 0.1 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-6">{section.category}</h2>
                </div>

                <Card className="p-6 border-border">
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((faq, idx) => (
                      <AccordionItem key={idx} value={`item-${sectionIdx}-${idx}`}>
                        <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Feel free to reach out to our support team for more information.
            </p>
            <a href="/contact" className="inline-block">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                Contact Us
              </button>
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
