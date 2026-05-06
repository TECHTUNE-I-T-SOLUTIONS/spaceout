"use client";

import { useEffect, useState, useRef } from 'react';

export default function MaintenanceBanner() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // set CSS variable to allow layout to add padding when banner is visible
    const setVar = () => {
      const el = bannerRef.current;
      const height = el ? Math.ceil(el.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--maintenance-banner-height', `${height}px`);
    };

    setVar();
    window.addEventListener('resize', setVar);
    return () => {
      window.removeEventListener('resize', setVar);
      document.documentElement.style.setProperty('--maintenance-banner-height', '0px');
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/site-config')
      .then(res => res.json())
      .then(json => {
        if (!mounted) return;
        const cfg = json?.config;
        if (cfg?.maintenanceMode) {
          setEnabled(true);
          setMessage(cfg.maintenanceMessage || 'Platform is undergoing maintenance and updates. Operations continue but you may experience some discomfort.' );
        }
      })
      .catch(() => {});
    return () => { mounted = false };
  }, []);

  if (!enabled) return null;

  return (
    <div ref={bannerRef} className="fixed inset-x-0 top-0 z-[80] pointer-events-auto">
      <div className="w-full bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs py-1 text-center">
        <div className="max-w-5xl mx-auto px-3">{message}</div>
      </div>
    </div>
  );
}
