import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  content: z.string().trim().min(1, "Content is required").max(1000),
});

export async function GET() {
  try {
    const posts = await prisma.samplePost.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Unable to read sample posts from MongoDB:", error);
    return NextResponse.json(
      { error: "Unable to connect to MongoDB. Check MONGODB_URI and Atlas network access." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = createPostSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { error: body.error.issues[0]?.message ?? "Invalid post data" },
        { status: 400 },
      );
    }

    const post = await prisma.samplePost.create({ data: body.data });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Unable to create a sample post in MongoDB:", error);
    return NextResponse.json(
      { error: "Unable to save the post to MongoDB." },
      { status: 500 },
    );
  }
}
