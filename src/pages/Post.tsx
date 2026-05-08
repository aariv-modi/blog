import { Link, useParams } from "react-router-dom";
import { getPost, getAdjacent, formatDate } from "../posts";
import { usePage } from "../hooks/usePage";

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;
  const headingRef = usePage<HTMLHeadingElement>(
    post ? `${post.title} — My Blog` : "Post not found — My Blog"
  );

  if (!post) {
    return (
      <article className="post">
        <h1 ref={headingRef} tabIndex={-1}>Post not found</h1>
        <p>That post doesn't exist.</p>
        <p>
          <Link to="/">Back</Link>
        </p>
      </article>
    );
  }

  const { older, newer } = getAdjacent(post.slug);

  return (
    <article className="post">
      <h1 ref={headingRef} tabIndex={-1}>{post.title}</h1>
      <p className="post-meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true"> · </span>
        <span>{post.readingMinutes} min read</span>
      </p>
      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />

      {(older || newer) && (
        <nav className="post-nav" aria-label="Adjacent posts">
          {newer && (
            <p>
              Newer: <Link to={`/posts/${newer.slug}`}>{newer.title}</Link>
            </p>
          )}
          {older && (
            <p>
              Older: <Link to={`/posts/${older.slug}`}>{older.title}</Link>
            </p>
          )}
        </nav>
      )}

      <p className="back-link">
        <Link to="/">Back</Link>
        <span aria-hidden="true"> · </span>
        <Link to={`/edit/${post.slug}`}>Edit</Link>
      </p>
    </article>
  );
}
