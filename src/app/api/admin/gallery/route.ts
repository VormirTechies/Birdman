import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

const COLLECTION = 'gallery_images';

function serializeImage(id: string, data: Record<string, unknown>) {
  const uploadedAt = data.uploadedAt ?? data.uploaded_at;

  return {
    id,
    url: String(data.url ?? ''),
    altText: data.altText ?? data.alt_text ?? null,
    caption: data.caption ?? null,
    category: Array.isArray(data.category) ? data.category : null,
    aspect: data.aspect ?? 'square',
    order: Number(data.order ?? 0),
    uploadedAt:
      uploadedAt instanceof Timestamp
        ? uploadedAt.toDate().toISOString()
        : uploadedAt instanceof Date
          ? uploadedAt.toISOString()
          : uploadedAt ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .orderBy('uploadedAt', 'desc')
      .get();

    return NextResponse.json(
      snapshot.docs.map((document) =>
        serializeImage(document.id, document.data())
      )
    );
  } catch (error: unknown) {
    console.error('[API] Failed to fetch Firebase gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const altText =
      typeof (body.altText ?? body.title) === 'string'
        ? String(body.altText ?? body.title).trim()
        : null;
    const caption =
      typeof (body.caption ?? body.description) === 'string'
        ? String(body.caption ?? body.description).trim() || null
        : null;

    if (!url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    const uploadedAt = Timestamp.now();
    const reference = getAdminDb().collection(COLLECTION).doc();
    const image = {
      url,
      altText,
      caption,
      category: null,
      aspect: 'square',
      order: 0,
      uploadedAt,
      createdBy: auth.user.uid,
    };
    await reference.set(image);

    return NextResponse.json(serializeImage(reference.id, image), {
      status: 201,
    });
  } catch (error: unknown) {
    console.error('[API] Failed to add Firebase gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
