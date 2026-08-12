import { NextRequest, NextResponse } from 'next/server';
import { getGalleryImages, addGalleryImage } from '@/lib/db/queries';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.user) return auth.response;

    const images = await getGalleryImages();
    return NextResponse.json(images);
  } catch (error: unknown) {
    console.error('[API] Failed to fetch gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.user) return auth.response;

    const { url, caption } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const inserted = await addGalleryImage(url, caption);
    return NextResponse.json(inserted);
  } catch (error: unknown) {
    console.error('[API] Failed to add gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
