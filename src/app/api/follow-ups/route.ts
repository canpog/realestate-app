
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    let query = supabase
        .from('follow_ups')
        .select(`
            *,
            clients (
                id,
                full_name,
                phone,
                email
            )
        `)
        .eq('agent_id', (await supabase.from('agents').select('id').eq('auth_user_id', user.id).single()).data?.id)
        .order('scheduled_at', { ascending: true });

    if (status) {
        query = query.eq('status', status);
    }

    if (clientId) {
        query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching follow-ups:', error);
        return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Get agent ID
        const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const { data, error } = await supabase.from('follow_ups').insert({
            agent_id: agent.id,
            client_id: body.client_id,
            scheduled_at: body.scheduled_at,
            follow_up_type: body.follow_up_type,
            notes: body.notes,
            remind_15_min: body.remind_15_min || false,
            remind_1_hour: body.remind_1_hour || false,
            remind_1_day: body.remind_1_day || false,
            status: 'pending'
        }).select().single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating follow-up:', error);
        return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
    }
}
