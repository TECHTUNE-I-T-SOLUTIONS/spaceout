import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import { PushNotificationPrompt } from '@/components/push-notification-prompt'
import ChatWidget from '@/components/chat-widget'
import { ClientOnlyWrapper } from '@/components/client-only-wrapper'
import { SpaceParticles } from '@/components/space-particles'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import MaintenanceBanner from '@/components/maintenance-banner'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'SpaceOut - Premium Workspace Solutions',
  description: 'Cool spaces for professionals. Premium coworking, meeting rooms, and office solutions in Tanke, Ilorin. Stable power, professional lighting, quiet environments.',
  keywords: 'coworking, workspace, office, meeting room, Ilorin, Tanke',
  authors: [{ name: 'SpaceOut' }],
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'SpaceOut - Premium Workspace Solutions',
    description: 'Cool spaces for professionals',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <ClientOnlyWrapper>
            <SpaceParticles />
            <MobileBottomNav />
          </ClientOnlyWrapper>
          <div className="relative z-20 with-maintenance">
            <ClientOnlyWrapper>
              <MaintenanceBanner />
            </ClientOnlyWrapper>
            {children}
            <ChatWidget />
            <ClientOnlyWrapper>
              <CookieConsentBanner />
              <PushNotificationPrompt />
            </ClientOnlyWrapper>
            <Analytics />
          </div>
        </Providers>
      </body>
    </html>
  )
}
