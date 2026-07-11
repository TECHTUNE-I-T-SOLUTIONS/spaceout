import { Calendar, Newspaper, Megaphone } from 'lucide-react';

export default function EventsHero() {
  return (
    <div className="bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Events & News
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Stay updated with the latest events, news, and announcements from SpaceOut. 
            Discover what's happening and never miss an update.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Upcoming Events</span>
            </div>
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <span>Latest News</span>
            </div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <span>Announcements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}