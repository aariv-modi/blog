import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <article className="post">
      <h2>Page not found</h2>
      <p>That page doesn't exist.</p>
      <p>
        <Link to="/">&larr; Back home</Link>
      </p>
    </article>
  );
}
