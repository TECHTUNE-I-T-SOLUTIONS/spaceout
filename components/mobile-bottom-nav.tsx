'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Briefcase, DollarSign, LayoutDashboard } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Only show on public pages, not on admin/user dashboard pages
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/user');
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAdminPage || isAuthPage) {
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      name: 'Services',
      href: '/services',
      icon: Briefcase,
      isActive: pathname === '/services',
    },
    {
      name: 'Pricing',
      href: '/pricing',
      icon: DollarSign,
      isActive: pathname === '/pricing',
    },
    {
      name: 'Dashboard',
      href: '/user/dashboard',
      icon: LayoutDashboard,
      isActive: pathname?.startsWith('/user/dashboard'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                item.isActive
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={item.name}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
