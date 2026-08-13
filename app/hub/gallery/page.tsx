import type { Metadata } from 'next';
import HubGalleryPage from '@/components/hub/hub-gallery-page';

export const metadata: Metadata = {
  title: 'SpaceOut Tech Gallery & Reviews',
  description:
    'Explore photos and moments from SpaceOut Tech trainings, plus stories and testimonials from our learners.',
};

export default function HubGallery() {
  return <HubGalleryPage />;
}
