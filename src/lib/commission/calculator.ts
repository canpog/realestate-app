// Commission Calculator
export interface CommissionResult {
    gross_amount: number;
    tax: number;
    net_amount: number;
    rate_used: number;
}

export interface TierConfig {
    ranges: Array<{
        min: number;
        max: number | null;
        rate: number;
    }>;
}

// Default tier configuration
export const DEFAULT_TIERS: TierConfig = {
    ranges: [
        { min: 0, max: 1000000, rate: 0.05 },           // 0-1M: 5%
        { min: 1000000, max: 3000000, rate: 0.04 },    // 1M-3M: 4%
        { min: 3000000, max: null, rate: 0.03 },       // 3M+: 3%
    ],
};

/**
 * Calculate commission based on sale price and rate/tiers
 */
export function calculateCommission(
    salePrice: number,
    commissionRate?: number,
    tierSystem?: TierConfig
): CommissionResult {
    let commission = 0;
    let rateUsed = commissionRate || 0.05;

    if (tierSystem && tierSystem.ranges.length > 0) {
        // Tiered commission calculation
        let remaining = salePrice;

        for (const tier of tierSystem.ranges) {
            if (remaining <= 0) break;

            const tierMin = tier.min;
            const tierMax = tier.max || Infinity;
            const tierRange = tierMax - tierMin;

            if (salePrice > tierMin) {
                const amountInTier = Math.min(remaining, tierRange);
                commission += amountInTier * tier.rate;
                remaining -= amountInTier;
            }
        }

        rateUsed = commission / salePrice;
    } else {
        // Flat rate
        commission = salePrice * rateUsed;
    }

    // Calculate tax (18% VAT)
    const tax = commission * 0.18;
    const netAmount = commission - tax;

    return {
        gross_amount: Math.round(commission),
        tax: Math.round(tax),
        net_amount: Math.round(netAmount),
        rate_used: rateUsed,
    };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return amount.toLocaleString('tr-TR') + ' ₺';
}

/**
 * Format percentage for display
 */
export function formatPercentage(rate: number): string {
    return `%${(rate * 100).toFixed(1)}`;
}

/**
 * Calculate rental commission (typically 1 month rent or yearly percentage)
 */
export function calculateRentalCommission(
    monthlyRent: number,
    type: 'one_month' | 'percentage' = 'one_month',
    percentageRate: number = 0.05
): CommissionResult {
    let commission = 0;
    let rateUsed = 0;

    if (type === 'one_month') {
        commission = monthlyRent;
        rateUsed = 1 / 12; // Represents 1 month of yearly rent
    } else {
        const yearlyRent = monthlyRent * 12;
        commission = yearlyRent * percentageRate;
        rateUsed = percentageRate;
    }

    const tax = commission * 0.18;
    const netAmount = commission - tax;

    return {
        gross_amount: Math.round(commission),
        tax: Math.round(tax),
        net_amount: Math.round(netAmount),
        rate_used: rateUsed,
    };
}
