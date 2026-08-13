import type { Metadata } from 'next';
import HubPage from '@/components/hub/hub-page';

export const metadata: Metadata = {
  title: 'SpaceOut Tech - Tech Trainings & Bootcamps',
  description:
    'SpaceOut Tech is the learning arm of SpaceOut offering practical tech trainings in programming, design, social media marketing, AI, computer literacy, photography and more.',
};

export default function Hub() {
  return <HubPage />;
}
