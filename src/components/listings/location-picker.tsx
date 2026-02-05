'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation } from 'lucide-react';

interface Props {
    lat?: number;
    lng?: number;
    onChange: (coords: { lat: number; lng: number }) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
        lat && lng ? { lat, lng } : null
    );

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Get user location on mount
    useEffect(() => {
        if (navigator.geolocation && !currentCoords) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentCoords(coords);
                    setLoading(false);
                },
                () => {
                    // Default to Marmaris
                    setCurrentCoords({ lat: 36.85, lng: 28.27 });
                    setLoading(false);
                },
                { timeout: 5000 }
            );
        } else {
            setLoading(false);
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!token || !mapContainer.current || loading) return;
        if (map.current) return;

        const center = currentCoords || { lat: 36.85, lng: 28.27 };

        try {
            mapboxgl.accessToken = token;

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [center.lng, center.lat],
                zoom: 14
            });

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Add geolocate control
            const geolocate = new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: false,
                showUserLocation: true
            });
            map.current.addControl(geolocate, 'top-right');

            // Add marker
            marker.current = new mapboxgl.Marker({
                color: '#2563eb',
                draggable: true
            })
                .setLngLat([center.lng, center.lat])
                .addTo(map.current);

            // Update on marker drag
            marker.current.on('dragend', () => {
                const lngLat = marker.current!.getLngLat();
                const newCoords = { lat: lngLat.lat, lng: lngLat.lng };
                setCurrentCoords(newCoords);
                onChange(newCoords);
            });

            // Update on map click
            map.current.on('click', (e) => {
                const newCoords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                marker.current?.setLngLat([newCoords.lng, newCoords.lat]);
                setCurrentCoords(newCoords);
                onChange(newCoords);
            });

            // If we have initial coords, trigger onChange
            if (lat && lng) {
                onChange({ lat, lng });
            }

        } catch (err) {
            console.error('Map init error:', err);
        }
    }, [token, loading, currentCoords]);

    // Update marker position if coords change externally
    useEffect(() => {
        if (lat && lng && marker.current) {
            marker.current.setLngLat([lng, lat]);
            map.current?.flyTo({ center: [lng, lat], zoom: 14 });
        }
    }, [lat, lng]);

    if (!token) {
        return (
            <div className="h-64 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Harita yapılandırması eksik (MAPBOX_TOKEN)
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-64 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                <Navigation className="h-5 w-5 mr-2 animate-pulse" />
                Konum alınıyor...
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="h-64 rounded-xl overflow-hidden border border-gray-200 relative">
                <div ref={mapContainer} className="w-full h-full" />

                {/* Instruction overlay */}
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-600 shadow-sm">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Haritaya tıklayarak veya pin'i sürükleyerek konum seçin
                </div>
            </div>

            {currentCoords && (
                <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <span>
                        <strong>Koordinatlar:</strong> {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                    </span>
                    <span className="text-green-600 font-medium">✓ Konum seçildi</span>
                </div>
            )}
        </div>
    );
}
