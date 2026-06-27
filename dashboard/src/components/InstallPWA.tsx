"use client";
import { useEffect, useState } from "react";
import { Download, ExternalLink, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent;
  }
}

const INSTALLED_KEY = "pwa-installed";

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));

    const verifyInstalled = async () => {
      const storedInstalled = localStorage.getItem(INSTALLED_KEY) === "true";
      if (!storedInstalled) return;
      if ("getInstalledRelatedApps" in navigator) {
        try {
          const apps = await (navigator as unknown as {
            getInstalledRelatedApps: () => Promise<{ platform: string }[]>
          }).getInstalledRelatedApps();
          if (!apps.some((a) => a.platform === "webapp")) {
            localStorage.removeItem(INSTALLED_KEY);
            setIsInstalled(false);
            return;
          }
        } catch { /* trust localStorage */ }
      }
      setIsInstalled(true);
    };
    verifyInstalled();

    if (window.__installPrompt) setInstallPrompt(window.__installPrompt);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__installPrompt = e as BeforeInstallPromptEvent;
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstalled(false);
      localStorage.removeItem(INSTALLED_KEY);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem(INSTALLED_KEY, "true");
      setInstallPrompt(null);
      window.__installPrompt = undefined;
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, "true");
        setInstallPrompt(null);
        window.__installPrompt = undefined;
      }
    } else if (isIOS) {
      setShowIOSHint((v) => !v);
    }
  };

  const handleOpenApp = () => {
    window.open(window.location.origin + "/dashboard", "_blank", "noopener");
  };

  if (isInstalled) {
    return (
      <button
        onClick={handleOpenApp}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        title="Open installed app"
      >
        <ExternalLink size={15} />
        <span className="hidden sm:inline">Open App</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstall}
        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        title="Install App"
      >
        <Download size={17} />
      </button>

      {/* iOS-only minimal hint — no guide, just the one tap needed */}
      {showIOSHint && (
        <div
          className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-[200]"
          onMouseLeave={() => setShowIOSHint(false)}
        >
          <p className="text-white text-xs font-semibold mb-2">Install on iOS</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Tap <Share size={11} className="inline text-blue-400 mx-0.5" /> <strong className="text-white">Share</strong>, then <strong className="text-white">Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
