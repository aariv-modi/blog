import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePage } from "../hooks/usePage";

type Result =
  | { kind: "idle" }
  | { kind: "success"; slug: string; commitUrl: string | null }
  | { kind: "error"; message: string };

export default function New() {
  const headingRef = usePage<HTMLHeadingElement>("New Post — My Blog");
  const [password, setPassword] = useState(
    () => sessionStorage.getItem("blog-pw") ?? ""
  );
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after: string = before) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      if (start === end) {
        const cursor = start + before.length;
        el.setSelectionRange(cursor, cursor);
      } else {
        el.setSelectionRange(start + before.length, end + before.length);
      }
    });
  }

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
      <h1 ref={headingRef} tabIndex={-1}>New Post</h1>

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
          <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
            <button type="button" onClick={() => wrapSelection("**")} aria-label="Bold" title="Bold">
              <strong>B</strong>
            </button>
            <button type="button" onClick={() => wrapSelection("*")} aria-label="Italic" title="Italic">
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => wrapSelection("<u>", "</u>")}
              aria-label="Underline"
              title="Underline"
            >
              <u>U</u>
            </button>
          </div>
          <textarea
            ref={bodyRef}
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
