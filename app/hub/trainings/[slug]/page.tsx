import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { HubConfig, HubSession } from '@/components/hub/hub-types';
import { resolveImageUrl, formatFee, formatDate } from '@/components/hub/hub-types';
import { HubPrograms } from '@/components/hub/hub-programs';

type Props = { params: Promise<{ slug: string }> };
type TrainingResponse = {
  success: boolean;
  config: HubConfig;
  session: HubSession;
  programs: any[];
};

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

async function getTraining(slug: string): Promise<TrainingResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/public/hub/trainings/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as TrainingResponse;
  } catch (e) {
    console.error('Error fetching training:', e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTraining(slug);
  if (!data?.session) return {};

  const session = data.session;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://www.spaceoutworkstation.com';
  const url = `${siteUrl}/hub/trainings/${session.slug || slug}`;
  const image = session.coverImage ? resolveImageUrl(session.coverImage) : `${siteUrl}/og-image.png`;

  return {
    metadataBase: new URL(siteUrl),
    title: `${session.title} • SpaceOut Hub`,
    description: session.description || undefined,
    openGraph: {
      title: `${session.title} — SpaceOut Hub`,
      description: session.description || undefined,
      url,
      images: [{ url: image, alt: session.title }],
    },
    alternates: { canonical: url },
  };
}

function badgeClass(status: string): string {
  if (status === 'ongoing') return 'bg-emerald-500/15 text-emerald-600';
  if (status === 'upcoming') return 'bg-primary/15 text-primary';
  return 'bg-muted text-muted-foreground';
}

function Fact({ label, value, Icon }: { label: string; value?: string; Icon: LucideIcon }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default async function HubTrainingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTraining(slug);
  if (!data?.session) notFound();

  const { session, config, programs } = data;
  const cover = resolveImageUrl(session.coverImage);
  const regHref = session.registrationUrl || config.defaultRegistrationUrl || '/contact';
  const statusLabel = STATUS_LABEL[session.status] || session.status;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative w-full">
          {cover ? (
            <div className="relative aspect-[21/9] w-full">
              <Image src={cover} alt={session.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            </div>
          ) : (
            <div className="flex aspect-[21/9] w-full items-center justify-center bg-muted/30">
              <span className="sr-only">Training image</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <div className="mx-auto w-full max-w-7xl">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                  session.status
                )}`}
              >
                {statusLabel}
              </span>
              <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                {session.title}
              </h1>
              {session.fee !== undefined && session.fee > 0 && (
                <p className="mt-3 text-2xl font-semibold text-primary">
                  {formatFee(session.fee, session.currency)}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {session.description && (
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {session.description}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Fact
                  label="Start date"
                  value={session.startDate ? formatDate(session.startDate) : undefined}
                  Icon={CalendarDays}
                />
                <Fact label="Duration" value={session.duration} Icon={Clock} />
                <Fact label="Time" value={session.time} Icon={Clock} />
                <Fact label="Location" value={session.location} Icon={MapPin} />
                <Fact label="Age range" value={session.ageRange} Icon={Users} />
                {session.capacity ? (
                  <Fact
                    label="Capacity"
                    value={`${session.enrolled || 30}/${session.capacity} seats`}
                    Icon={Users}
                  />
                ) : null}
              </div>

              {session.courses?.length ? (
                <div>
                  <h2 className="text-xl font-bold">What you'll learn</h2>
                  <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {session.courses.map((course) => (
                      <li key={course} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{course}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {session.whyJoin?.length ? (
                <div>
                  <h2 className="text-xl font-bold">Why join this training</h2>
                  <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                    {session.whyJoin.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {session.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {session.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-2xl font-bold">
                  {session.fee !== undefined ? formatFee(session.fee, session.currency) : 'Free'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Application fee:{' '}
                  {session.applicationFee ? formatFee(session.applicationFee, session.currency) : 'Free'}
                </p>
                <Link
                  href={regHref}
                  className="mt-4 block w-full rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Register now
                </Link>
                {(session.contactEmail || config.contactEmail) && (
                  <a
                    href={`mailto:${session.contactEmail || config.contactEmail}`}
                    className="mt-4 block text-center text-sm"
                  >
                    <Mail className="mr-1 inline h-4 w-4" /> Contact us
                  </a>
                )}
              </div>
            </aside>
          </div>

          {programs?.length ? (
            <div className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight">Other programs at SpaceOut Hub</h2>
              <HubPrograms config={config} programs={programs} />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
