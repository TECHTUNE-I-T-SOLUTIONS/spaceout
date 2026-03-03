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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogoutConfirmModal } from '@/components/logout-confirm-modal';

interface AdminSidebarProps {
  userRole: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  // Admin menu items (all roles)
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
          {!isDesktopCollapsed && <h2 className="text-lg font-bold">Admin Panel</h2>}
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

        {/* Superadmin Section */}
        {isSuperAdmin && (
          <>
            {(!isDesktopCollapsed || isMobile) && (
              <div className="h-px bg-border my-4" />
            )}
            {(!isDesktopCollapsed || isMobile) && (
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
          } ${isDesktopCollapsed && !isMobile ? 'justify-center' : ''}`}
          title={isDesktopCollapsed && !isMobile ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {(!isDesktopCollapsed || isMobile) && (
            <span className="text-sm font-medium">Settings</span>
          )}
        </Link>

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

      {/* Role Badge - Desktop only */}
      {!isMobile && (!isDesktopCollapsed || isMobile) && (
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
