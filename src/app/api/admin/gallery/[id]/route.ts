import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'gallery_images';

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const altText =
      typeof (body.title ?? body.altText) === 'string'
        ? String(body.title ?? body.altText).trim()
        : '';
    const caption =
      typeof (body.description ?? body.caption) === 'string'
        ? String(body.description ?? body.caption).trim() || null
        : null;

    if (!altText) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const reference = getAdminDb().collection(COLLECTION).doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const changes = {
      altText,
      caption,
      updatedAt: Timestamp.now(),
      updatedBy: auth.user.uid,
    };
    await reference.update(changes);

    return NextResponse.json({
      success: true,
      image: serializeImage(id, { ...snapshot.data(), ...changes }),
    });
  } catch (error) {
    console.error('[Gallery API] Failed to update Firebase gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const reference = getAdminDb().collection(COLLECTION).doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    await reference.delete();
    return NextResponse.json({
      success: true,
      message: 'Gallery image removed',
    });
  } catch (error) {
    console.error('[Gallery API] Failed to remove Firebase gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
