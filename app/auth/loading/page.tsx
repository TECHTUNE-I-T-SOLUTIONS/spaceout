'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function LoadingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Verify session and redirect
  useEffect(() => {
    const verifySessionAndRedirect = async () => {
      // Wait 1 second for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Check if session exists via API
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include', // Include cookies
        });
        
        const sessionData = await response.json();
        
        console.log('[Loading] Session check response:', sessionData);
        console.log('[Loading] Session user:', sessionData?.user);
        
        if (sessionData && sessionData.user && sessionData.user.email) {
          // Session exists with valid user, go to dashboard
          console.log('[Loading] Valid session found, redirecting to dashboard');
          router.push('/user/dashboard');
        } else {
          // No valid session, go back to login
          console.log('[Loading] No valid session, redirecting to login');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('[Loading] Session check error:', error);
        // On error, go back to login
        router.push('/auth/login');
      }
    };

    verifySessionAndRedirect();
  }, [router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
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

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const rotatingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center max-w-md w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <motion.div variants={floatingVariants} animate="animate" className="w-24 h-24 relative">
            {mounted && theme === 'dark' ? (
              <Image
                src="/logo-dark.png"
                alt="SpaceOut"
                width={96}
                height={96}
                className="object-contain"
              />
            ) : (
              <Image
                src="/logo-light.png"
                alt="SpaceOut"
                width={96}
                height={96}
                className="object-contain"
              />
            )}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-gray-300">Setting up your session</p>
        </motion.div>

        {/* Loading Spinner */}
        <motion.div variants={itemVariants} className="mb-8 relative w-16 h-16">
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
            variants={rotatingVariants}
            animate="animate"
          ></motion.div>
        </motion.div>

        {/* Loading Text */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-gray-300 text-sm">
            Loading<span className="inline-block w-6">{dots}</span>
          </p>
        </motion.div>

        {/* Status Messages */}
        <motion.div variants={itemVariants} className="mt-12 space-y-3 text-center text-xs text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Verifying credentials</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            <span>Initializing session</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>Preparing dashboard</span>
          </div>
        </motion.div>

        {/* Subtle Footer Message */}
        <motion.p
          variants={itemVariants}
          className="mt-16 text-center text-gray-500 text-xs"
        >
          This should only take a moment...
        </motion.p>
      </motion.div>
    </div>
  );
}
