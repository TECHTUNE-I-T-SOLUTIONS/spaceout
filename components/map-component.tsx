'use client';

import { useEffect, useRef } from 'react';

interface MapComponentProps {
  spaceoutLat: number;
  spaceoutLng: number;
  userLat?: number;
  userLng?: number;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function MapComponent({
  spaceoutLat,
  spaceoutLng,
  userLat,
  userLng,
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markerGroup = useRef<any>(null);

  useEffect(() => {
    const loadMap = async () => {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        if (mapContainer.current && !map.current) {
          map.current = window.L.map(mapContainer.current).setView(
            [spaceoutLat, spaceoutLng],
            14
          );

          window.L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution:
                '© OpenStreetMap contributors',
              maxZoom: 19,
            }
          ).addTo(map.current);

          markerGroup.current = window.L.featureGroup().addTo(map.current);

          // Company SVG Icon
          const companyIconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#3b82f6">
              <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z"/>
              <circle cx="12" cy="4" r="2" fill="white"/>
            </svg>
          `;

          // Add SpaceOut marker with custom icon
          const spaceoutMarker = window.L.marker([spaceoutLat, spaceoutLng], {
            icon: window.L.icon({
              iconUrl: `data:image/svg+xml;base64,${btoa(companyIconSvg)}`,
              iconSize: [48, 48],
              iconAnchor: [24, 48],
              popupAnchor: [0, -48],
              className: 'spaceout-marker',
            }),
          })
            .bindPopup(`
              <div style="font-family: system-ui; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">SpaceOut Workspace</h4>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">Tanke, Ilorin, Nigeria</p>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">📍 8.4816°N, 4.6175°E</p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">Mon-Fri: 6:00 AM - 10:00 PM<br>Sat: 9:00 AM - 3:00 PM<br>Sun: Closed</p>
              </div>
            `, {
              maxWidth: 300,
            })
            .addTo(markerGroup.current);

          // Add a circle around SpaceOut to show service area
          window.L.circle([spaceoutLat, spaceoutLng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            radius: 500, // 500 meters
            weight: 2,
            dashArray: '5, 5',
          }).addTo(map.current);

          // Add user marker if available
          if (userLat && userLng) {
            const userIconSvg = `
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#10b981">
                <circle cx="12" cy="12" r="8" fill="white" stroke="#10b981" stroke-width="2"/>
                <circle cx="12" cy="12" r="4" fill="#10b981"/>
              </svg>
            `;

            const userMarker = window.L.marker([userLat, userLng], {
              icon: window.L.icon({
                iconUrl: `data:image/svg+xml;base64,${btoa(userIconSvg)}`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18],
              }),
            })
              .bindPopup(`
                <div style="font-family: system-ui; min-width: 180px;">
                  <h4 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">Your Location</h4>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E</p>
                </div>
              `, {
                maxWidth: 250,
              })
              .addTo(markerGroup.current);

            // Draw a line between user and SpaceOut
            const line = window.L.polyline(
              [[userLat, userLng], [spaceoutLat, spaceoutLng]],
              {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 4',
                lineCap: 'round',
                lineJoin: 'round',
              }
            ).addTo(markerGroup.current);

            // Add distance display on the line
            const midLat = (userLat + spaceoutLat) / 2;
            const midLng = (userLng + spaceoutLng) / 2;
            
            // Fit bounds to both markers
            map.current.fitBounds(markerGroup.current.getBounds(), {
              padding: [50, 50],
              maxZoom: 16,
            });
          } else {
            // Center on SpaceOut only
            map.current.setView([spaceoutLat, spaceoutLng], 14);
            spaceoutMarker.openPopup();
          }
        }
      };
      document.head.appendChild(script);
    };

    loadMap();
  }, [spaceoutLat, spaceoutLng, userLat, userLng]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '0.5rem',
      }}
    />
  );
}
