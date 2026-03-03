'use client';

import { useSidebar } from '@/lib/sidebar-context';
import { UserMobileHeader } from './user-mobile-header';
import { UserSidebar } from './user-sidebar';

interface UserLayoutWrapperProps {
  children: React.ReactNode;
}

export function UserLayoutWrapper({ children }: UserLayoutWrapperProps) {
  const { isOpen } = useSidebar();

  return (
    <>
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
