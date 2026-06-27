"use client";
import { useEffect, useState } from "react";
import { Download, X, Share, Car, Wifi, Bell, BarChart2, ExternalLink } from "lucide-react";

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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Already running inside the installed app — hide everything
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    // Check if previously installed (persisted flag)
    if (localStorage.getItem(INSTALLED_KEY) === "true") {
      setIsInstalled(true);
    }

    // Pick up prompt captured by early inline script
    if (window.__installPrompt) {
      setInstallPrompt(window.__installPrompt);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__installPrompt = e as BeforeInstallPromptEvent;
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // If prompt fires again, app was uninstalled — clear flag
      setIsInstalled(false);
      localStorage.removeItem(INSTALLED_KEY);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(false); // still in browser, but now installed
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
      setShowModal(false);
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem(INSTALLED_KEY, "true");
        setInstallPrompt(null);
        window.__installPrompt = undefined;
      }
    }
  };

  const handleOpenApp = () => {
    // Opening the PWA start URL in a new tab lets Chrome/Android redirect into the installed app
    window.open(window.location.origin + "/dashboard", "_blank", "noopener");
    setShowModal(false);
  };

  const features = [
    { icon: Wifi,      text: "Works offline — no internet needed" },
    { icon: Bell,      text: "Fast access from your home screen" },
    { icon: BarChart2, text: "Full dashboard experience as an app" },
    { icon: Car,       text: "Manage leads, bookings & chats" },
  ];

  return (
    <>
      {isInstalled ? (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          title="Open installed app"
        >
          <ExternalLink size={15} />
          <span className="hidden sm:inline">Open App</span>
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="p-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
          title="Install App"
        >
          <Download size={17} />
        </button>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#0f172a] border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="bg-blue-600 px-5 pt-6 pb-8 text-center relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-blue-200 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Car size={32} className="text-white" />
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">Handysolver</h2>
              <p className="text-blue-200 text-sm mt-0.5">Car Dealership Dashboard</p>
              {isInstalled && (
                <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                  ✓ Installed
                </span>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-5 -mt-4">
              <div className="bg-[#1e293b] rounded-xl p-4 space-y-3 mb-5">
                {features.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-blue-400" />
                    </div>
                    <p className="text-gray-300 text-sm">{text}</p>
                  </div>
                ))}
              </div>

              {isInstalled ? (
                /* Already installed — offer to open the app */
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleOpenApp}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={15} /> Open App
                  </button>
                </div>
              ) : isIOS ? (
                /* iOS — show manual steps */
                <>
                  <p className="text-gray-400 text-xs mb-3 text-center">Install via Safari:</p>
                  <div className="space-y-2 mb-5">
                    {[
                      <>Tap <Share size={12} className="inline text-blue-400 mx-0.5" /> <strong className="text-white">Share</strong> at the bottom</>,
                      <>Tap <strong className="text-white">"Add to Home Screen"</strong></>,
                      <>Tap <strong className="text-white">"Add"</strong> to confirm</>,
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-gray-300 text-sm">{text}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-full py-3 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600 transition-colors">
                    Got it
                  </button>
                </>
              ) : (
                /* Android / Desktop Chrome — native prompt */
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstall}
                    disabled={!installPrompt}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={15} /> Install
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
