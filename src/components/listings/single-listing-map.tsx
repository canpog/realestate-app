'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Navigation, ExternalLink, Share2, Check } from 'lucide-react';

interface Props {
    lat: number | null;
    lng: number | null;
    title?: string;
    address?: string;
}

export default function SingleListingMap({ lat, lng, title, address }: Props) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        if (!token || !lat || !lng || map.current) return;
        if (!mapContainer.current) return;

        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 15,
            interactive: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

        // Add marker
        const el = document.createElement('div');
        el.className = 'single-map-marker';
        el.innerHTML = `
            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            </div>
        `;

        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(map.current);

        map.current.on('load', () => {
            setLoading(false);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [token, lat, lng]);

    const handleShareLocation = async () => {
        if (!lat || !lng) return;

        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        const shareText = title
            ? `📍 ${title}\n${address || ''}\n\n${googleMapsUrl}`
            : `📍 Konum: ${googleMapsUrl}`;

        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Konum',
                    text: shareText,
                    url: googleMapsUrl
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall back to clipboard
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Clipboard write failed:', err);
        }
    };

    if (!token) {
        return (
            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                Mapbox token eksik
            </div>
        );
    }

    if (!lat || !lng) {
        return (
            <div className="w-full h-full bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center border border-dashed border-gray-200">
                <Navigation className="h-8 w-8 mb-2 text-gray-300" />
                <p className="font-medium">Konum bilgisi yok</p>
                <p className="text-xs mt-1">İlanı düzenleyerek konum ekleyebilirsiniz.</p>
            </div>
        );
    }

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    return (
        <div className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-100">
            {loading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <Navigation className="h-6 w-6 animate-spin text-blue-600" />
                </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />

            {/* Action buttons */}
            <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                <button
                    onClick={handleShareLocation}
                    className={`${copied ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'} backdrop-blur px-3 py-2 rounded-lg shadow-lg text-xs font-bold transition-all flex items-center`}
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 mr-1" />
                            Kopyalandı
                        </>
                    ) : (
                        <>
                            <Share2 className="h-3 w-3 mr-1" />
                            Konumu Gönder
                        </>
                    )}
                </button>
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg text-xs font-bold text-gray-700 hover:bg-white transition-all flex items-center"
                >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Maps
                </a>
            </div>
        </div>
    );
}
