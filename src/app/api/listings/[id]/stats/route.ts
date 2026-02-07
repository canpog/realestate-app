import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Get listing statistics
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = createClient();
    const listingId = params.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Parallel queries for performance
        const [
            totalViewsResult,
            views7DaysResult,
            views30DaysResult,
            uniqueVisitorsResult,
            inquiriesResult,
            sharesResult,
            deviceStatsResult,
            refererStatsResult,
            dailyStatsResult,
        ] = await Promise.all([
            // Total views
            supabase
                .from('listing_views')
                .select('*', { count: 'exact', head: true })
                .eq('listing_id', listingId),

            // Views last 7 days
            supabase
                .from('listing_views')
                .select('*', { count: 'exact', head: true })
                .eq('listing_id', listingId)
                .gte('viewed_at', sevenDaysAgo),

            // Views last 30 days
            supabase
                .from('listing_views')
                .select('*', { count: 'exact', head: true })
                .eq('listing_id', listingId)
                .gte('viewed_at', thirtyDaysAgo),

            // Unique visitors (by session)
            supabase
                .from('listing_views')
                .select('session_id')
                .eq('listing_id', listingId)
                .not('session_id', 'is', null),

            // Inquiries
            supabase
                .from('listing_inquiries')
                .select('id, inquiry_type, status, created_at')
                .eq('listing_id', listingId)
                .order('created_at', { ascending: false }),

            // Shares
            supabase
                .from('listing_shares')
                .select('id, share_type, click_count, created_at')
                .eq('listing_id', listingId)
                .order('created_at', { ascending: false }),

            // Device distribution
            supabase
                .from('listing_views')
                .select('viewer_device')
                .eq('listing_id', listingId),

            // Referer distribution
            supabase
                .from('listing_views')
                .select('referer_type')
                .eq('listing_id', listingId),

            // Daily stats for chart (last 30 days)
            supabase
                .from('listing_daily_stats')
                .select('stat_date, views_count, inquiries_count')
                .eq('listing_id', listingId)
                .gte('stat_date', thirtyDaysAgo.slice(0, 10))
                .order('stat_date', { ascending: true }),
        ]);

        // Calculate unique visitors
        const uniqueSessions = new Set(
            (uniqueVisitorsResult.data || []).map(v => v.session_id).filter(Boolean)
        );

        // Aggregate device stats
        const deviceStats = {
            desktop: 0,
            mobile: 0,
            tablet: 0,
        };
        (deviceStatsResult.data || []).forEach(v => {
            if (v.viewer_device === 'desktop') deviceStats.desktop++;
            else if (v.viewer_device === 'mobile') deviceStats.mobile++;
            else if (v.viewer_device === 'tablet') deviceStats.tablet++;
        });

        // Aggregate referer stats
        const refererStats: Record<string, number> = {};
        (refererStatsResult.data || []).forEach(v => {
            const type = v.referer_type || 'direct';
            refererStats[type] = (refererStats[type] || 0) + 1;
        });

        // Aggregate inquiry types
        const inquiryTypes: Record<string, number> = {};
        const inquiries = inquiriesResult.data || [];
        inquiries.forEach(i => {
            inquiryTypes[i.inquiry_type] = (inquiryTypes[i.inquiry_type] || 0) + 1;
        });

        // Aggregate share types
        const shareTypes: Record<string, number> = {};
        const shares = sharesResult.data || [];
        shares.forEach(s => {
            shareTypes[s.share_type] = (shareTypes[s.share_type] || 0) + 1;
        });

        // Calculate conversion rate
        const totalViews = totalViewsResult.count || 0;
        const convertedInquiries = inquiries.filter(i => i.status === 'converted').length;
        const conversionRate = totalViews > 0 ? (convertedInquiries / totalViews) * 100 : 0;

        return NextResponse.json({
            success: true,
            stats: {
                views: {
                    total: totalViews,
                    last7Days: views7DaysResult.count || 0,
                    last30Days: views30DaysResult.count || 0,
                    uniqueVisitors: uniqueSessions.size,
                },
                inquiries: {
                    total: inquiries.length,
                    pending: inquiries.filter(i => i.status === 'pending').length,
                    replied: inquiries.filter(i => i.status === 'replied').length,
                    converted: convertedInquiries,
                    byType: inquiryTypes,
                },
                shares: {
                    total: shares.length,
                    totalClicks: shares.reduce((sum, s) => sum + (s.click_count || 0), 0),
                    byType: shareTypes,
                },
                devices: deviceStats,
                referers: refererStats,
                conversionRate: conversionRate.toFixed(2),
                dailyStats: dailyStatsResult.data || [],
            },
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
