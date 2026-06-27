"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, CalendarCheck, MessageCircle,
  Settings, Car, LogOut, AlertTriangle, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

const allNavItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, roles: null },
  { href: "/leads",         label: "Leads",          icon: Users,           roles: null },
  { href: "/bookings",      label: "Bookings",       icon: CalendarCheck,   roles: null },
  { href: "/conversations", label: "Chats",          icon: MessageCircle,   roles: null },
  { href: "/settings",      label: "Settings",       icon: Settings,        roles: ["admin", "manager"] },
];

type SidebarMode = "expanded" | "collapsed" | "hover";

export function Sidebar() {
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mode, setMode] = useState<SidebarMode>("expanded");
  const [hovered, setHovered] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-mode") as SidebarMode | null;
    if (saved) setMode(saved);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "");
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Admin");
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        setUserRole(profile?.role || null);
      }
    });
  }, []);

  // Close mode menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = allNavItems.filter((item) => !item.roles || (userRole && item.roles.includes(userRole)));

  const setModeAndSave = (m: SidebarMode) => {
    setMode(m);
    setShowModeMenu(false);
    localStorage.setItem("sidebar-mode", m);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "HS";

  // Whether to show labels (expanded content)
  const expanded = mode === "expanded" || (mode === "hover" && hovered);

  const modeOptions: { key: SidebarMode; label: string }[] = [
    { key: "expanded",  label: "Expanded" },
    { key: "collapsed", label: "Collapsed" },
    { key: "hover",     label: "Expand on hover" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden min-[900px]:flex flex-col shrink-0 bg-gray-900 border-r border-gray-700 overflow-hidden",
          "transition-[width] duration-200 ease-in-out",
          expanded ? "w-64" : "w-[60px]"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-[70px] border-b border-gray-700 shrink-0 gap-3",
          expanded ? "px-4" : "justify-center"
        )}>
          <div className="bg-blue-600 rounded-lg p-2 shrink-0">
            <Car size={18} className="text-white" />
          </div>
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm leading-tight">Handysolver</p>
              <p className="text-gray-400 text-xs">Car Dealership</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  expanded ? "gap-3 px-3 py-2.5" : "justify-center p-3",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
                {expanded && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={cn(
          "border-t border-gray-700 shrink-0",
          expanded ? "px-4 py-4 space-y-3" : "py-3 px-2 flex flex-col items-center gap-2"
        )}>
          <div className={cn("flex items-center gap-3", !expanded && "justify-center")}>
            <div
              className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0"
              title={!expanded ? `${userName} · ${userEmail}` : undefined}
            >
              {initials}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-gray-400 text-xs truncate">{userEmail}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            title={!expanded ? "Sign out" : undefined}
            className={cn(
              "text-gray-400 hover:text-red-400 transition-colors",
              expanded
                ? "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-800"
                : "p-2 rounded-lg hover:bg-gray-800"
            )}
          >
            <LogOut size={15} />
            {expanded && <span>Sign out</span>}
          </button>
        </div>

        {/* Sidebar control — bottom toggle */}
        <div className="relative border-t border-gray-700 px-2 py-2 shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowModeMenu((v) => !v)}
            title="Sidebar control"
            className={cn(
              "flex items-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",
              expanded ? "gap-2 px-3 py-2 w-full text-sm" : "justify-center p-3 w-full"
            )}
          >
            {mode === "expanded"
              ? <PanelLeftClose size={16} />
              : <PanelLeftOpen size={16} />}
            {expanded && <span>Sidebar control</span>}
          </button>

          {/* Mode popover */}
          {showModeMenu && (
            <div className="absolute bottom-full left-2 mb-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
              {modeOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setModeAndSave(key)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors"
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full border-2 shrink-0",
                    mode === key ? "border-blue-400 bg-blue-400" : "border-gray-500"
                  )} />
                  <span className={mode === key ? "text-white font-medium" : "text-gray-400"}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="min-[900px]:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 bg-gray-900 flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Sign out?</h3>
                <p className="text-gray-400 text-xs mt-0.5">You will be redirected to the login page.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
