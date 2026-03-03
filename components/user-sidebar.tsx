'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  LogIn,
  Calendar,
  CreditCard,
  Star,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogoutConfirmModal } from '@/components/logout-confirm-modal';

const menuItems = [
  { href: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/user/check-in', icon: LogIn, label: 'Check In' },
  { href: '/user/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/user/payments', icon: CreditCard, label: 'Payments' },
  { href: '/user/reviews', icon: Star, label: 'Reviews' },
  { href: '/user/feedback', icon: MessageSquare, label: 'Feedback' },
  { href: '/user/profile', icon: User, label: 'Profile' },
];

export function UserSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header with collapse toggle - Desktop only */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isDesktopCollapsed && <h2 className="text-lg font-bold">User Portal</h2>}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            title={isDesktopCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${isDesktopCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-2 p-4 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            } ${isDesktopCollapsed && !isMobile ? 'justify-center' : ''}`}
            title={isDesktopCollapsed && !isMobile ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {(!isDesktopCollapsed || isMobile) && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <Button
          onClick={() => setLogoutOpen(true)}
          variant="ghost"
          className={`w-full text-foreground hover:bg-muted ${isDesktopCollapsed && !isMobile ? 'px-0' : 'justify-start'}`}
          title={isDesktopCollapsed && !isMobile ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 mr-3" />
          {(!isDesktopCollapsed || isMobile) && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`hidden md:fixed left-0 top-0 h-screen border-r border-border bg-background z-40 md:flex flex-col transition-all duration-300 ${
          isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent isMobile={false} />
      </motion.div>

      {/* Mobile Drawer */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="md:hidden fixed">
          <Button size="icon" variant="ghost" className="fixed top-4 right-4 z-50">
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal isOpen={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
