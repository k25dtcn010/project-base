import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <div className="container-fluid">
          <div className="navbar-nav me-auto">
            {links.map(({ to, label }) => {
              return (
                <Link key={to} to={to} className="nav-link">
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="d-flex align-items-center gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
