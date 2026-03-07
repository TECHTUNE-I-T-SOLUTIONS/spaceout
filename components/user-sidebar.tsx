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
  Rocket,
  Telescope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogoutConfirmModal } from '@/components/logout-confirm-modal';
import { useSidebar } from '@/lib/sidebar-context';
import { ThemeSwitcher } from '@/components/theme-switcher';

const menuItems = [
  { href: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/user/check-in', icon: LogIn, label: 'Check In' },
  { href: '/user/astronaut-card', icon: Telescope , label: 'Astronaut Card' },
  { href: '/user/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/user/payments', icon: CreditCard, label: 'Payments' },
  { href: '/user/reviews', icon: Star, label: 'Reviews' },
  { href: '/user/feedback', icon: MessageSquare, label: 'Feedback' },
  { href: '/user/profile', icon: User, label: 'Profile' },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header with collapse toggle - Desktop only */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {isOpen && <h2 className="text-lg font-bold">User Portal</h2>}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggle()}
            title={isOpen ? 'Collapse' : 'Expand'}
            className="ml-auto"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${!isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-2 p-4 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            } ${!isOpen && !isMobile ? 'justify-center' : ''}`}
            title={!isOpen && !isMobile ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {(isOpen || isMobile) && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </Link>
        ))}
      </div>

      <div className={`p-4 border-t border-border flex ${!isOpen && !isMobile ? 'flex-col items-center' : 'items-center justify-between'} gap-2`}>
        <Button
          onClick={() => setLogoutOpen(true)}
          variant="ghost"
          className={`${!isOpen && !isMobile ? 'w-full px-0' : 'flex-1 justify-start'} text-foreground hover:bg-muted`}
          title={!isOpen && !isMobile ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 mr-3" />
          {(isOpen || isMobile) && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </Button>
        <ThemeSwitcher />
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
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <SidebarContent isMobile={false} />
      </motion.div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal isOpen={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
