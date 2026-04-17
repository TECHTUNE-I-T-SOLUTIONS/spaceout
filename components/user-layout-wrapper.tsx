'use client';

import { useSidebar } from '@/lib/sidebar-context';
import { UserMobileHeader } from './user-mobile-header';
import { UserSidebar } from './user-sidebar';
import { FloatingContactWidget } from './floating-contact-widget';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface UserLayoutWrapperProps {
  children: React.ReactNode;
}

export function UserLayoutWrapper({ children }: UserLayoutWrapperProps) {
  const { isOpen } = useSidebar();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [isClient, status, router]);

  // Show loading while session is being determined
  if (!isClient || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if unauthenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      {/* Floating Contact Widget */}
      <FloatingContactWidget />

      {/* Mobile Header & Sidebar */}
      <UserMobileHeader />

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:block bg-background border-r transition-all duration-300 ${
          isOpen ? 'md:w-64' : 'md:w-20'
        }`}
      >
        <UserSidebar />
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 mt-16 md:mt-0 min-h-screen bg-background overflow-auto ${
          isOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
