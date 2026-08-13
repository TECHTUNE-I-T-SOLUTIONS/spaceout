'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu } from 'lucide-react';
import { ThemeSwitcher } from './theme-switcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isHubActive = pathname === '/hub' || pathname?.startsWith('/hub');
  const isServicesActive = pathname === '/services' || pathname?.startsWith('/services');
  const isPricingActive = pathname === '/pricing';

  const exploreItems = [
    { label: 'Events', href: '/events' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reviews', href: '/reviews' },
  ];

  return (
    <header className="sticky header-with-maintenance z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-4 max-w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-32 h-8">
            <Image
              src="/logo-light.png"
              alt="SpaceOut"
              fill
              className="object-contain dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="SpaceOut"
              fill
              className="object-contain hidden dark:block"
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/services"
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              isServicesActive
                ? 'text-primary'
                : 'text-foreground hover:text-primary'
            }`}
          >
            Services
          </Link>
          <Link
            href="/pricing"
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              isPricingActive
                ? 'text-primary'
                : 'text-foreground hover:text-primary'
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/hub"
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              isHubActive
                ? 'text-primary'
                : 'text-foreground hover:text-primary'
            }`}
          >
            Tech
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-primary transition-colors">
                Explore
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Explore SpaceOut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {exploreItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />

          <div className="flex gap-2">
            <div className="hidden md:flex gap-2">
              {session ? (
                <Link
                  href="/user/check-in"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Check In
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
            
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-border bg-background">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild><Link href="/">Home</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/services">Services</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/pricing">Pricing</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/hub">Tech</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Explore</DropdownMenuLabel>
                  {exploreItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {session ? (
                    <DropdownMenuItem asChild>
                      <Link href="/user/check-in" className="text-primary font-medium">Check In</Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/login">Log in</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/register" className="text-primary font-medium">Sign up</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
