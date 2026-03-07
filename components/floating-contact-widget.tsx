'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Phone, MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

const CONTACT_NUMBER = '+2348099885454';
const CONTACT_NUMBER_LINK = '2348099885454';

export function FloatingContactWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleCall = () => {
    window.location.href = `tel:${CONTACT_NUMBER}`;
    setIsOpen(false);
  };

  const handleWhatsApp = () => {
    // Get user info from session
    const userName = session?.user?.name || 'User';
    const userEmail = session?.user?.email || 'email not provided';
    
    // Pre-compose message with user's details
    const message = `Hi, my name is ${userName} and my email is ${userEmail}. I'd like to get in touch regarding SpaceOut services.`;
    
    // WhatsApp link format with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${CONTACT_NUMBER_LINK}?text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  return (
    <motion.div
      className="fixed bottom-24 right-6 md:bottom-32 md:right-8 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Menu Items */}
      {isOpen && (
        <motion.div
          className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
        >
          {/* Call Button */}
          <motion.button
            onClick={handleCall}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Call</span>
          </motion.button>

          {/* WhatsApp Button */}
          <motion.button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">WhatsApp</span>
          </motion.button>
        </motion.div>
      )}

      {/* Main Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-200 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-primary dark:bg-primary-foreground hover:opacity-90'
        } text-white`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Phone className="w-6 h-6" />
        )}
      </motion.button>

      {/* Tooltip - appears on hover when closed */}
      {!isOpen && (
        <motion.div
          className="absolute bottom-16 right-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 rounded-md text-xs whitespace-nowrap pointer-events-none"
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
        >
          Contact Us
        </motion.div>
      )}
    </motion.div>
  );
}
