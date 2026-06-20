import { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function InstallBanner() {
  const { canInstall, isInstalled, isIOSInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-banner-dismissed') === '1');

  const dismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setDismissed(true);
  };

  if (isInstalled || dismissed) return null;

  // Android / Chrome: show native install prompt button
  if (canInstall) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-indigo-900 text-white flex items-center gap-3 shadow-2xl md:max-w-sm md:left-auto md:right-4 md:bottom-4 md:rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shrink-0">
          📱
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Install Vidyanet App</p>
          <p className="text-xs text-indigo-300 mt-0.5">Works offline · No App Store needed</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="text-indigo-400 hover:text-indigo-200 text-xs px-2 py-1"
          >
            Later
          </button>
          <button
            onClick={install}
            className="bg-white text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari: manual instruction
  if (isIOSInstallable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-indigo-900 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shrink-0 mt-0.5">
              📱
            </div>
            <div>
              <p className="text-sm font-semibold">Install Vidyanet on iPhone</p>
              <p className="text-xs text-indigo-300 mt-1 leading-relaxed">
                Tap the <span className="inline-flex items-center gap-0.5 font-bold text-white bg-indigo-700 px-1.5 py-0.5 rounded">Share ⬆</span> button at the bottom, then <span className="font-bold text-white">"Add to Home Screen"</span>
              </p>
            </div>
          </div>
          <button onClick={dismiss} className="text-indigo-400 hover:text-indigo-200 text-xl leading-none shrink-0 mt-0.5">×</button>
        </div>
      </div>
    );
  }

  return null;
}
