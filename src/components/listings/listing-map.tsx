'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Listing } from '@/types/listing';
import { X, MapPin, Home, Square, ExternalLink, ChevronLeft, AlertTriangle, Navigation, Filter } from 'lucide-react';
import Link from 'next/link';

interface Props {
    listings: Listing[];
    initialFilters?: {
        type?: string;
        status?: string;
    };
}

export default function ListingMap({ listings, initialFilters }: Props) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({}); // Store markers by ID

    const [error, setError] = useState<string | null>(null);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // Filters
    const [typeFilter, setTypeFilter] = useState(initialFilters?.type || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters?.status || '');
    const [showFilters, setShowFilters] = useState(true);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Filter listings
    const filteredListings = listings.filter(l => {
        if (typeFilter && l.type !== typeFilter) return false;
        if (statusFilter && l.status !== statusFilter) return false;
        return true;
    });

    const listingsWithCoords = filteredListings.filter(l => l.lat && l.lng);
    const listingsWithoutCoords = filteredListings.filter(l => !l.lat || !l.lng);

    // Get user location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                },
                (err) => {
                    console.log('Geolocation error:', err);
                    setUserLocation([28.27, 36.85]); // Marmaris
                }
            );
        } else {
            setUserLocation([28.27, 36.85]); // Marmaris
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!token) return;
        if (map.current || !mapContainer.current) return;
        if (!userLocation) return;

        try {
            mapboxgl.accessToken = token;

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: userLocation,
                zoom: 12
            });

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

            const geolocate = new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: false,
                showUserLocation: true
            });
            map.current.addControl(geolocate, 'top-left');

            map.current.on('load', () => {
                if (!map.current) return;

                // Add Source with Clustering
                map.current.addSource('listings', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    },
                    cluster: true,
                    clusterMaxZoom: 14, // Max zoom to cluster points
                    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
                });

                // Add Cluster Layers
                map.current.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'listings',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6', // Blue for < 5
                            5,
                            '#f1f075', // Yellow for < 10
                            10,
                            '#f28cb1'  // Pink for >= 10
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20, // Radius 20px
                            5,
                            30, // Radius 30px
                            10,
                            40  // Radius 40px
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#fff'
                    }
                });

                map.current.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'listings',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                // Inspect a cluster on click
                map.current.on('click', 'clusters', (e) => {
                    const features = map.current?.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });
                    const clusterId = features?.[0].properties?.cluster_id;
                    if (!map.current) return;

                    (map.current.getSource('listings') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
                        clusterId,
                        (err, zoom) => {
                            if (err) return;
                            map.current?.easeTo({
                                center: (features?.[0].geometry as any).coordinates,
                                zoom: zoom
                            });
                        }
                    );
                });

                map.current.on('mouseenter', 'clusters', () => {
                    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
                });
                map.current.on('mouseleave', 'clusters', () => {
                    if (map.current) map.current.getCanvas().style.cursor = '';
                });

                // Unclustered Point Handling (Hybrid)
                // Use a render event to update custom markers for unclustered points
                map.current.on('render', () => {
                    if (!map.current || !map.current.getSource('listings')) return;
                    updateMarkers();
                });
            });

        } catch (err: any) {
            console.error("Map initialization failed:", err);
            setError(err.message);
        }
    }, [token, userLocation]);

    // Update GeoJSON data when filters change
    useEffect(() => {
        if (!map.current || !map.current.getSource('listings')) return;

        const features: any[] = listingsWithCoords.map(l => ({
            type: 'Feature',
            properties: {
                id: l.id,
                price: l.price,
                currency: l.currency,
                title: l.title
            },
            geometry: {
                type: 'Point',
                coordinates: [l.lng, l.lat]
            }
        }));

        (map.current.getSource('listings') as mapboxgl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: features
        });

    }, [listingsWithCoords]); // Re-run when filtered listings change

    // Custom Marker Update Logic
    const updateMarkers = () => {
        if (!map.current) return;
        const newMarkers: { [key: string]: mapboxgl.Marker } = {};

        // Query unclustered features that are currently visible
        const features = map.current.querySourceFeatures('listings', {
            filter: ['!', ['has', 'point_count']]
        });

        // Add markers for visible features
        features.forEach((feature) => {
            const props = feature.properties as any;
            const coord = (feature.geometry as any).coordinates;
            const id = props.id;

            if (!markersRef.current[id]) {
                // Create new marker
                const el = document.createElement('div');
                el.className = 'listing-marker';

                // Format price
                const priceLabel = formatPrice(props.price) + (props.currency === 'TRY' ? '₺' : props.currency === 'USD' ? '$' : '€');

                el.innerHTML = `
                    <div class="bg-blue-600 text-white px-2 py-1 rounded-lg shadow-lg text-xs font-bold cursor-pointer hover:bg-blue-700 hover:scale-110 transition-transform whitespace-nowrap border-2 border-white">
                        ${priceLabel}
                    </div>
                `;

                el.addEventListener('click', () => {
                    const listing = listings.find(l => l.id === id);
                    if (listing) {
                        setSelectedListing(listing);
                        setDrawerOpen(true);
                        map.current?.flyTo({
                            center: [coord[0], coord[1]],
                            zoom: 16
                        });
                    }
                });

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat(coord)
                    .addTo(map.current!);

                newMarkers[id] = marker;
            } else {
                newMarkers[id] = markersRef.current[id];
            }
        });

        // Remove markers that are no longer visible
        for (const id in markersRef.current) {
            if (!newMarkers[id]) {
                markersRef.current[id].remove();
            }
        }

        markersRef.current = newMarkers;
    };

    function formatPrice(price: number): string {
        if (price >= 1000000) return (price / 1000000).toFixed(1) + 'M';
        if (price >= 1000) return (price / 1000).toFixed(0) + 'K';
        return price.toString();
    }

    function getCoverPhoto(listing: Listing): string | null {
        if (!listing.listing_media || listing.listing_media.length === 0) return null;
        const sorted = [...listing.listing_media].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const cover = sorted.find(m => m.is_cover) || sorted[0];
        return cover ? `${supabaseUrl}/storage/v1/object/public/listing-media/${cover.storage_path}` : null;
    }

    if (!token) return <div className="p-4 bg-red-50 text-red-500 rounded-2xl">Mapbox token eksik.</div>;
    if (error) return <div className="p-4 bg-red-50 text-red-500 rounded-2xl">Hata: {error}</div>;
    if (!userLocation) return <div className="p-4 bg-gray-50 text-gray-500 rounded-2xl flex items-center justify-center h-full"><Navigation className="h-5 w-5 animate-spin mr-2" /> Konum yükleniyor...</div>;

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">

            {/* Filter Toggle Button (Mobile Optimized) */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute top-4 left-14 z-10 bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors"
                title="Filtreleri Göster/Gizle"
            >
                <Filter className="h-5 w-5" />
            </button>

            {/* Filter Bar */}
            <div className={`absolute top-4 left-28 right-4 z-10 flex gap-2 flex-wrap transition-opacity duration-300 ${showFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium shadow-lg outline-none cursor-pointer hover:bg-white"
                >
                    <option value="">Tüm Tipler</option>
                    <option value="apartment">Daire</option>
                    <option value="villa">Villa</option>
                    <option value="land">Arsa</option>
                    <option value="commercial">Ticari</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium shadow-lg outline-none cursor-pointer hover:bg-white"
                >
                    <option value="">Tüm Durumlar</option>
                    <option value="available">Aktif</option>
                    <option value="sold">Satıldı</option>
                    <option value="reserved">Rezerve</option>
                </select>

                <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium shadow-lg text-gray-600">
                    {listingsWithCoords.length} İlan
                </div>

                {listingsWithoutCoords.length > 0 && (
                    <div className="bg-amber-50/95 backdrop-blur border border-amber-200 rounded-xl px-3 py-2 text-sm font-medium shadow-lg text-amber-700 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {listingsWithoutCoords.length} konumsuz
                    </div>
                )}
            </div>

            {/* Map */}
            <div ref={mapContainer} className="w-full h-full" />

            {/* Detail Drawer */}
            <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-30 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedListing && (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                            <h3 className="font-bold text-gray-900 truncate flex-1 pr-4">{selectedListing.title}</h3>
                            <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="relative aspect-video">
                                {getCoverPhoto(selectedListing) ? (
                                    <img src={getCoverPhoto(selectedListing)!} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Home className="h-10 w-10 text-gray-300" /></div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold text-white shadow-sm ${selectedListing.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                        {selectedListing.status === 'available' ? 'Aktif' : selectedListing.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <p className="text-3xl font-black text-blue-600">
                                        {selectedListing.price.toLocaleString('tr-TR')} {selectedListing.currency}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1 flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {selectedListing.district}, {selectedListing.city}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50 text-center">
                                    <div className="bg-gray-50 rounded-xl p-2">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Oda</p>
                                        <p className="font-bold text-gray-900">{selectedListing.rooms || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-2">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Alan</p>
                                        <p className="font-bold text-gray-900">{selectedListing.sqm} m²</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-2">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Tip</p>
                                        <p className="font-bold text-gray-900">{getTypeLabel(selectedListing.type)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Özellikler</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedListing.has_elevator && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">Asansör</span>}
                                        {selectedListing.has_parking && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">Otopark</span>}
                                        {selectedListing.has_balcony && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">Balkon</span>}
                                        {selectedListing.has_garden && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">Bahçe</span>}
                                        {selectedListing.is_furnished && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">Eşyalı</span>}
                                    </div>
                                </div>

                                {selectedListing.description && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-2">Açıklama</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-6">{selectedListing.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <Link
                                href={`/listings/${selectedListing.id}`}
                                className="flex items-center justify-center w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                İlan Detayına Git
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Drawer Button */}
            {selectedListing && !drawerOpen && (
                <button
                    onClick={() => setDrawerOpen(true)}
                    className="absolute top-1/2 right-0 -translate-y-1/2 bg-white p-3 rounded-l-2xl shadow-xl hover:bg-gray-50 transition-all z-20 border border-r-0 border-gray-100 group"
                >
                    <ChevronLeft className="h-6 w-6 text-blue-600 group-hover:-translate-x-1 transition-transform" />
                </button>
            )}

            <style jsx global>{`
                .mapboxgl-ctrl-top-left { top: 70px; }
            `}</style>
        </div>
    );
}

function getTypeLabel(type: string): string {
    const types: Record<string, string> = {
        apartment: 'Daire',
        villa: 'Villa',
        land: 'Arsa',
        commercial: 'Ticari',
        office: 'Ofis',
        shop: 'Dükkan'
    };
    return types[type] || type;
}
