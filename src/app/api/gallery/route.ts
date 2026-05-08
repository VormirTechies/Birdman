import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { galleryImages } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawOffset = searchParams.get('offset') ?? '0';
  const rawLimit = searchParams.get('limit') ?? '15';

  const offset = parseInt(rawOffset, 10);
  const limit = parseInt(rawLimit, 10);

  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const images = await db
    .select()
    .from(galleryImages)
    .orderBy(desc(galleryImages.uploadedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ images });
}
