'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Navigation2, Search, Building2, Zap, Wifi } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef } from 'react';
import dynamicFn from 'next/dynamic';

const MapComponent = dynamicFn(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-muted flex items-center justify-center rounded-lg">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

export default function Location() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const SPACEOUT_LAT = 8.481625633972758;
  const SPACEOUT_LNG = 4.617516067629041;

  const calculateDistance = (userLat: number, userLng: number) => {
    const R = 6371;
    const dLat = ((SPACEOUT_LAT - userLat) * Math.PI) / 180;
    const dLng = ((SPACEOUT_LNG - userLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((SPACEOUT_LAT * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const dist = calculateDistance(latitude, longitude);
          setDistance(dist);
          setSearchInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error: GeolocationPositionError) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleSearchLocation = (value: string) => {
    setSearchInput(value);
    
    if (value.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Comprehensive location suggestions for Ilorin and surrounding areas
    const mockSuggestions = [
      // Educational Institutions
      {
        name: 'University of Ilorin (Unilorin)',
        lat: 8.4830,
        lng: 4.6200,
        address: 'Unilorin Campus, Ilorin, Kwara State',
      },
      {
        name: 'Unilorin Sports Complex',
        lat: 8.4750,
        lng: 4.6150,
        address: 'Sports Complex, University of Ilorin',
      },
      {
        name: 'Kwara Polytechnic',
        lat: 8.5200,
        lng: 4.5600,
        address: 'Kwara Polytechnic, Ilorin, Nigeria',
      },
      // Main Areas & Districts
      {
        name: 'Tanke, Ilorin',
        lat: 8.4850,
        lng: 4.5600,
        address: 'Tanke Area, Ilorin, Kwara State',
      },
      {
        name: 'Sanrab',
        lat: 8.5050,
        lng: 4.6050,
        address: 'Sanrab Area, Ilorin, Kwara State',
      },
      {
        name: 'Ilorin, Kwara State',
        lat: 8.4904,
        lng: 4.5519,
        address: 'City Center, Ilorin, Nigeria',
      },
      {
        name: 'GRA, Ilorin',
        lat: 8.5050,
        lng: 4.5700,
        address: 'Government Reserved Area, Ilorin',
      },
      {
        name: 'Jangebe, Ilorin',
        lat: 8.4700,
        lng: 4.5400,
        address: 'Jangebe Area, Ilorin, Kwara State',
      },
      // Landmarks & Public Spaces
      {
        name: 'Sobi Hills',
        lat: 8.4650,
        lng: 4.6300,
        address: 'Sobi Hills, Ilorin, Nigeria',
      },
      {
        name: 'Ilorin Golf Club',
        lat: 8.5150,
        lng: 4.5800,
        address: 'Ilorin Golf Club, Kwara State',
      },
      {
        name: 'Stadium, Ilorin',
        lat: 8.5300,
        lng: 4.5650,
        address: 'Ilorin Stadium, Nigeria',
      },
      {
        name: 'Destiny Park',
        lat: 8.4950,
        lng: 4.5350,
        address: 'Destiny Park, Ilorin, Kwara State',
      },
      // Markets & Business Districts
      {
        name: 'Oja Oba Market',
        lat: 8.4950,
        lng: 4.5480,
        address: 'Oja Oba Market, Ilorin, Nigeria',
      },
      {
        name: 'Oja Tuntun Market',
        lat: 8.4900,
        lng: 4.5600,
        address: 'Oja Tuntun Market, Ilorin, Kwara State',
      },
      {
        name: 'Offa Garage, Ilorin',
        lat: 8.5150,
        lng: 4.5450,
        address: 'Offa Garage, Ilorin, Nigeria',
      },
      {
        name: 'Maraba, Ilorin',
        lat: 8.4750,
        lng: 4.5350,
        address: 'Maraba Market Area, Ilorin',
      },
      // Transport Hubs
      {
        name: 'Gidi Bustop',
        lat: 8.4932,
        lng: 4.5570,
        address: 'Gidi Bus Stop, Ilorin, Nigeria',
      },
      {
        name: 'Adewale Bustop',
        lat: 8.5100,
        lng: 4.5400,
        address: 'Adewale Bus Stop, Ilorin, Kwara State',
      },
      // Residential Areas
      {
        name: 'Oke-Odo',
        lat: 8.4800,
        lng: 4.6100,
        address: 'Oke-Odo Area, Ilorin, Nigeria',
      },
      {
        name: 'Ogbonnia',
        lat: 8.4950,
        lng: 4.6250,
        address: 'Ogbonnia Area, Ilorin, Kwara State',
      },
      {
        name: 'Adéwálé',
        lat: 8.5100,
        lng: 4.5400,
        address: 'Adéwálé Area, Ilorin, Nigeria',
      },
      // Government & Institutional
      {
        name: 'Kwara State Secretariat',
        lat: 8.4980,
        lng: 4.5550,
        address: 'State Secretariat Complex, Ilorin',
      },
      {
        name: 'KWARA Hotel',
        lat: 8.5000,
        lng: 4.5450,
        address: 'KWARA Hotel, Ilorin, Nigeria',
      },
      {
        name: 'Federal Teaching Hospital (FETHI)',
        lat: 8.5250,
        lng: 4.5700,
        address: 'Federal Teaching Hospital, Ilorin',
      },
    ];

    const trimmedValue = value.toLowerCase().trim();
    const filtered = mockSuggestions.filter((item) =>
      item.name.toLowerCase().includes(trimmedValue) ||
      item.address.toLowerCase().includes(trimmedValue)
    );

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSelectLocation = (location: any) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    const dist = calculateDistance(location.lat, location.lng);
    setDistance(dist);
    setSearchInput(location.name);
    setShowSuggestions(false);
  };

  const getDirectionsUrl = () => {
    if (!userLocation) return '#';
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${SPACEOUT_LAT},${SPACEOUT_LNG}`;
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            // @ts-ignore
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Visit Us</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Find us in the heart of Tanke, Ilorin - Interactive map included
            </p>
          </motion.div>
        </div>
      </section>

      {/* Location Info */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            // @ts-ignore
            className="grid md:grid-cols-2 gap-8 items-start"
          >
            {/* Left Column - Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-4">SpaceOut - Tanke Branch</h2>
                  <p className="text-muted-foreground text-lg">
                    Our flagship location in Tanke offers premium workspace solutions with easy access and 
                    excellent connectivity for professionals in Ilorin.
                  </p>
                </div>

                <Card className="p-6 space-y-4 border-border backdrop-blur-sm bg-muted/20 hover:bg-muted/40 transition-all duration-300">
                  <div className="flex gap-4">
                    <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-muted-foreground">Tanke, Ilorin, Nigeria</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {SPACEOUT_LAT}, Lng: {SPACEOUT_LNG}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Hours</h3>
                      <p className="text-muted-foreground">Mon-Fri: 6:00 AM - 10:00 PM</p>
                      <p className="text-muted-foreground">Sat-Sun: 8:00 AM - 8:00 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Contact</h3>
                      <p className="text-muted-foreground">+234 (0) 00 0000 0000</p>
                      <p className="text-muted-foreground">hello@spaceout.com</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 space-y-4 border-primary/30 bg-primary/5 backdrop-blur-sm overflow-visible">
                  <div className="flex items-center gap-2 mb-4">
                    <Navigation2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Find Distance & Directions</h3>
                  </div>

                  {/* Search Location Input */}
                  <div className="relative w-full" ref={searchRef}>
                    <div className="relative flex items-center w-full">
                      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchLocation(e.target.value)}
                        placeholder="Search location or enter coordinates..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background hover:border-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      />
                    </div>

                    {/* Location Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-background border border-input/50 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
                      >
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectLocation(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-primary/10 focus:bg-primary/10 transition-colors border-b last:border-b-0 border-border/30 flex items-start gap-3 focus:outline-none"
                          >
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-medium text-sm text-foreground">{suggestion.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.address}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* Show message when no results found */}
                    {showSuggestions && suggestions.length === 0 && searchInput.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-background border border-input/50 rounded-lg shadow-xl z-50 p-4 text-center"
                      >
                        <p className="text-sm text-muted-foreground">
                          No locations found for "{searchInput}"
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGetUserLocation}
                      variant="outline"
                      className="flex-1 flex items-center gap-2 hover:border-primary hover:text-primary transition-all duration-300"
                    >
                      <Navigation2 className="w-4 h-4" />
                      Use Current Location
                    </Button>
                  </div>

                  {/* Distance and Directions Display */}
                  {userLocation && distance && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      // @ts-ignore
                      className="space-y-4 pt-4 border-t border-border"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">Your Location</p>
                        <p className="font-semibold text-sm">
                          {searchInput || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 rounded-lg border border-primary/30">
                        <p className="text-sm text-muted-foreground mb-1">Distance to SpaceOut</p>
                        <p className="text-3xl font-bold text-primary">{distance} km</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Approximately {Math.round(parseFloat(distance) * 1.3)} minutes by car
                        </p>
                      </div>

                      <div className="space-y-2">
                        <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full flex items-center gap-2 hover:border-primary hover:text-primary transition-all duration-300">
                            <Navigation2 className="w-4 h-4" />
                            Get Directions
                          </Button>
                        </a>
                        <a href="https://www.google.com/maps/search/?api=1&query=bus+stations+near+tanke+ilorin" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full flex items-center gap-2 hover:border-primary hover:text-primary transition-all duration-300">
                            <Building2 className="w-4 h-4" />
                            Find Nearby Bus Stops
                          </Button>
                        </a>
                      </div>
                    </motion.div>
                  )}

                  {!userLocation && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Enter your location above or use your current location to see distance and directions
                    </p>
                  )}
                </Card>

                <div className="flex gap-4">
                  <Link href="/contact" className="flex-1">
                    <Button variant="outline" className="w-full hover:border-primary hover:text-primary transition-all duration-300">
                      Contact Us
                    </Button>
                  </Link>
                  <Link href="/contact" className="flex-1">
                    <Button className="w-full hover:shadow-lg transition-all duration-300">
                      Book a Tour
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Interactive Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden border-border backdrop-blur-sm bg-background/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                <MapComponent
                  spaceoutLat={SPACEOUT_LAT}
                  spaceoutLng={SPACEOUT_LNG}
                  userLat={userLocation?.lat}
                  userLng={userLocation?.lng}
                />
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Amenities & Features */}
      <section className="py-20 bg-card border-t border-border backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            // @ts-ignore
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What to Expect</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for a productive work experience
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            // @ts-ignore
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'Stable Power Supply',
                description: '24/7 consistent electricity for uninterrupted work',
                icon: <Zap className="w-8 h-8 text-primary group-hover:scale-125 transition-transform duration-300" />,
              },
              {
                title: 'High-Speed WiFi',
                description: 'Reliable internet connectivity throughout the facility',
                icon: <Wifi className="w-8 h-8 text-primary group-hover:scale-125 transition-transform duration-300" />,
              },
              {
                title: 'Parking Available',
                description: 'Convenient parking for all members and visitors',
                icon: <Building2 className="w-8 h-8 text-primary group-hover:scale-125 transition-transform duration-300" />,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 text-center h-full backdrop-blur-sm bg-background/40 hover:bg-background/60 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group cursor-pointer">
                  <div className="mb-4 flex justify-center">{item.icon}</div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Experience SpaceOut?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Visit us today or book a tour to see our facilities in person
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="hover:shadow-lg transition-all duration-300">Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
