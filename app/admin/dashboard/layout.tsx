import { AdminSidebarProvider } from '@/lib/admin-sidebar-context';
import { AdminLayoutWrapper } from '@/components/admin-layout-wrapper';
import { SessionProvider } from '@/components/session-provider';
import { requireAdmin } from '@/lib/auth-middleware';

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
      <AdminSidebarProvider>
        <AdminLayoutWrapper userRole={userRole}>
          {children}
        </AdminLayoutWrapper>
      </AdminSidebarProvider>
    </SessionProvider>
  );
}
