import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent id
    const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
        .from('follow_ups')
        .select('*, clients(id, full_name, phone, email)')
        .eq('agent_id', agent.id)
        .order('scheduled_at', { ascending: true });

    if (status) query = query.eq('status', status);
    if (clientId) query = query.eq('client_id', clientId);
    if (startDate) query = query.gte('scheduled_at', startDate);
    if (endDate) query = query.lte('scheduled_at', endDate);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.client_id || !body.scheduled_at || !body.follow_up_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('follow_ups')
            .insert({
                agent_id: agent.id,
                client_id: body.client_id,
                scheduled_at: body.scheduled_at,
                follow_up_type: body.follow_up_type,
                notes: body.notes,
                status: 'pending',
                remind_15_min: body.remind_15_min || false,
                remind_1_hour: body.remind_1_hour || false,
                remind_1_day: body.remind_1_day || false,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
