import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateListingPDFBuffer } from '@/lib/pdf/generator';
import { nanoid } from 'nanoid';

// GET - Direct PDF download/view
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        // Get listing with agent and media
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*, agents(*), listing_media(*)')
            .eq('id', params.id)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Generate PDF buffer
        const pdfBuffer = await generateListingPDFBuffer(listing, listing.agents);

        // Return PDF directly
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${listing.title || 'listing'}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Generate and store PDF with share link
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        // Get listing with agent
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*, agents(*), listing_media(*)')
            .eq('id', params.id)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Generate PDF buffer
        const pdfBuffer = await generateListingPDFBuffer(listing, listing.agents);

        // Create unique filename
        const fileName = `listing-${params.id}-${Date.now()}.pdf`;
        const storagePath = `pdfs/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('listing-media')
            .upload(storagePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'PDF upload failed' }, { status: 500 });
        }

        // Create share link (pdf_exports)
        const shareToken = nanoid(12);

        const { data: shareLink, error: shareLinkError } = await supabase
            .from('pdf_exports')
            .insert({
                listing_id: params.id,
                share_token: shareToken,
                storage_path: storagePath,
                agent_id: listing.agent_id,
                file_name: fileName,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            })
            .select()
            .single();

        if (shareLinkError) {
            console.error('Share link error:', shareLinkError);
            return NextResponse.json({ error: 'Share link creation failed' }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('listing-media')
            .getPublicUrl(storagePath);

        return NextResponse.json({
            success: true,
            shareToken,
            shareUrl: `/share/${shareToken}`,
            pdfUrl: publicUrlData.publicUrl,
            expiresAt: shareLink.expires_at
        });

    } catch (error: any) {
        console.error('PDF generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
