import { useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getPost } from "../posts";
import { usePage } from "../hooks/usePage";

type Result =
  | { kind: "idle" }
  | { kind: "updated"; commitUrl: string | null }
  | { kind: "error"; message: string };

export default function Edit() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;
  const headingRef = usePage<HTMLHeadingElement>(
    post ? `Edit: ${post.title} — My Blog` : "Edit — My Blog"
  );

  const [password, setPassword] = useState(
    () => sessionStorage.getItem("blog-pw") ?? ""
  );
  const [title, setTitle] = useState(post?.title ?? "");
  const [date, setDate] = useState(post?.date ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [deletedAt, setDeletedAt] = useState<{ commitUrl: string | null } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  if (!post || !slug) {
    return (
      <article className="post">
        <h1 ref={headingRef} tabIndex={-1}>Post not found</h1>
        <p>That post doesn't exist.</p>
        <p><Link to="/">Back</Link></p>
      </article>
    );
  }

  if (deletedAt) {
    return (
      <article className="post">
        <h1 ref={headingRef} tabIndex={-1}>Post deleted</h1>
        <p>
          "{post.title}" was deleted. It will disappear from the site after Vercel
          rebuilds (~30s).
        </p>
        {deletedAt.commitUrl && (
          <p>
            <a href={deletedAt.commitUrl} target="_blank" rel="noreferrer">
              View commit on GitHub
            </a>
          </p>
        )}
        <p><Link to="/">Back to home</Link></p>
      </article>
    );
  }

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

  async function callApi(endpoint: string, payload: Record<string, unknown>) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: { error?: string; ok?: boolean; commitUrl?: string | null };
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error:
          text.slice(0, 200) ||
          `Server returned ${res.status}. (Note: /api routes only work in production or under \`vercel dev\`, not plain \`vite dev\`.)`,
      };
    }
    return { ok: res.ok && data.ok, status: res.status, data };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult({ kind: "idle" });

    try {
      const { ok, status, data } = await callApi("/api/edit-post", {
        password,
        slug,
        title,
        date,
        excerpt,
        body,
      });

      if (!ok) {
        setResult({ kind: "error", message: data.error ?? `Failed (${status})` });
      } else {
        sessionStorage.setItem("blog-pw", password);
        setResult({ kind: "updated", commitUrl: data.commitUrl ?? null });
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

  async function onDelete() {
    if (!window.confirm(`Delete "${post!.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setResult({ kind: "idle" });

    try {
      const { ok, status, data } = await callApi("/api/delete-post", {
        password,
        slug,
      });

      if (!ok) {
        setResult({ kind: "error", message: data.error ?? `Failed (${status})` });
      } else {
        sessionStorage.setItem("blog-pw", password);
        setDeletedAt({ commitUrl: data.commitUrl ?? null });
      }
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="post">
      <h1 ref={headingRef} tabIndex={-1}>Edit: {post.title}</h1>

      {result.kind === "updated" && (
        <div className="notice">
          <p>
            Updated.{" "}
            <Link to={`/posts/${slug}`}>/posts/{slug}</Link> will reflect changes
            after Vercel rebuilds (~30s).
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
          <span>Slug (URL — not editable)</span>
          <input type="text" value={slug} disabled readOnly />
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

        <div className="form-actions">
          <button type="submit" disabled={submitting || deleting}>
            {submitting ? "Updating..." : "Update"}
          </button>
          <button type="button" onClick={onDelete} disabled={submitting || deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </form>
    </article>
  );
}
