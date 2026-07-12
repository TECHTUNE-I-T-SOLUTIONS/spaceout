'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShoppingCart,
  Calendar,
  Cake,
  Image,
  Star,
  MessageSquare,
  AlertTriangle,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  ChevronLeft,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogoutConfirmModal } from '@/components/logout-confirm-modal';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAdminSidebar } from '@/lib/admin-sidebar-context';

interface AdminSidebarProps {
  userRole: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, toggle } = useAdminSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  // Admin menu items (all roles)
  const adminMenuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/dashboard/users', icon: Users, label: 'Users' },
    { href: '/admin/dashboard/birthdays', icon: Cake, label: 'Birthdays' },
    { href: '/admin/dashboard/payments', icon: ShoppingCart, label: 'Payments' },
    { href: '/admin/dashboard/membership-cards', icon: Users, label: 'Membership Cards' },
    { href: '/admin/dashboard/checkins', icon: LogIn, label: 'Check-Ins' },
    { href: '/admin/dashboard/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/admin/dashboard/gallery', icon: Image, label: 'Gallery' },
    { href: '/admin/dashboard/reviews', icon: Star, label: 'Reviews' },
    { href: '/admin/dashboard/feedback', icon: MessageSquare, label: 'Feedback' },
    { href: '/admin/dashboard/questionnaires', icon: MessageSquare, label: 'Questionnaires' },
    { href: '/admin/dashboard/contacts', icon: AlertTriangle, label: 'Contacts' },
  ];

  // Superadmin-only menu items
  const superadminMenuItems = [
    { href: '/admin/dashboard/branches', icon: Building2, label: 'Branches' },
    { href: '/admin/dashboard/services', icon: Zap, label: 'Services' },
    { href: '/admin/dashboard/pricing', icon: ShoppingCart, label: 'Pricing' },
    { href: '/admin/dashboard/admins', icon: Users, label: 'Manage Admins' },
    { href: '/admin/dashboard/error-logs', icon: AlertTriangle, label: 'Error Logs' },
  ];

  const isSuperAdmin = userRole === 'superadmin';
  const allMenuItems = isSuperAdmin ? [...adminMenuItems, ...superadminMenuItems] : adminMenuItems;

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header with collapse toggle - Desktop only */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && <h2 className="text-lg font-bold">Admin Panel</h2>}
          <Button
            size="icon"
            variant="ghost"
            onClick={toggle}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-2 p-4 overflow-y-auto">
        {/* Main Admin Section */}
        <div className="space-y-2">
          {adminMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Superadmin Section */}
        {isSuperAdmin && (
          <>
            {(!isCollapsed || isMobile) && (
              <div className="h-px bg-border my-4" />
            )}
            {(!isCollapsed || isMobile) && (
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  System Admin
                </p>
              </div>
            )}
            <div className="space-y-2">
              {superadminMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
                  title={isCollapsed && !isMobile ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/admin/dashboard/settings"
          onClick={() => isMobile && setIsMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isActive('/admin/dashboard/settings')
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
          title={isCollapsed && !isMobile ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium">Settings</span>
          )}
        </Link>

        <div className={`flex ${isCollapsed && !isMobile ? 'flex-col items-center' : 'items-center justify-between'} gap-2`}>
          <Button
            onClick={() => setLogoutOpen(true)}
            variant="ghost"
            className={`${isCollapsed && !isMobile ? 'w-full px-0' : 'flex-1 justify-start'} text-foreground hover:bg-muted`}
            title={isCollapsed && !isMobile ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 mr-3" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm font-medium">Sign Out</span>
            )}
          </Button>
          <ThemeSwitcher />
        </div>
      </div>

      {/* Role Badge - Desktop only */}
      {!isMobile && (!isCollapsed || isMobile) && (
        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 bg-muted rounded-lg text-xs font-semibold text-center">
            {isSuperAdmin ? 'SUPERADMIN' : 'ADMIN'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="h-screen border-r border-border bg-background z-40 flex flex-col">
        <motion.div
          initial={{ x: -250 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <SidebarContent isMobile={false} />
        </motion.div>
      </div>

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
