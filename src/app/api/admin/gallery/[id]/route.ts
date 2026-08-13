import { NextRequest, NextResponse } from 'next/server';
import { deleteFirestoreGalleryImage, GalleryNotFoundError, updateFirestoreGalleryImage } from '@/lib/firebase/gallery';
import { galleryMetadataSchema } from '@/models/firestore/gallery';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.user) return auth.response;
  try {
    const parsed = galleryMetadataSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid gallery metadata', fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { id } = await params;
    const image = await updateFirestoreGalleryImage(id, parsed.data);
    return NextResponse.json({ success: true, image });
  } catch (error) {
    if (error instanceof GalleryNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('[Admin Gallery API] Failed to update:', error);
    return NextResponse.json({ success: false, error: 'Unable to update image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.user) return auth.response;
  try {
    const { id } = await params;
    await deleteFirestoreGalleryImage(id);
    return NextResponse.json({ success: true, message: 'Gallery image removed' });
  } catch (error) {
    if (error instanceof GalleryNotFoundError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error('[Admin Gallery API] Failed to delete:', error);
    return NextResponse.json({ success: false, error: 'Unable to delete image' }, { status: 500 });
  }
}
