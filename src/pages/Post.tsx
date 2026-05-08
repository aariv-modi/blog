import { Link, useParams } from "react-router-dom";
import { getPost, formatDate } from "../posts";

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  if (!post) {
    return (
      <article className="post">
        <h2>Post not found</h2>
        <p>That post doesn't exist (or has moved).</p>
        <p>
          <Link to="/">&larr; Back to all posts</Link>
        </p>
      </article>
    );
  }

  return (
    <article className="post">
      <h2>{post.title}</h2>
      <p className="post-meta">Published on {formatDate(post.date)}</p>
      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
      <p className="back-link">
        <Link to="/">&larr; Back to all posts</Link>
      </p>
    </article>
  );
}
