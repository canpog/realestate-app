export interface MarketAnalysis {
    id: string;
    city: string;
    district: string;
    neighborhood?: string;
    listing_type: string;
    rooms?: string;
    average_price: number;
    min_price: number;
    max_price: number;
    median_price: number;
    price_per_sqm: number;
    sample_size: number;
    last_updated: string;
}

export interface ValuationReport {
    id: string;
    listing_id: string;
    estimated_price: number;
    price_range_min: number;
    price_range_max: number;
    price_score: number; // 0-10
    market_comparison: string;
    recommendations: string;
    rental_yield?: number;
    created_at: string;
    analysis_params: ValuationParams;
}

export interface ValuationParams {
    city: string;
    district: string;
    type: string;
    rooms: string;
    sqm: number;
    age: number;
    floor: number; // e.g. 3
    features: string[];
}
