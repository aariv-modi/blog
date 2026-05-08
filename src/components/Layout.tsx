import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigationType } from "react-router-dom";

function useScrollToTopOnNavigate() {
  const location = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType === "POP") return;
    window.scrollTo(0, 0);
  }, [location.pathname, navType]);
}

export default function Layout() {
  useScrollToTopOnNavigate();

  return (
    <div className="site">
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className="container site-header">
        <Link to="/" className="site-title">My Blog</Link>
      </header>

      <main id="main" className="container site-main">
        <Outlet />
      </main>

      <footer className="container site-footer">
        <Link to="/new">New post</Link>
        <a href="mailto:aariv.modi@gmail.com">aariv.modi@gmail.com</a>
      </footer>
    </div>
  );
}
