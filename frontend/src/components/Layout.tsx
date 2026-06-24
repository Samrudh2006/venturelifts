import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { path: "/dashboard", label: "Dashboard", roles: ["founder", "mentor", "admin"] },
  { path: "/ventures", label: "Ventures", roles: ["founder", "admin"] },
  { path: "/ai", label: "AI Tools", roles: ["founder", "mentor", "admin"] },
  { path: "/search", label: "Search", roles: ["founder", "mentor", "admin"] },
  { path: "/sessions", label: "Sessions", roles: ["founder", "mentor", "admin"] },
  { path: "/billing", label: "Billing", roles: ["founder", "mentor", "admin"] },
  { path: "/2fa", label: "2FA", roles: ["admin"] },
  { path: "/admin", label: "Admin", roles: ["admin"] },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 font-black text-white">
                VL
              </div>
              <span className="hidden text-sm font-bold tracking-widest font-heading sm:block">VENTURELIFT</span>
            </Link>
            <nav className="flex gap-1">
              {navItems
                .filter(item => user && item.roles.includes(user.role))
                .map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                      location.pathname === item.path
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-500 sm:block">
              {user?.name} - <span className="uppercase">{user?.role}</span>
            </span>
            <button onClick={handleLogout} className="rounded-md border border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 transition hover:border-orange-500 hover:text-orange-500">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
