'use client';

import { useAdminSidebar } from '@/lib/admin-sidebar-context';
import { AdminMobileHeader } from './admin-mobile-header';
import { AdminSidebar } from './admin-sidebar';
import AdminChatWidget from './admin-chat-widget';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  userRole: string;
}

export function AdminLayoutWrapper({ children, userRole }: AdminLayoutWrapperProps) {
  const { isCollapsed } = useAdminSidebar();

  return (
    <>
      {/* Mobile Header */}
      <AdminMobileHeader userRole={userRole} />

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:block bg-background border-r transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        <AdminSidebar userRole={userRole} />
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 min-h-screen bg-background overflow-auto ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        } md:pt-0 pt-[80px]`}
      >
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Chat Widget */}
      <AdminChatWidget />
    </>
  );
}
