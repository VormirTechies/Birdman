import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { deleteGalleryImage, updateGalleryImage } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

const BUCKET = 'gallery';

const getAdminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const altText = (body.title as string | undefined)?.trim();
    const caption = (body.description as string | undefined)?.trim() || null;

    if (!altText) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updated = await updateGalleryImage(id, { altText, caption });
    if (!updated) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, image: updated });
  } catch (error) {
    console.error('[Gallery API] Failed to update gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to delete from Supabase storage too
    const body = await request.json().catch(() => ({}));
    const imageUrl: string | undefined = body.url;

    if (imageUrl) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
        if (imageUrl.startsWith(storagePrefix)) {
          const storagePath = imageUrl.replace(storagePrefix, '');
          const adminClient = getAdminClient();
          await adminClient.storage.from(BUCKET).remove([storagePath]);
        }
      } catch (storageErr) {
        console.warn('[Gallery API] Storage delete failed (non-fatal):', storageErr);
      }
    }

    await deleteGalleryImage(id);
    return NextResponse.json({ success: true, message: 'Gallery image removed' });
  } catch (error) {
    console.error('[Gallery API] Failed to remove gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
