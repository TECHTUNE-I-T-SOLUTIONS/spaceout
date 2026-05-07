"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CheckInRecord {
  _id: string;
  serviceId: string;
  serviceName: string;
  planName: string;
  durationInHours?: number;
  durationInDays?: number;
  checkedInAt: string;
  status: string;
}

export default function CheckinDurationMonitor() {
  const [warning, setWarning] = useState<CheckInRecord | null>(null);
  const [expired, setExpired] = useState<CheckInRecord | null>(null);
  const shownWarnings = useRef<Set<string>>(new Set());
  const shownExpired = useRef<Set<string>>(new Set());

  // Warning threshold in ms (5 minutes)
  const WARNING_THRESHOLD = 5 * 60 * 1000;

  useEffect(() => {
    let mounted = true;

    const checkLoop = async () => {
      try {
        const res = await fetch('/api/checkin/history?status=checked_in&limit=100');
        if (!res.ok) return;
        const data = await res.json();
        const now = new Date();

        (data.checkIns || []).forEach((ci: CheckInRecord) => {
          // Skip if already handled
          if (shownExpired.current.has(ci._id) || shownWarnings.current.has(ci._id)) return;

          const start = new Date(ci.checkedInAt);
          let end: Date | null = null;

          if (ci.durationInHours && ci.durationInHours > 0) {
            end = new Date(start.getTime() + ci.durationInHours * 60 * 60 * 1000);
          } else if (ci.durationInDays && ci.durationInDays > 0) {
            // For day-based plans, consider work end at 18:00 server-local time on the checked-in day
            end = new Date(start);
            end.setHours(18, 0, 0, 0);
            // If checked in after 18:00, set end to start + (9 hours) as fallback
            if (end.getTime() <= start.getTime()) {
              end = new Date(start.getTime() + 9 * 60 * 60 * 1000);
            }
          } else {
            // Default to 1 hour if nothing specified
            end = new Date(start.getTime() + 1 * 60 * 60 * 1000);
          }

          if (!end) return;

          const timeLeft = end.getTime() - now.getTime();

          if (timeLeft <= 0) {
            // expired
            if (!shownExpired.current.has(ci._id)) {
              shownExpired.current.add(ci._id);
              if (mounted) setExpired(ci);
            }
          } else if (timeLeft <= WARNING_THRESHOLD) {
            // warning
            if (!shownWarnings.current.has(ci._id)) {
              shownWarnings.current.add(ci._id);
              if (mounted) setWarning(ci);
            }
          }
        });
      } catch (err) {
        console.error('Duration monitor error:', err);
      }
    };

    // Initial check and interval
    checkLoop();
    const id = setInterval(checkLoop, 30 * 1000); // every 30s

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      {/* Warning Modal */}
      <Dialog open={!!warning} onOpenChange={(open) => { if (!open) setWarning(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in near expiry</DialogTitle>
            <DialogDescription>
              {warning && (
                <div>
                  You're almost out of time for <strong>{warning.serviceName}</strong> — {warning.planName}. Your session will expire soon.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button onClick={() => setWarning(null)}>Dismiss</Button>
            <Button onClick={() => { setWarning(null); toast('Consider topping up or checking in again'); }}>Extend / Check In Again</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expired Modal */}
      <Dialog open={!!expired} onOpenChange={(open) => { if (!open) setExpired(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in expired</DialogTitle>
            <DialogDescription>
              {expired && (
                <div>
                  Your session for <strong>{expired.serviceName}</strong> — {expired.planName} has expired.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button onClick={() => setExpired(null)}>Dismiss</Button>
            <Button onClick={() => { setExpired(null); toast('To continue, please check in again or purchase a new plan.'); }}>Check In Again</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
