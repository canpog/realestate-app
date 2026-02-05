import { ListingType, ListingPurpose } from './listing';

export type ClientStatus = 'new' | 'following' | 'hot' | 'cold' | 'closed';

export interface Client {
    id: string;
    agent_id: string;
    full_name: string;
    phone: string;
    email: string;
    status: ClientStatus;
    budget_min?: number;
    budget_max?: number;
    currency: string;
    wanted_types?: ListingType[];
    wanted_purpose: ListingPurpose;
    wanted_rooms?: string[];
    wanted_sqm_min?: number;
    wanted_sqm_max?: number;
    wanted_city?: string;
    wanted_districts?: string[];
    wanted_neighborhoods?: string[];
    notes_summary?: string;
    last_contact_at?: string;
    next_followup_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ClientNote {
    id: string;
    client_id: string;
    agent_id: string;
    note: string;
    created_at: string;
}
