
import { Home, TrendingUp, Building2, Map, Sun, Tag } from 'lucide-react';

export type PortfolioCategory = 'investment' | 'residence' | 'commercial' | 'land' | 'vacation' | 'general';

export const PORTFOLIO_CATEGORIES = {
    investment: {
        label: 'Yatırım Amaçlı',
        icon: TrendingUp,
        description: 'Kiralık gelir veya fiyat takdiri beklenen portföyler',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    residence: {
        label: 'Yaşam Amaçlı',
        icon: Home,
        description: 'Konut olarak yaşamak için uygun portföyler',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800'
    },
    commercial: {
        label: 'Ticari',
        icon: Building2,
        description: 'İş, dükkan, ofis gibi ticari alanlar',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        badgeColor: 'bg-amber-100 text-amber-800'
    },
    land: {
        label: 'Arsa',
        icon: Map,
        description: 'İnşaat yapılabilir veya hammadde araziler',
        color: 'text-violet-600 bg-violet-50 border-violet-200',
        badgeColor: 'bg-violet-100 text-violet-800'
    },
    vacation: {
        label: 'Tatil Evi',
        icon: Sun,
        description: 'Turizm ve tatil amacıyla kullanılan portföyler',
        color: 'text-pink-600 bg-pink-50 border-pink-200',
        badgeColor: 'bg-pink-100 text-pink-800'
    },
    general: {
        label: 'Genel',
        icon: Tag,
        description: 'Kategorize edilmemiş portföyler',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        badgeColor: 'bg-gray-100 text-gray-800'
    },
};

export interface ListingFlag {
    id: string;
    listing_id: string;
    flag_type: 'priority' | 'review' | 'sold' | 'under_offer';
    color: 'red' | 'yellow' | 'green' | 'blue';
    notes?: string;
    created_at: string;
}

export const FLAG_COLORS = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500'
};
