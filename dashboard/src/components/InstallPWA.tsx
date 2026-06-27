"use client";
import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect successful install
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  // Already installed or not installable
  if (installed) return null;

  // iOS — show share hint
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSHint(true)}
          className="p-2 rounded-lg transition-colors relative"
          style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }}
          title="Install App"
        >
          <Download size={17} />
        </button>

        {showIOSHint && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center p-4" onClick={() => setShowIOSHint(false)}>
            <div
              className="bg-[#1e293b] border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl mb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold text-sm">Install on iPhone / iPad</p>
                <button onClick={() => setShowIOSHint(false)} className="text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-xl">H</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Handysolver</p>
                  <p className="text-gray-400 text-xs">Car Dealership Dashboard</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-xs font-bold">1</span>
                  </div>
                  <p className="text-gray-300 text-sm flex items-center gap-1.5">
                    Tap the <Share size={14} className="text-blue-400 inline" /> <strong>Share</strong> button in Safari
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-xs font-bold">2</span>
                  </div>
                  <p className="text-gray-300 text-sm">Tap <strong>"Add to Home Screen"</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-xs font-bold">3</span>
                  </div>
                  <p className="text-gray-300 text-sm">Tap <strong>"Add"</strong> to install</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android/Chrome — native install prompt
  if (!installPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{ background: "#2563eb", color: "white" }}
      title="Install App"
    >
      <Download size={14} />
      Install
    </button>
  );
}
