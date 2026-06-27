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
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));

    const verifyInstalled = async () => {
      if (localStorage.getItem(INSTALLED_KEY) !== "true") return;
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

  const handleYes = async () => {
    setShowConfirm(false);
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, "true");
        setInstallPrompt(null);
        window.__installPrompt = undefined;
      }
    }
    // iOS: no programmatic prompt — browser handles it via its own UI
  };

  if (isInstalled) {
    return (
      <button
        onClick={() => window.open(window.location.origin + "/dashboard", "_blank", "noopener")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        title="Open installed app"
      >
        <ExternalLink size={15} />
        <span className="hidden sm:inline">Open App</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        title="Install App"
      >
        <Download size={17} />
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <Download size={22} className="text-blue-400" />
              </div>
            </div>
            <h3 className="text-white font-semibold text-center text-base mb-1">Install App</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Do you want to install the app?
            </p>
            {isIOS && (
              <p className="text-gray-500 text-xs text-center mb-4 leading-relaxed">
                Tap <Share size={11} className="inline text-blue-400 mx-0.5" /> <strong className="text-white">Share</strong> → <strong className="text-white">Add to Home Screen</strong> in Safari.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleYes}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
