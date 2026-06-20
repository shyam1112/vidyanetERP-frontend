import { useAuth } from '../../context/AuthContext';

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-gray-800 truncate">{title || 'Vidyanet ERP'}</h2>
        {user?.schoolName && title !== user.schoolName && (
          <p className="text-xs text-gray-400 truncate">{user.schoolName}</p>
        )}
      </div>
    </header>
  );
}
