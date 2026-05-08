import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { posts, formatDate } from "../posts";
import { usePage } from "../hooks/usePage";

export default function Home() {
  const headingRef = usePage<HTMLHeadingElement>("My Blog");
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  function setQuery(q: string) {
    if (q) {
      setSearchParams({ q }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q)
    );
  }, [query]);

  const isFiltering = query.trim().length > 0;

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="visually-hidden">My Blog</h1>

      <input
        type="search"
        className="search"
        placeholder="Search posts"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search posts"
      />

      {isFiltering && (
        <p className="search-count" aria-live="polite">
          {filtered.length} of {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="no-results">No posts match "{query}".</p>
      ) : (
        <ul className="post-list">
          {filtered.map((post) => (
            <li key={post.slug} className="post-preview">
              <h2>
                <Link to={`/posts/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="post-meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span aria-hidden="true"> · </span>
                <span>{post.readingMinutes} min read</span>
              </p>
              {post.excerpt && <p>{post.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
