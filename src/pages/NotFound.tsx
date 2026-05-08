import { Link } from "react-router-dom";
import { usePage } from "../hooks/usePage";

export default function NotFound() {
  const headingRef = usePage<HTMLHeadingElement>("Not Found — My Blog");

  return (
    <article className="post">
      <h1 ref={headingRef} tabIndex={-1}>Page not found</h1>
      <p>That page doesn't exist.</p>
      <p>
        <Link to="/">Back</Link>
      </p>
    </article>
  );
}
