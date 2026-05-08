import { Link, NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="site-title">My Blog</Link>
          <nav className="site-nav">
            <NavLink to="/" end>Home</NavLink>
          </nav>
        </div>
      </header>

      <main className="container site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} My Blog. Built with React, TypeScript, and Vite.</p>
        </div>
      </footer>
    </div>
  );
}
