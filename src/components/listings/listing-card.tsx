'use client';

import { type Listing } from '@/types/listing';
import { Home, MapPin, Square } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ListingCard({ listing }: { listing: Listing }) {
    // Sort photos by sort_order, then find cover or use first
    const sortedMedia = listing.listing_media
        ? [...listing.listing_media].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        : [];
    const coverPhoto = sortedMedia.find(m => m.is_cover) || sortedMedia[0];

    return (
        <Link
            href={`/listings/${listing.id}`}
            className="group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                {coverPhoto ? (
                    <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${coverPhoto.storage_path}`}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Home className="h-12 w-12" />
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <span className={cn(
                        "px-2 py-1 rounded text-xs font-semibold text-white",
                        listing.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                    )}>
                        {listing.status === 'available' ? 'Aktif' : 'Pasif'}
                    </span>
                </div>
                <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-1 rounded bg-black/50 text-white text-xs font-semibold">
                        {listing.purpose === 'sale' ? 'Satılık' : 'Kiralık'}
                    </span>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {listing.title}
                </h3>
                <p className="text-xl font-extrabold text-blue-600 mt-1">
                    {listing.price.toLocaleString('tr-TR')} {listing.currency === 'TRY' ? '₺' : listing.currency}
                </p>
                <div className="flex items-center text-gray-500 text-sm mt-3 space-x-3">
                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">{listing.district}, {listing.city}</span>
                    </div>
                </div>
                <div className="flex items-center text-gray-500 text-xs mt-2 space-x-3">
                    <div className="flex items-center">
                        <Home className="h-3 w-3 mr-1" />
                        <span>{listing.rooms}</span>
                    </div>
                    <div className="flex items-center">
                        <Square className="h-3 w-3 mr-1" />
                        <span>{listing.sqm} m²</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

