"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CalendarCheck, MessageCircle,
  Settings, Car, LogOut, AlertTriangle,
} from "lucide-react";

const allNavItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, roles: null },
  { href: "/leads",         label: "Leads",          icon: Users,           roles: null },
  { href: "/bookings",      label: "Bookings",       icon: CalendarCheck,   roles: null },
  { href: "/conversations", label: "Chats",          icon: MessageCircle,   roles: null },
  { href: "/settings",      label: "Settings",       icon: Settings,        roles: ["admin", "manager"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "");
        const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Admin";
        setUserName(name);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    });
  }, []);

  const navItems = allNavItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "HS";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[70px] border-b border-gray-700">
        <div className="bg-blue-600 rounded-lg p-2">
          <Car size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Handysolver</p>
          <p className="text-gray-400 text-xs">Car Dealership</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — hidden at ≤900px */}
      <aside className="hidden min-[900px]:flex w-64 min-h-screen bg-gray-900 flex-col shrink-0 border-r border-gray-700">
        {sidebarContent}
      </aside>

      {/* Bottom tab bar — visible at ≤900px */}
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

        {/* Sign out as extra tab if needed — or keep it off the bar */}
      </nav>

      {/* Sign out confirmation modal */}
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
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
