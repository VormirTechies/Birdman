"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type SamplePost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function MongoDbDemoPage() {
  const [posts, setPosts] = useState<SamplePost[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sample-posts", { cache: "no-store" });
      const data = (await response.json()) as { posts?: SamplePost[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load posts");
      setPosts(data.posts ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/sample-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = (await response.json()) as { post?: SamplePost; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error ?? "Could not create post");

      setPosts((current) => [data.post!, ...current]);
      setTitle("");
      setContent("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Prisma + MongoDB Atlas
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Database connection demo</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            These posts are loaded from the Atlas cluster through a Next.js API route and Prisma.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sample posts</h2>
              <button
                type="button"
                onClick={() => void loadPosts()}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-emerald-500 hover:text-emerald-300"
              >
                Refresh
              </button>
            </div>

            {loading ? <p className="text-slate-400">Loading from MongoDB…</p> : null}
            {!loading && posts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                No posts yet. Add the first one using the form.
              </p>
            ) : null}
            <div className="space-y-4">
              {posts.map((post) => (
                <article key={post.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <h3 className="font-semibold text-emerald-300">{post.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-300">{post.content}</p>
                  <time className="mt-4 block text-xs text-slate-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </time>
                </article>
              ))}
            </div>
          </section>

          <form onSubmit={createPost} className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Add a post</h2>
            <label className="mt-5 block text-sm text-slate-300" htmlFor="title">Title</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              required
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-emerald-500"
            />
            <label className="mt-4 block text-sm text-slate-300" htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={1000}
              required
              rows={5}
              className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-emerald-500"
            />
            <button
              disabled={saving}
              className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save to MongoDB"}
            </button>
            {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          </form>
        </div>
      </div>
    </main>
  );
}
