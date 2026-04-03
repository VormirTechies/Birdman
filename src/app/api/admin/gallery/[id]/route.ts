import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { deleteGalleryImage } from '@/lib/db/queries';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Optional: Delete from Storage too?
    // For simplicity, we delete the DB record.
    await deleteGalleryImage(id);

    return NextResponse.json({ success: true, message: 'Gallery image removed' });
  } catch (error: any) {
    console.error('[API] Failed to remove gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
