'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeSwitcher } from './theme-switcher';

export function Header() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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

        <nav className="hidden gap-8 md:flex">
          <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">
            Services
          </Link>
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors">
            Events
          </Link>
          <Link href="/gallery" className="text-sm font-medium hover:text-primary transition-colors">
            Gallery
          </Link>
          <Link href="/reviews" className="text-sm font-medium hover:text-primary transition-colors">
            Reviews
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />

          <div className="flex gap-2">
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
        </div>
      </div>
    </header>
  );
}
