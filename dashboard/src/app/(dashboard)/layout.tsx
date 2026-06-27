import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[calc(56px+env(safe-area-inset-bottom))] min-[900px]:pb-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
