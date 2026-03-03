import { UserSidebar } from '@/components/user-sidebar';
import { SessionProvider } from '@/components/session-provider';
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
      <UserSidebar />
      <main className="min-h-screen md:ml-64 bg-background overflow-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </SessionProvider>
  );
}
