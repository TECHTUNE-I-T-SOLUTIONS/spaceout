'use client'

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchContacts();
  }, []);

    const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contact');
        if (response.ok) {
            const data = await response.json();
            setContacts(data.contacts);
        } else {
            throw new Error('Failed to fetch contacts');
        }
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        toast.error('Failed to load contacts. Please try again later.', {
            description: 'An error occurred while fetching contact messages.',
        });
    }
  };

  if (!isMounted) {
    return null;
    }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">View and manage contact form submissions from users.</p>
      </div>

      <Card className="p-6">
        {contacts.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground">No contact messages found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact._id} className="border-b pb-4">
                <h3 className="font-semibold">{contact.name}</h3>
                <p className="text-muted-foreground">{contact.email}</p>
                <p>{contact.message}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted on {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}