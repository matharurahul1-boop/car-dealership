"use client";
import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent;
  }
}

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Pick up event captured by the early inline script
    if (window.__installPrompt) {
      setInstallPrompt(window.__installPrompt);
    }

    // Also listen for it firing after mount
    const handler = (e: Event) => {
      e.preventDefault();
      window.__installPrompt = e as BeforeInstallPromptEvent;
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsStandalone(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) return null;

  // On non-iOS without a prompt available, hide the button entirely
  if (!isIOS && !installPrompt) return null;

  const handleClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setIsStandalone(true);
      setInstallPrompt(null);
      window.__installPrompt = undefined;
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="p-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        title="Install App"
      >
        <Download size={17} />
      </button>

      {/* iOS-only: can't trigger install programmatically, show steps */}
      {showIOSModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-[#1e293b] border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-xl">H</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Install Handysolver</p>
                  <p className="text-gray-400 text-xs">Car Dealership Dashboard</p>
                </div>
              </div>
              <button onClick={() => setShowIOSModal(false)} className="text-gray-400 hover:text-white ml-2">
                <X size={18} />
              </button>
            </div>

            <p className="text-gray-400 text-xs mb-3">Follow these steps in Safari:</p>
            <div className="space-y-3">
              {[
                { step: 1, text: <>Tap the <Share size={13} className="inline text-blue-400 mx-0.5" /> <strong className="text-white">Share</strong> button at the bottom</> },
                { step: 2, text: <><strong className="text-white">Scroll down</strong> and tap <strong className="text-white">"Add to Home Screen"</strong></> },
                { step: 3, text: <>Tap <strong className="text-white">"Add"</strong> in the top right corner</> },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-xs font-bold">{step}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
