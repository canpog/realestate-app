'use client';

import { useEffect, useRef } from 'react';

interface UseViewTrackerOptions {
    listingId: string;
    enabled?: boolean;
}

export function useViewTracker({ listingId, enabled = true }: UseViewTrackerOptions) {
    const startTime = useRef<number>(Date.now());
    const tracked = useRef<boolean>(false);

    useEffect(() => {
        if (!enabled || !listingId || tracked.current) return;

        // Get or create session ID
        let sessionId = sessionStorage.getItem('view_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('view_session_id', sessionId);
        }

        // Track view on mount
        const trackView = async () => {
            try {
                await fetch('/api/track/view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listing_id: listingId,
                        session_id: sessionId,
                    }),
                });
                tracked.current = true;
            } catch (error) {
                console.error('Failed to track view:', error);
            }
        };

        trackView();

        // Track duration on unmount
        return () => {
            if (!tracked.current) return;

            const duration = Math.floor((Date.now() - startTime.current) / 1000);

            // Use sendBeacon for reliable tracking on page leave
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    '/api/track/view',
                    JSON.stringify({
                        listing_id: listingId,
                        session_id: sessionId,
                        duration_seconds: duration,
                    })
                );
            }
        };
    }, [listingId, enabled]);
}
