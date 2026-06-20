import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-4 text-sm">
      <span>🔄 New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-white text-indigo-700 font-semibold px-3 py-1 rounded-lg hover:bg-indigo-50 text-xs"
      >
        Update now
      </button>
    </div>
  );
}
