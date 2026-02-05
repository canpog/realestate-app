import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auth agent check could be redundant if RLS is on, but strictly safer here or via RLS policies.
    // Assuming we trust RLS or verify agent_id in update query.

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
        const updates: any = { ...body, updated_at: new Date().toISOString() };

        // If completing
        if (body.status === 'completed' && !body.completed_at) {
            updates.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('follow_ups')
            .update(updates)
            .eq('id', params.id)
            .eq('agent_id', agent.id) // Security check
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
        const { error } = await supabase
            .from('follow_ups')
            .delete()
            .eq('id', params.id)
            .eq('agent_id', agent.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
