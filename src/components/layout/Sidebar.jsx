import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const navItems = [
  { to: '/',           label: 'Dashboard',   icon: '🏠', adminOnly: true },
  { to: '/students',   label: 'Students',    icon: '🎒' },
  { to: '/attendance', label: 'Attendance',  icon: '📅' },
  { to: '/marks',      label: 'Marks',       icon: '📝' },
  { to: '/fees',       label: 'Fees',        icon: '💰' },
  { to: '/team',       label: 'Team',        icon: '👥', adminOnly: true },
  { to: '/whatsapp',   label: 'WhatsApp',    icon: '💬' },
  { to: '/documents/leaving-certificate', label: 'Documents',     icon: '📄', adminOnly: true, matchPrefix: '/documents' },
  { to: '/configuration/school',          label: 'Configuration', icon: '⚙️', adminOnly: true, matchPrefix: '/configuration' },
];

// ── Profile modal ──────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose }) {
  const [view, setView]   = useState('profile');
  const [form, setForm]   = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword });
      toast.success('Password changed');
      setView('profile');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        {view === 'profile' ? (
          <>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{user?.name}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">{user?.role}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-5">
              {[['✉️', 'Email', user?.email], ['🏫', 'School', user?.schoolName]].filter(([,, v]) => v).map(([icon, label, val]) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span>{icon}</span>
                  <div><p className="text-xs text-gray-400">{label}</p><p className="text-gray-800 font-medium">{val}</p></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('password')} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Change Password</button>
              <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium">Close</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView('profile')} className="text-gray-400 hover:text-gray-600 text-xl">‹</button>
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[['oldPassword','Old Password',''], ['newPassword','New Password','Min 6 characters'], ['confirmPassword','Confirm Password','']].map(([name, label, ph]) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="password" required minLength={name === 'newPassword' ? 6 : undefined}
                    placeholder={ph} value={form[name]}
                    onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Nav links list (shared) ────────────────────────────────────────────────────
function NavList({ user, onNavigate }) {
  const location = useLocation();
  const visible = navItems.filter((item) => !item.adminOnly || user?.role === 'admin');
  return (
    <ul className="space-y-0.5 p-3">
      {visible.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) => {
              const active = isActive || (item.matchPrefix && location.pathname.startsWith(item.matchPrefix));
              return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`;
            }}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-indigo-900 h-screen flex-col text-white shrink-0">
        <div className="p-5 border-b border-indigo-700 shrink-0">
          <h1 className="text-xl font-bold">Vidyanet ERP</h1>
          <p className="text-indigo-300 text-sm mt-0.5">School Management</p>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <NavList user={user} />
        </nav>
        <div className="p-3 border-t border-indigo-700 shrink-0 space-y-1">
          <button onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-800 transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.schoolName || user?.role}</p>
            </div>
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/40 transition-colors text-indigo-300 hover:text-red-300 text-sm">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}

// ── Mobile drawer ──────────────────────────────────────────────────────────────
export function MobileDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* Backdrop — always rendered, fades in/out */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer — always rendered, slides in/out */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-indigo-900 text-white flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-700 shrink-0">
          <div>
            <h1 className="text-xl font-bold">Vidyanet ERP</h1>
            <p className="text-indigo-300 text-sm">School Management</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto">
          <NavList user={user} onNavigate={onClose} />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-indigo-700 shrink-0 space-y-1">
          <button onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-800 transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.schoolName || user?.role}</p>
            </div>
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/40 transition-colors text-indigo-300 hover:text-red-300 text-sm">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    </>
  );
}
