import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Image, LayoutGrid, FileCog, Cpu, RefreshCw, Menu, X } from "lucide-react";

const navGroups = [
  { to: "/",              label: "Trang chủ",   icon: LayoutGrid },
  { to: "/file-converter",label: "Chuyển đổi",  icon: RefreshCw },
  { to: "/pdf-merge",     label: "PDF",          icon: FileCog },
  { to: "/word",          label: "Office",       icon: FileText },
  { to: "/image-compress",label: "Ảnh",          icon: Image },
  { to: "/pdf-ocr",       label: "OCR",          icon: Cpu },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to.split("-")[0]) && to !== "/");

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-lg text-foreground tracking-tight">OfficeTool</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navGroups.map(({ to, label, icon: Icon }) => (
            <Link
              key={to} to={to}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-3xl text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon size={15} />{label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/" className="hidden sm:block text-xs text-muted-foreground border border-border rounded-2xl px-3 py-1.5 hover:bg-muted transition-colors">
            20+ công cụ →
          </Link>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navGroups.map(({ to, label, icon: Icon }) => (
              <Link
                key={to} to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive(to)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={18} />{label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
