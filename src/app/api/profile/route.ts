import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profile - Get current agent profile
export async function GET() {
    try {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: agent, error } = await supabase
            .from('agents')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

        if (error || !agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json(agent);
    } catch (error: any) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/profile - Update profile fields
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get agent ID
        const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        // Allowed fields to update
        const allowedFields = ['full_name', 'phone', 'company', 'avatar_url'];
        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('agents')
            .update(updateData)
            .eq('id', agent.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Profile PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
