import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST: Track a listing view
export async function POST(request: NextRequest) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { listing_id, session_id, duration_seconds } = body;

        if (!listing_id) {
            return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
        }

        // Get request headers for device/location info
        const headersList = headers();
        const userAgent = headersList.get('user-agent') || '';
        const referer = headersList.get('referer') || '';
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || 'unknown';

        // Detect device type from user agent
        let deviceType = 'desktop';
        if (/mobile/i.test(userAgent)) {
            deviceType = 'mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
            deviceType = 'tablet';
        }

        // Detect referer type
        let refererType = 'direct';
        if (referer) {
            if (/whatsapp/i.test(referer)) {
                refererType = 'whatsapp';
            } else if (/facebook|twitter|instagram|linkedin/i.test(referer)) {
                refererType = 'social';
            } else if (/google|bing|yahoo|duckduckgo/i.test(referer)) {
                refererType = 'search';
            } else if (/mail|email/i.test(referer)) {
                refererType = 'email';
            } else {
                refererType = 'referral';
            }
        }

        // Insert view record
        const { error } = await supabase.from('listing_views').insert({
            listing_id,
            session_id: session_id || crypto.randomUUID(),
            viewer_ip: ip,
            viewer_user_agent: userAgent.substring(0, 500), // Limit length
            viewer_device: deviceType,
            referer_url: referer?.substring(0, 500),
            referer_type: refererType,
            duration_seconds: duration_seconds || null,
        });

        if (error) {
            console.error('View tracking error:', error);
            return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('View tracking error:', error);
        return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
    }
}
