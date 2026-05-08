import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

type Result =
  | { kind: "idle" }
  | { kind: "success"; slug: string; commitUrl: string | null }
  | { kind: "error"; message: string };

export default function New() {
  const [password, setPassword] = useState(
    () => sessionStorage.getItem("blog-pw") ?? ""
  );
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult({ kind: "idle" });

    let data: { error?: string; ok?: boolean; slug?: string; commitUrl?: string | null };
    try {
      const res = await fetch("/api/new-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, title, date, excerpt, body }),
      });

      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error:
            text.slice(0, 200) ||
            `Server returned ${res.status}. (Note: /api routes only work in production or under \`vercel dev\`, not plain \`vite dev\`.)`,
        };
      }

      if (!res.ok || !data.ok) {
        setResult({ kind: "error", message: data.error ?? `Failed (${res.status})` });
      } else {
        sessionStorage.setItem("blog-pw", password);
        setResult({
          kind: "success",
          slug: data.slug!,
          commitUrl: data.commitUrl ?? null,
        });
        setTitle("");
        setExcerpt("");
        setBody("");
      }
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="post">
      <h2>New Post</h2>

      {result.kind === "success" && (
        <div className="notice notice-success">
          <p>
            Committed. The post will go live at{" "}
            <Link to={`/posts/${result.slug}`}>/posts/{result.slug}</Link> after Vercel rebuilds
            (~30s).
          </p>
          {result.commitUrl && (
            <p>
              <a href={result.commitUrl} target="_blank" rel="noreferrer">
                View commit on GitHub
              </a>
            </p>
          )}
        </div>
      )}

      {result.kind === "error" && (
        <div className="notice notice-error">
          <p>{result.message}</p>
        </div>
      )}

      <form className="new-post-form" onSubmit={onSubmit}>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <label>
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          <span>Excerpt</span>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Optional — one-line preview shown on the home page"
          />
        </label>

        <label>
          <span>Body (markdown)</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish"}
        </button>
      </form>
    </article>
  );
}
