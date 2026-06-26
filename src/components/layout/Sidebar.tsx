"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CalendarCheck, MessageCircle,
  Settings, Car, LogOut, Menu, X, AlertTriangle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/leads",          label: "Leads",          icon: Users },
  { href: "/bookings",       label: "Bookings",       icon: CalendarCheck },
  { href: "/conversations",  label: "Conversations",  icon: MessageCircle },
  { href: "/settings",       label: "Settings",       icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || "");
        const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Admin";
        setUserName(name);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "HS";

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Car size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Handysolver</p>
            <p className="text-gray-400 text-xs">Car Dealership</p>
          </div>
        </div>
        <button className="lg:hidden text-gray-400" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
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
      {/* Mobile trigger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 transform transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-gray-900 flex-col shrink-0">
        {content}
      </aside>

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
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
