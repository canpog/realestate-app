import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: agent } = await supabase.from('agents').select('id').eq('auth_user_id', user.id).single();
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    // 1. Find pending & past followups
    const now = new Date().toISOString();
    const { data: missedFollowups } = await supabase
        .from('follow_ups')
        .select('*, clients(full_name)')
        .eq('agent_id', agent.id)
        .eq('status', 'pending')
        .lt('scheduled_at', now);

    if (!missedFollowups || missedFollowups.length === 0) {
        return NextResponse.json({ processed: 0 });
    }

    let processed = 0;

    for (const item of missedFollowups) {
        // Create notification
        await supabase.from('notifications').insert({
            agent_id: agent.id,
            follow_up_id: item.id,
            type: 'missed',
            title: `Kaçırılan Takip: ${item.clients?.full_name || 'Müşteri'}`,
            message: `${new Date(item.scheduled_at).toLocaleString('tr-TR')} zamanlı ${item.follow_up_type} takibi gecikti.`,
            is_read: false
        });

        // Update status to missed
        await supabase.from('follow_ups')
            .update({ status: 'missed' })
            .eq('id', item.id);

        processed++;
    }

    return NextResponse.json({ processed });
}
