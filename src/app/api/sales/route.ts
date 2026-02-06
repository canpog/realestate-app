import { createClient } from '@/lib/supabase/server';
import { calculateCommission, calculateRentalCommission } from '@/lib/commission/calculator';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SalesTransactionRequest {
    listing_id: string;
    client_id?: string;
    transaction_type: 'sale' | 'rental';
    transaction_date: string;
    selling_price: number;
    monthly_rent?: number;
    commission_rate?: number;
    notes?: string;
}

// GET: List transactions
export async function GET(request: NextRequest) {
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const month = searchParams.get('month'); // Format: YYYY-MM

    let query = supabase
        .from('sales_transactions')
        .select(`
            *,
            listing:listings(id, title, type, price),
            client:clients(id, full_name, phone)
        `)
        .eq('agent_id', agent.id)
        .order('transaction_date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('transaction_type', type);
    if (month) {
        const startDate = `${month}-01`;
        const nextMonth = new Date(startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const endDate = nextMonth.toISOString().slice(0, 10);
        query = query.gte('transaction_date', startDate).lt('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary
    const summary = {
        totalSales: 0,
        totalRentals: 0,
        totalSalesAmount: 0,
        totalRentalsAmount: 0,
        totalCommission: 0,
        totalTax: 0,
        netIncome: 0,
    };

    data?.forEach((t) => {
        if (t.transaction_type === 'sale') {
            summary.totalSales++;
            summary.totalSalesAmount += Number(t.selling_price);
        } else {
            summary.totalRentals++;
            summary.totalRentalsAmount += Number(t.selling_price);
        }
        summary.totalCommission += Number(t.commission_amount);
    });

    summary.totalTax = summary.totalCommission * 0.18;
    summary.netIncome = summary.totalCommission - summary.totalTax;

    return NextResponse.json({
        transactions: data,
        summary,
    });
}

// POST: Create new transaction
export async function POST(request: NextRequest) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body: SalesTransactionRequest = await request.json();

        const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        // Get commission config
        const { data: commissionConfig } = await supabase
            .from('commission_config')
            .select('*')
            .eq('agent_id', agent.id)
            .single();

        const defaultRate = commissionConfig?.default_commission_rate || 0.05;
        const rate = body.commission_rate || defaultRate;

        // Calculate commission
        let commissionResult;
        if (body.transaction_type === 'rental' && body.monthly_rent) {
            commissionResult = calculateRentalCommission(body.monthly_rent, 'one_month');
        } else {
            commissionResult = calculateCommission(body.selling_price, rate);
        }

        // Insert transaction
        const { data: transaction, error } = await supabase
            .from('sales_transactions')
            .insert({
                agent_id: agent.id,
                listing_id: body.listing_id,
                client_id: body.client_id || null,
                transaction_type: body.transaction_type,
                transaction_date: body.transaction_date,
                selling_price: body.selling_price,
                commission_rate: commissionResult.rate_used,
                commission_amount: commissionResult.gross_amount,
                status: 'pending',
                notes: body.notes,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update listing status to sold/rented
        await supabase
            .from('listings')
            .update({ status: body.transaction_type === 'sale' ? 'sold' : 'rented' })
            .eq('id', body.listing_id);

        return NextResponse.json({
            success: true,
            transaction,
            commission: commissionResult,
        });

    } catch (error: any) {
        console.error('Transaction error:', error);
        return NextResponse.json(
            { error: error.message || 'Transaction failed' },
            { status: 500 }
        );
    }
}

// PATCH: Update transaction status
export async function PATCH(request: NextRequest) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, status, paid_date } = body;

        const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (status === 'paid' && paid_date) {
            updateData.paid_date = paid_date;
        }

        const { data, error } = await supabase
            .from('sales_transactions')
            .update(updateData)
            .eq('id', id)
            .eq('agent_id', agent.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, transaction: data });

    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: error.message || 'Update failed' },
            { status: 500 }
        );
    }
}
