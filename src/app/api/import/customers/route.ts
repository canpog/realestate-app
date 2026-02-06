import { createClient } from '@/lib/supabase/server';
import { parseExcelFile, generateTemplate } from '@/lib/import/excel-parser';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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

        // Parse Excel file
        const parseResult = await parseExcelFile(file, agent.id);

        // If there are errors, return them for preview
        if (parseResult.errors.length > 0) {
            return NextResponse.json({
                success: false,
                preview: true,
                totalRows: parseResult.totalRows,
                validCount: parseResult.customers.length,
                errorCount: parseResult.errors.length,
                errors: parseResult.errors.slice(0, 10), // Only first 10 errors
                customers: parseResult.customers.slice(0, 5), // Preview first 5
            });
        }

        // Insert customers
        const { data: insertedCustomers, error: insertError } = await supabase
            .from('clients')
            .insert(parseResult.customers)
            .select();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Log the import
        await supabase.from('import_logs').insert({
            agent_id: agent.id,
            import_type: 'customers',
            file_name: file.name,
            total_rows: parseResult.totalRows,
            imported_count: insertedCustomers?.length || 0,
            error_count: 0,
            errors: null,
        });

        return NextResponse.json({
            success: true,
            imported: insertedCustomers?.length || 0,
            message: `${insertedCustomers?.length || 0} müşteri başarıyla içe aktarıldı`,
        });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json(
            { error: error.message || 'Import failed' },
            { status: 500 }
        );
    }
}

// GET: Download template
export async function GET() {
    try {
        const templateBuffer = generateTemplate();

        return new NextResponse(Buffer.from(templateBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="musteri_sablonu.xlsx"',
            },
        });
    } catch (error) {
        console.error('Template generation error:', error);
        return NextResponse.json({ error: 'Template generation failed' }, { status: 500 });
    }
}
