import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/dashboard-client';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Kontrol Paneli',
    description: 'Genel bakış ve istatistikler.',
};

import { NewsWidget } from '@/components/news/news-widget';



export default async function DashboardPage() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return <div className="p-8">Oturum açılmamış.</div>;
        }

        // Get basic agent info
        const { data: agent } = await supabase
            .from('agents')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

        if (!agent) {
            return <div className="p-8">Agent bulunamadı.</div>;
        }

        // Get recent listings
        const { data: recentListings } = await supabase
            .from('listings')
            .select('*, listing_media(*)')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: false })
            .limit(5);

        // Get counts
        const { count: totalListings } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agent.id);

        const { count: totalClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agent.id);

        const { count: hotClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agent.id)
            .eq('status', 'hot');

        const { count: pdfExports } = await supabase
            .from('pdf_exports')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agent.id);

        // Get total views across all listings
        // First get all listing IDs for this agent
        const { data: agentListings } = await supabase
            .from('listings')
            .select('id')
            .eq('agent_id', agent.id);

        let totalViews = 0;
        if (agentListings && agentListings.length > 0) {
            const listingIds = agentListings.map(l => l.id);
            const { count } = await supabase
                .from('listing_views')
                .select('*', { count: 'exact', head: true })
                .in('listing_id', listingIds);
            totalViews = count || 0;
        }

        // Get recent activity (combine listings and clients)
        const { data: recentClients } = await supabase
            .from('clients')
            .select('id, full_name, created_at')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: false })
            .limit(3);

        // Get weekly data for chart (last 7 days)
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const { data: weeklyListings } = await supabase
            .from('listings')
            .select('created_at')
            .eq('agent_id', agent.id)
            .gte('created_at', weekAgo.toISOString());

        const { data: weeklyClients } = await supabase
            .from('clients')
            .select('created_at')
            .eq('agent_id', agent.id)
            .gte('created_at', weekAgo.toISOString());

        // Process weekly data for chart
        const weeklyData = [];
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const listings = weeklyListings?.filter(l => l.created_at?.startsWith(dateStr)).length || 0;
            const clients = weeklyClients?.filter(c => c.created_at?.startsWith(dateStr)).length || 0;
            weeklyData.push({
                name: dayNames[date.getDay()],
                portfoy: listings,
                musteri: clients,
            });
        }

        // Build activity feed
        const activities: any[] = [];

        recentListings?.forEach((listing: any) => {
            activities.push({
                type: 'listing',
                title: `Yeni portföy eklendi: "${listing.title}"`,
                time: listing.created_at
            });
        });

        recentClients?.forEach((client: any) => {
            activities.push({
                type: 'client',
                title: `Yeni müşteri: ${client.full_name}`,
                time: client.created_at
            });
        });

        // Sort by time
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        const dashboardData = {
            agent,
            stats: {
                totalListings: totalListings || 0,
                totalClients: totalClients || 0,
                hotClients: hotClients || 0,
                pdfExports: pdfExports || 0,
                totalViews: totalViews || 0,
            },
            recentListings: recentListings || [],
            weeklyData,
            activities: activities.slice(0, 5),
        };

        return <DashboardClient data={dashboardData} />;
    } catch (e: any) {
        return (
            <div className="p-8 bg-red-50 text-red-800 rounded-2xl border border-red-200">
                <h2 className="text-xl font-bold mb-4">Dashboard Hatası</h2>
                <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">{e.message}\n{e.stack}</pre>
            </div>
        );
    }
}
