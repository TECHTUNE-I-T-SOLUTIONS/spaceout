'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShoppingCart,
  Calendar,
  Image,
  Star,
  MessageSquare,
  AlertTriangle,
  Building2,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { LogoutConfirmModal } from '@/components/logout-confirm-modal';

interface AdminMobileHeaderProps {
  userRole: string;
}

export function AdminMobileHeader({ userRole }: AdminMobileHeaderProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const adminMenuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/dashboard/users', icon: Users, label: 'Users' },
    { href: '/admin/dashboard/payments', icon: ShoppingCart, label: 'Payments' },
    { href: '/admin/dashboard/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/dashboard/gallery', icon: Image, label: 'Gallery' },
    { href: '/admin/dashboard/reviews', icon: Star, label: 'Reviews' },
    { href: '/admin/dashboard/feedback', icon: MessageSquare, label: 'Feedback' },
  ];

  const superadminMenuItems = [
    { href: '/admin/dashboard/branches', icon: Building2, label: 'Branches' },
    { href: '/admin/dashboard/services', icon: Zap, label: 'Services' },
    { href: '/admin/dashboard/pricing', icon: ShoppingCart, label: 'Pricing' },
    { href: '/admin/dashboard/admins', icon: Users, label: 'Manage Admins' },
    { href: '/admin/dashboard/error-logs', icon: AlertTriangle, label: 'Error Logs' },
  ];

  const isSuperAdmin = userRole === 'superadmin';
  const allMenuItems = isSuperAdmin ? [...adminMenuItems, ...superadminMenuItems] : adminMenuItems;

  return (
    <motion.div 
      className="md:hidden fixed top-0 left-0 right-0 bg-background border-b border-border z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-bold">Menu</h2>
              </div>
              
              <div className="flex-1 space-y-2 p-4 overflow-y-auto">
                <div className="space-y-2">
                  {adminMenuItems.map((item) => (
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

                {isSuperAdmin && (
                  <>
                    <div className="h-px bg-border my-4" />
                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        System Admin
                      </p>
                    </div>
                    <div className="space-y-2">
                      {superadminMenuItems.map((item) => (
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
                  </>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-2">
                <Link
                  href="/admin/dashboard/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive('/admin/dashboard/settings')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    setLogoutOpen(true);
                    setIsMobileOpen(false);
                  }}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Logout</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <LogoutConfirmModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </motion.div>
  );
}
