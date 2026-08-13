import { NextRequest, NextResponse } from 'next/server';
import { createFirestoreGalleryImage } from '@/lib/firebase/gallery';
import { InvalidGalleryImageError, processGalleryImage } from '@/lib/firebase/gallery-storage';
import { galleryMetadataSchema } from '@/models/firestore/gallery';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

function parseJsonField(value: FormDataEntryValue | null, fallback: unknown) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return JSON.parse(value);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.user) return auth.response;

  try {
    const formData = await request.formData();
    const allowedFields = new Set(['file', 'title', 'description', 'categories', 'order']);
    if ([...formData.keys()].some((key) => !allowedFields.has(key))) {
      return NextResponse.json({ success: false, error: 'Unknown upload field' }, { status: 400 });
    }
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    const metadata = galleryMetadataSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || null,
      categories: parseJsonField(formData.get('categories'), []),
      order: Number(formData.get('order') || 0),
    });
    if (!metadata.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid gallery metadata', fieldErrors: metadata.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const processed = await processGalleryImage(Buffer.from(await file.arrayBuffer()), file.type);
    const image = await createFirestoreGalleryImage({ metadata: metadata.data, processed, uploadedBy: auth.user.uid });
    return NextResponse.json({ success: true, image }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidGalleryImageError || error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('[Admin Gallery Upload] Failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to upload image' }, { status: 500 });
  }
}
