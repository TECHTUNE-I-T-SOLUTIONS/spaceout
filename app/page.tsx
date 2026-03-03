import { Header } from '@/components/header';
import { HomeContent } from './home-content';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HomeContent />
    </main>
  );
}
