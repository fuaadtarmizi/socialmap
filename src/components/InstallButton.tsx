import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

const isInStandaloneMode = () =>
  (window.navigator as any).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

export const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <div>
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors active:scale-95"
        >
          <Download size={16} />
          Add to Home Screen
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
          <div className="bg-[#1c1c1e] rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Install Social Map</h2>
              <button onClick={() => setShowIOSGuide(false)}>
                <X size={20} className="text-white/50" />
              </button>
            </div>
            <ol className="space-y-3 text-white/80 text-sm">
              {isIOS() ? (
                <>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Tap the <Share size={14} className="inline mb-0.5" /> <strong>Share</strong> button at the bottom of Safari</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Tap <strong>"Add"</strong> to confirm</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <span>Open this page in <strong>Chrome</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <span>Tap the <strong>3-dot menu</strong> (⋮) at the top right</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="bg-white/10 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <span>Tap <strong>"Add to Home Screen"</strong> and confirm</span>
                  </li>
                </>
              )}
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
