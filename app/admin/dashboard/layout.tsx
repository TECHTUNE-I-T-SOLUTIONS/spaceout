import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminMobileHeader } from '@/components/admin-mobile-header';
import { SessionProvider } from '@/components/session-provider';
import { requireAdmin } from '@/lib/auth-middleware';
import AdminChatWidget from '@/components/admin-chat-widget';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const userRole = (session.user as any)?.role || 'admin';

  return (
    <SessionProvider>
      <AdminMobileHeader userRole={userRole} />
      <AdminSidebar userRole={userRole} />
      <main className="min-h-screen md:ml-64 bg-background overflow-auto">
        <div className="p-4 md:p-8 pt-[80px] md:pt-8">
          {children}
        </div>
      </main>
      <AdminChatWidget />
    </SessionProvider>
  );
}
