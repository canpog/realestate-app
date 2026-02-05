import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: agent } = await supabase.from('agents').select('id').eq('auth_user_id', user.id).single();
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(20);

    return NextResponse.json(data);
}

// Mark all as read
export async function PATCH(request: NextRequest) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: agent } = await supabase.from('agents').select('id').eq('auth_user_id', user.id).single();

    await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('agent_id', agent.id)
        .eq('is_read', false);

    return NextResponse.json({ success: true });
}
