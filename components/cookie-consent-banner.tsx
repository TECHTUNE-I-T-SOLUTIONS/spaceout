'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('spaceout_cookie_consent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('spaceout_cookie_consent', 'accepted');
    setIsVisible(false);
    // Trigger push notification prompt
    window.dispatchEvent(new Event('show-push-prompt'));
  };

  const handleReject = () => {
    localStorage.setItem('spaceout_cookie_consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Cookie Preferences</h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, remember preferences, and understand how you interact with SpaceOut. 
                By accepting, you agree to our use of cookies for analytics and functionality.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                className="whitespace-nowrap"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              >
                Accept & Continue
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
