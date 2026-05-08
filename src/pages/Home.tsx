import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { posts, formatDate } from "../posts";

export default function Home() {
  const [query, setQuery] = useState("");

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

  return (
    <>
      <input
        type="search"
        className="search"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search posts"
      />

      <section className="post-list">
        <h2>Recent Posts</h2>
        {filtered.length === 0 ? (
          <p className="no-results">No posts match "{query}".</p>
        ) : (
          filtered.map((post) => (
            <article key={post.slug} className="post-preview">
              <h3>
                <Link to={`/posts/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="post-meta">Published on {formatDate(post.date)}</p>
              {post.excerpt && <p>{post.excerpt}</p>}
              <Link className="read-more" to={`/posts/${post.slug}`}>
                Read more &rarr;
              </Link>
            </article>
          ))
        )}
      </section>
    </>
  );
}
