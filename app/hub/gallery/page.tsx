import type { Metadata } from 'next';
import HubGalleryPage from '@/components/hub/hub-gallery-page';

export const metadata: Metadata = {
  title: 'SpaceOut Hub Gallery & Reviews',
  description:
    'Explore photos and moments from SpaceOut Hub trainings, plus stories and testimonials from our learners.',
};

export default function HubGallery() {
  return <HubGalleryPage />;
}
