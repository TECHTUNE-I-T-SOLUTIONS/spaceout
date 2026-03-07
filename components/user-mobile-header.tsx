'use client';

import { useState } from 'react';
import { Menu, Telescope, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  Calendar,
  CreditCard,
  Star,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react';
import { LogoutConfirmModal } from '@/components/logout-confirm-modal';
import { ThemeSwitcher } from '@/components/theme-switcher';

const menuItems = [
  { href: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/user/check-in', icon: LogIn, label: 'Check In' },
  { href: '/user/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/user/astronaut-card', icon: Telescope, label: 'Astronaut Card' },
  { href: '/user/payments', icon: CreditCard, label: 'Payments' },
  { href: '/user/reviews', icon: Star, label: 'Reviews' },
  { href: '/user/feedback', icon: MessageSquare, label: 'Feedback' },
  { href: '/user/profile', icon: User, label: 'Profile' },
];

export function UserMobileHeader() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background border-b z-40 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="text-lg font-bold">SpaceOut</div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="h-10 w-10">
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="border-b border-border p-4">
                  <h2 className="text-lg font-bold">Menu</h2>
                </div>

                {/* Menu Items */}
                <div className="flex-1 space-y-2 p-4 overflow-y-auto">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Logout and Theme Toggle */}
                <div className="border-t border-border p-4 flex items-center justify-between gap-2">
                  <Button
                    onClick={() => setLogoutOpen(true)}
                    variant="ghost"
                    className="flex-1 justify-start text-foreground hover:bg-muted"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0 mr-3" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </Button>
                  <ThemeSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal isOpen={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
