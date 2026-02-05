export type ListingType = 'apartment' | 'villa' | 'land' | 'commercial' | 'office' | 'shop';
export type ListingStatus = 'available' | 'sold' | 'reserved' | 'rented';
export type ListingPurpose = 'sale' | 'rent';

export interface Listing {
    id: string;
    agent_id: string;
    title: string;
    description: string;
    type: ListingType;
    purpose: ListingPurpose;
    status: ListingStatus;
    price: number;
    currency: string;
    sqm: number;
    rooms: string;
    floor_number?: number;
    total_floors?: number;
    building_age?: number;
    heating_type?: string;
    has_elevator: boolean;
    has_parking: boolean;
    has_balcony: boolean;
    has_garden: boolean;
    is_furnished: boolean;
    address_text: string;
    city: string;
    district: string;
    neighborhood: string;
    lat: number;
    lng: number;
    created_at: string;
    updated_at: string;
    listing_media?: ListingMedia[];
}

export interface ListingMedia {
    id: string;
    listing_id: string;
    agent_id: string;
    storage_path: string;
    thumbnail_path?: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    sort_order: number;
    is_cover: boolean;
    created_at: string;
}
