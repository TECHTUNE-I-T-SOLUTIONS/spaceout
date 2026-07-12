'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';

export function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for cookie consent acceptance
    const handleShowPrompt = () => {
      // Check if user has already responded to push notification prompt
      const pushConsent = localStorage.getItem('spaceout_push_consent');
      if (!pushConsent && 'serviceWorker' in navigator && 'PushManager' in window) {
        setIsVisible(true);
      }
    };

    window.addEventListener('show-push-prompt', handleShowPrompt);
    return () => window.removeEventListener('show-push-prompt', handleShowPrompt);
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers not supported in this browser');
      }

      if (!('PushManager' in window)) {
        throw new Error('Push notifications not supported in this browser');
      }

      // Register service worker
      console.log('[Push Notification] Registering service worker from /sw.js');
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[Push Notification] Service worker registered:', registration);
      } catch (swError) {
        console.error('[Push Notification] Service worker registration failed:', swError);
        const errorMessage = swError instanceof Error ? swError.message : 'Unknown error';
        throw new Error(`Service worker registration failed: ${errorMessage}`);
      }

      // Wait for service worker to be active
      console.log('[Push Notification] Waiting for service worker to be active');
      await navigator.serviceWorker.ready;
      console.log('[Push Notification] Service worker is ready');
      
      // Ensure we have an active registration
      if (!registration.active) {
        console.log('[Push Notification] Waiting for service worker to become active');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Service worker activation timeout'));
          }, 10000); // 10 second timeout

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  clearTimeout(timeout);
                  resolve(true);
                }
              });
            }
          });

          // If already activating or activated, resolve immediately
          if (registration.installing?.state === 'activated' || registration.active) {
            clearTimeout(timeout);
            resolve(true);
          }
        });
        console.log('[Push Notification] Service worker is now active');
      }

      // Request notification permission
      console.log('[Push Notification] Requesting notification permission');
      const permission = await Notification.requestPermission();
      console.log('[Push Notification] Permission result:', permission);

      if (permission === 'granted') {
        // Subscribe to push notifications
        console.log('[Push Notification] Subscribing to push manager');
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }

        // Convert VAPID key from URL-safe base64 to Uint8Array
        console.log('[Push Notification] Converting VAPID key to Uint8Array');
        let applicationServerKey: Uint8Array;
        try {
          // Handle URL-safe base64 (with - and _ instead of + and /)
          const base64 = vapidPublicKey
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          
          // Add padding if needed
          const padding = '='.repeat((4 - (base64.length % 4)) % 4);
          const standardBase64 = base64 + padding;
          
          const binary = atob(standardBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          applicationServerKey = bytes;
          console.log('[Push Notification] VAPID key converted successfully, length:', bytes.length);
        } catch (keyError) {
          console.error('[Push Notification] VAPID key conversion failed:', keyError);
          throw new Error('Invalid VAPID public key format');
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
        console.log('[Push Notification] Push subscription created:', subscription);

        // Save subscription to database
        console.log('[Push Notification] Saving subscription to database');
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });

        console.log('[Push Notification] Response status:', response.status);

        if (response.ok) {
          console.log('[Push Notification] Subscription saved successfully');
          localStorage.setItem('spaceout_push_consent', 'accepted');
          setIsVisible(false);
        } else {
          const error = await response.json();
          console.error('[Push Notification] Server error:', error);
          throw new Error(`Failed to save subscription: ${error.message}`);
        }
      } else {
        console.log('[Push Notification] User denied notification permission');
        localStorage.setItem('spaceout_push_consent', 'rejected');
        setIsVisible(false);
      }
    } catch (error) {
      console.error('[Push Notification] Setup error:', error);
      localStorage.setItem('spaceout_push_consent', 'rejected');
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = () => {
    localStorage.setItem('spaceout_push_consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleDisable}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
            <div className="bg-white rounded-xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Enable Notifications</h2>
                </div>
                <button
                  type="button"
                  onClick={handleDisable}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                  title="Close notification prompt"
                  aria-label="Close notification prompt"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Get instant updates about your bookings, check-ins, payments, and special offers from SpaceOut. We'll send you timely notifications to keep you informed.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">✓</span>
                  </div>
                  <span className="text-sm text-gray-700">Booking confirmations & reminders</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">✓</span>
                  </div>
                  <span className="text-sm text-gray-700">Check-in & check-out updates</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">✓</span>
                  </div>
                  <span className="text-sm text-gray-700">Payment receipts & confirmations</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDisable}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Not Now
                </Button>
                <Button
                  onClick={handleEnable}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Setting up...' : 'Enable Notifications'}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                You can manage notifications anytime in your settings
              </p>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
