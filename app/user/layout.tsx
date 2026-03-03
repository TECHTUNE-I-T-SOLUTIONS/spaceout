import { SessionProvider } from '@/components/session-provider';
import { SidebarProvider } from '@/lib/sidebar-context';
import { UserLayoutWrapper } from '@/components/user-layout-wrapper';
import { requireUser } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <SessionProvider>
      <SidebarProvider>
        <UserLayoutWrapper>{children}</UserLayoutWrapper>
      </SidebarProvider>
    </SessionProvider>
  );
}
