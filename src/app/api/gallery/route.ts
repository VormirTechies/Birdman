import { NextRequest, NextResponse } from 'next/server';
import { InvalidGalleryCursorError, listPublicGalleryPage } from '@/lib/firebase/gallery';
import { galleryListQuerySchema } from '@/models/firestore/gallery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const parsed = galleryListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid pagination parameters' }, { status: 400 });
  }

  try {
    const page = await listPublicGalleryPage(parsed.data.limit, parsed.data.cursor);
    return NextResponse.json({ success: true, ...page });
  } catch (error) {
    if (error instanceof InvalidGalleryCursorError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('[Gallery API] Failed to list gallery:', error);
    return NextResponse.json({ success: false, error: 'Unable to load gallery' }, { status: 500 });
  }
}
